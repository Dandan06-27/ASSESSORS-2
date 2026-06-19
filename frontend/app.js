/* Land Bookkeeping — front-end app (HTML/CSS + vanilla JS). Session token stored in localStorage per requirements. */

const STORAGE_KEY = 'landbook_token';
const STORAGE_USER = 'landbook_user';

const ROLE_SUPER = 'super_admin';
const ROLE_ASSISTANT = 'assistant_admin';
const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';

let systemConfig = { classifications: {}, barangays: [] };
let mapInstance = null;
let qgisLayer = null;
let markersLayer = null;
let highlightLayer = null;
let olMarkersLayer = null;
let olHighlightLayer = null;
let socket = null;
let currentUser = null;
let profileUserId = null;

// Print functionality variables
let selectedFeatureForPrint = null;
let selectedFeatureDataForPrint = null;

function hasQgis2webMap() {
  return typeof window.map !== 'undefined' && window.map && typeof window.map.getView === 'function' && typeof ol !== 'undefined';
}

function getOlCoordinate(lat, lng) {
  if (!hasQgis2webMap()) return null;
  return ol.proj.fromLonLat([Number(lng), Number(lat)]);
}

function getCadastralFeatures() {
  return window.features_CADASTRALCLAIMANTS_1 ||
    (window.jsonSource_CADASTRALCLAIMANTS_1 && window.jsonSource_CADASTRALCLAIMANTS_1.getFeatures && window.jsonSource_CADASTRALCLAIMANTS_1.getFeatures()) ||
    [];
}

function getFeatureCadastralValue(feature) {
  if (!feature) return null;
  const candidateFields = ['LOT NUMBER', 'PIN', 'CadastralLot', 'Lot Number', 'lot_number', 'LOTNO', 'LOT', 'PARCEL', 'parcel_no', 'parcel'];
  for (const field of candidateFields) {
    try {
      const v = typeof feature.get === 'function' ? feature.get(field) : (feature.properties && feature.properties[field]);
      if (v != null && String(v).trim() !== '') return String(v).trim();
    } catch (e) {
      // ignore
    }
  }
  try {
    const keys = feature.getKeys ? feature.getKeys() : Object.keys(feature.properties || {});
    for (const k of keys) {
      if (/pin|lot|parcel|parcel_no|lotno|lot_number|number/i.test(k)) {
        const v = typeof feature.get === 'function' ? feature.get(k) : (feature.properties && feature.properties[k]);
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function normalizeLotKey(v) {
  if (v == null) return null;
  return String(v).replace(/\s|\-/g, '').toLowerCase();
}

function findClosestOlFeature(coord, features) {
  let best = null;
  let bestDist = Infinity;
  for (const f of features) {
    if (!f || typeof f.getGeometry !== 'function') continue;
    const geom = f.getGeometry();
    if (!geom || typeof geom.closestPoint !== 'function') continue;
    try {
      const closest = geom.closestPoint(coord);
      const dx = closest[0] - coord[0];
      const dy = closest[1] - coord[1];
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = f;
      }
    } catch (ex) {
      // Ignore geometry issues and continue.
    }
  }
  return best;
}

const qgisLayerNames = [
  'TOLEDOLANDUSEFINAL',
  'TOLEDO BASE SHAPE',
  'Assessors Data',
  'TOLEDO PARCELS',
  'PSA BUILDING FOOTPRINT',
  'PHL ADMBDNDA ADM3 PSA NAMRIA 20200529',
  'PHL ADM3',
  'LINE FEATURES',
  'LINE',
  'GIS OSM ROADS FREE 1',
  'BARANGAY PARTITION',
  'ATLS TENEMENT PER BATGY.',
  'DIMENTION 2',
  'CONTOURS',
  'CEBECO POST',
  'BRGY. BOUNDARY 2',
  'CADASTRAL CLAIMANTS',
  'AREA FEATURES',
];

const defaultVisibleLayers = new Set(['CADASTRAL CLAIMANTS']);

function getDefaultVisibleLayers() {
  return qgisLayerNames.filter((name) => defaultVisibleLayers.has(name));
}

function getLayerId(name) {
  return `layer-toggle-${name.replace(/[^a-z0-9]+/gi, '_')}`;
}

function getSelectedLayers() {
  const controls = document.getElementById('layer-controls');
  if (!controls) return getDefaultVisibleLayers();
  return qgisLayerNames.filter((name) => {
    const el = document.getElementById(getLayerId(name));
    return el ? el.checked : false;
  });
}

function updateQgisLayers() {
  if (!qgisLayer) return;
  const selected = getSelectedLayers();
  if (!selected.length) {
    qgisLayer.setParams({ layers: '' });
  } else {
    qgisLayer.setParams({ layers: selected.join(',') });
  }
  qgisLayer.redraw();
}

function clearHighlight() {
  if (hasQgis2webMap()) {
    try {
      if (olHighlightLayer && olHighlightLayer.getSource) {
        olHighlightLayer.getSource().clear();
      }
    } catch (e) {
      console.error('clearHighlight error', e);
    }
    return;
  }

  if (highlightLayer) {
    try {
      highlightLayer.clearLayers();
    } catch (e) {
      console.error('clearHighlight error', e);
    }
  }
}

function highlightLandSelection(lat, lng, opts = {}, targetCadastral) {
  // If current user is admin/staff, clear any existing selection/info first
  if (hasRole(ROLE_SUPER, ROLE_ASSISTANT, ROLE_ADMIN)) {
    try {
      if (typeof window.clearSelectedFeature === 'function') window.clearSelectedFeature();
    } catch (e) {}
    try {
      if (typeof window.clearCadastralInfo === 'function') window.clearCadastralInfo();
    } catch (e) {}
    try { clearHighlight(); } catch (e) {}
  }

  if (hasQgis2webMap()) {
    clearHighlight();
    try {
      const center = getOlCoordinate(lat, lng);
      if (!center) return;

      const duration = opts.duration != null ? opts.duration : 400;
      const targetZoom = opts.maxZoom || 16;
      const animateView = () => {
        if (window.map && window.map.getView) {
          try {
            window.map.getView().animate({ center, zoom: targetZoom, duration });
          } catch (e) {
            // ignore animation errors
          }
        }
      };

      // Animate first, then attempt selection after animation completes so features are rendered.
      animateView();

      const doSelection = (attempts = 3) => {
        if (!window.map) {
          if (attempts > 0) setTimeout(() => doSelection(attempts - 1), 200);
          return;
        }

        const pixel = window.map.getPixelFromCoordinate(center);
        let selectedFeature = null;

        // Increase hit tolerance when zoomed out to account for smaller rendered pixels
        let dynamicTolerance = 8;
        try {
          const z = window.map.getView().getZoom();
          if (z == null || z < 13) dynamicTolerance = 24;
          else if (z < 15) dynamicTolerance = 12;
          else dynamicTolerance = 8;
        } catch (e) {
          dynamicTolerance = opts.hitTolerance || 8;
        }

        if (window.map && window.map.forEachFeatureAtPixel && window.lyr_CADASTRALCLAIMANTS_1) {
          window.map.forEachFeatureAtPixel(pixel, (feature, layer) => {
            if (!selectedFeature && feature && layer === window.lyr_CADASTRALCLAIMANTS_1) {
              selectedFeature = feature;
              return true;
            }
            return false;
          }, {
            hitTolerance: opts.hitTolerance != null ? opts.hitTolerance : dynamicTolerance,
            layerFilter: (layer) => layer === window.lyr_CADASTRALCLAIMANTS_1,
          });
        }

        if (!selectedFeature) {
          const features = getCadastralFeatures();
          if (features.length) {
            selectedFeature = findClosestOlFeature(center, features);
          }
        }

        if (selectedFeature) {
          // If a target cadastral was provided, prefer a feature that matches it.
          if (targetCadastral) {
            try {
              const selVal = getFeatureCadastralValue(selectedFeature);
              const targetNorm = normalizeLotKey(targetCadastral);
              if (targetNorm && selVal && normalizeLotKey(selVal) !== targetNorm) {
                const features = getCadastralFeatures();
                for (const f of features) {
                  const fv = getFeatureCadastralValue(f);
                  if (fv && normalizeLotKey(fv) === targetNorm) {
                    selectedFeature = f;
                    break;
                  }
                }
              }
            } catch (e) {
              // ignore matching errors
            }
          }

          if (typeof selectFeature === 'function' && window.lyr_CADASTRALCLAIMANTS_1) {
            setTimeout(() => {
              try {
                selectFeature(selectedFeature, window.lyr_CADASTRALCLAIMANTS_1);
              } catch (err) {
                console.error('selectFeature failed', err);
              }
            }, 50);
          }
          return;
        }

        if (attempts > 0) {
          setTimeout(() => doSelection(attempts - 1), 300);
          return;
        }
      };

      // Wait for the view animation to finish before attempting selection
      setTimeout(() => doSelection(3), duration + 80);
    } catch (e) {
      console.error('highlightLandSelection error', e);
    }
    return;
  }

  if (!mapInstance) return;
  clearHighlight();
  const gridSize = Number(opts.gridSize || 3); // 3x3 by default
  const cellSize = Number(opts.cellSize || 0.002); // degrees (~200m, approximate)
  const half = Math.floor(gridSize / 2);

  highlightLayer = highlightLayer || L.layerGroup().addTo(mapInstance);

  const rects = [];
  for (let i = -half; i <= half; i++) {
    for (let j = -half; j <= half; j++) {
      const centerLat = lat + i * cellSize;
      const centerLng = lng + j * cellSize;
      const sw = [centerLat - cellSize / 2, centerLng - cellSize / 2];
      const ne = [centerLat + cellSize / 2, centerLng + cellSize / 2];
      const rect = L.rectangle([sw, ne], {
        color: opts.color || '#c92b2b',
        weight: opts.weight || 1.5,
        fillOpacity: opts.fillOpacity != null ? opts.fillOpacity : 0.18,
        interactive: false,
      });
      rect.addTo(highlightLayer);
      rects.push(rect.getBounds());
    }
  }

  // Fit view to the combined bounds with padding
  try {
    const combined = rects.reduce((acc, b) => acc ? acc.extend(b) : L.latLngBounds(b), null);
    if (combined && combined.isValid()) {
      mapInstance.fitBounds(combined.pad(0.25), { maxZoom: opts.maxZoom || 17 });
    }
  } catch (e) {
    console.error('highlightLandSelection fitBounds error', e);
  }
}

// Expose for debugging / manual test in Console
if (typeof window !== 'undefined') {
  window.highlightLandSelection = highlightLandSelection;
  window.clearHighlight = clearHighlight;
}

function buildLayerControls() {
  const container = document.getElementById('layer-controls');
  if (!container) return;
  container.innerHTML = '';
  const label = document.createElement('div');
  label.className = 'layer-controls-label';
  label.textContent = 'Toggle layers';
  container.appendChild(label);

  const list = document.createElement('div');
  list.className = 'layer-controls-list';

  qgisLayerNames.forEach((name) => {
    const id = getLayerId(name);
    const item = document.createElement('label');
    item.className = 'layer-control-item';
    const checked = defaultVisibleLayers.has(name) ? 'checked' : '';
    item.innerHTML = `
      <input type="checkbox" id="${id}" ${checked} />
      <span>${name}</span>
    `;
    item.querySelector('input').addEventListener('change', updateQgisLayers);
    list.appendChild(item);
  });

  container.appendChild(list);

  const button = document.getElementById('toggle-layer-button');
  if (button) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      container.classList.toggle('hidden');
      button.setAttribute('aria-expanded', String(!container.classList.contains('hidden')));
    });
  }

  document.addEventListener('click', (event) => {
    if (!container || !button) return;
    if (container.classList.contains('hidden')) return;
    if (!container.contains(event.target) && !button.contains(event.target)) {
      container.classList.add('hidden');
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

function setSession(token, user) {
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  currentUser = user;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_USER);
  currentUser = null;
}

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data?.message || (Array.isArray(data?.message) ? data.message.join(', ') : null) || res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data;
}

function hasRole(...roles) {
  if (!currentUser) return false;
  return roles.includes(currentUser.role);
}

function applyRoleUi() {
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.classList.toggle('hidden', !hasRole(ROLE_SUPER, ROLE_ASSISTANT, ROLE_ADMIN));
  });
  document.querySelectorAll('.staff-only').forEach((el) => {
    el.classList.toggle('hidden', !hasRole(ROLE_SUPER, ROLE_ASSISTANT));
  });
  document.querySelectorAll('.org-only').forEach((el) => {
    el.classList.toggle('hidden', !hasRole(ROLE_SUPER, ROLE_ASSISTANT));
  });
  document.querySelectorAll('.user-visible').forEach((el) => {
    el.classList.toggle('hidden', hasRole(ROLE_SUPER, ROLE_ASSISTANT));
  });
  const auditCard = document.getElementById('audit-card');
  if (auditCard) auditCard.classList.toggle('hidden', !hasRole(ROLE_SUPER, ROLE_ASSISTANT));
}

function getBulkContext() {
  if (!document.getElementById('page-records').classList.contains('hidden')) return '#table-records';
  if (!document.getElementById('page-view-land').classList.contains('hidden')) return '#table-view-land';
  return null;
}

function getSelectedRecordIds(containerSelector) {
  return Array.from(document.querySelectorAll(`${containerSelector} .select-record-checkbox`))
    .filter((input) => input.checked)
    .map((input) => input.dataset.id)
    .filter(Boolean);
}

function updateBulkOverlay() {
  const overlay = document.getElementById('bulk-delete-overlay');
  const countEl = document.getElementById('bulk-delete-count');
  const active = getBulkContext();
  if (!overlay || !countEl || !active || !hasRole(ROLE_SUPER, ROLE_ADMIN)) {
    if (overlay) overlay.classList.add('hidden');
    return;
  }
  const ids = getSelectedRecordIds(active);
  if (!ids.length) {
    overlay.classList.add('hidden');
    return;
  }
  const visibleCheckboxes = Array.from(document.querySelectorAll(`${active} .select-record-checkbox`));
  const allSelected = visibleCheckboxes.length > 0 && visibleCheckboxes.every((input) => input.checked);
  overlay.classList.remove('hidden');
  countEl.textContent = `${ids.length} selected`;
  const selectAllBtn = document.getElementById('bulk-select-all');
  if (selectAllBtn) selectAllBtn.textContent = allSelected ? 'Deselect all' : 'Select all';
}

function setVisibleCheckboxes(checked) {
  const active = getBulkContext();
  if (!active) return;
  document.querySelectorAll(`${active} .select-record-checkbox`).forEach((input) => {
    input.checked = checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  updateBulkOverlay();
}

async function deleteSelectedRecordsFromActive() {
  const active = getBulkContext();
  if (!active) return;
  const ids = getSelectedRecordIds(active);
  if (!ids.length) {
    alert('Select at least one record to delete.');
    return;
  }
  if (!confirm(`Delete ${ids.length} selected record(s)? This action cannot be undone.`)) return;

  const chunkSize = 250;
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  try {
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      await api('/api/records/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: chunk }),
      });
    }
  } catch (error) {
    console.error('Bulk delete chunk failed:', error);
    // fallback on the first chunk only if the primary route is missing
    if (error.message && error.message.toLowerCase().includes('not found')) {
      try {
        await api('/api/records', {
          method: 'DELETE',
          body: JSON.stringify({ ids }),
        });
      } catch (fallbackError) {
        console.error('Bulk delete DELETE fallback failed:', fallbackError);
        alert(`Unable to delete selected records: ${fallbackError.message}`);
        return;
      }
    } else {
      alert(`Unable to delete selected records: ${error.message}`);
      return;
    }
  }

  setVisibleCheckboxes(false);
  if (active === '#table-records') {
    await refreshRecords();
  } else if (active === '#table-view-land') {
    await refreshViewLand();
  }
}

function clearBulkSelection() {
  setVisibleCheckboxes(false);
}

function showAuth() {
  document.getElementById('view-auth').classList.remove('hidden');
  document.getElementById('view-app').classList.add('hidden');
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function showApp() {
  document.getElementById('view-auth').classList.add('hidden');
  document.getElementById('view-app').classList.remove('hidden');
  applyRoleUi();
  updateBulkOverlay();
  updateSelfChip();
  connectRealtime();
}

function updateSelfChip() {
  const name = document.getElementById('self-name');
  const img = document.getElementById('self-avatar');
  if (!currentUser) return;
  name.textContent = currentUser.fullName || currentUser.email;
  if (currentUser.profilePicture) {
    img.src = currentUser.profilePicture;
    img.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
    img.removeAttribute('src');
  }
}

function navigate(page) {
  document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.remove('hidden');
  if (page === 'dashboard') refreshDashboard();
  if (page === 'records') refreshRecords();
  if (page === 'property-records') refreshPropertyRecords();
  if (page === 'view-land') refreshViewLand();
  if (page === 'admin') refreshAdmin();
  if (page === 'org') refreshOrgChart();
}

function openRpuView(record) {
  const modalViewRpu = document.getElementById('modal-view-rpu');
  const viewRpuBody = document.getElementById('view-rpu-body');
  if (!modalViewRpu || !viewRpuBody) return;

  // Extract bearings and format them (e.g., "S 55°32' W")
  const formatBearing = (degrees, minutes) => {
    if (!degrees) return '';
    const degInput = String(degrees).trim();
    const minInput = String(minutes || '').trim();

    const degDirectionMatch = degInput.match(/[NSEW]/i);
    const degNumberMatch = degInput.match(/(\d+)/);
    const minNumberMatch = minInput.match(/(\d+)/);
    const minDirectionMatch = minInput.match(/[NSEW]/i);

    const degDir = degDirectionMatch ? degDirectionMatch[0].toUpperCase() : '';
    const degNum = degNumberMatch ? degNumberMatch[1] : '';
    const minNum = minNumberMatch ? minNumberMatch[1] : '';
    const minDir = minDirectionMatch ? minDirectionMatch[0].toUpperCase() : '';

    const degreeText = degNum ? `${degNum}°` : '';
    const minuteText = minNum ? `${minNum}'` : '';

    if (degreeText && minuteText) {
      if (degDir && minDir) {
        return `${degDir} ${degreeText}${minuteText} ${minDir}`;
      }
      if (degDir) {
        return `${degDir} ${degreeText}${minuteText}`;
      }
      if (minDir) {
        return `${degreeText}${minuteText} ${minDir}`;
      }
      return `${degreeText}${minuteText}`;
    }

    if (degreeText) {
      return degDir ? `${degDir} ${degreeText}` : degreeText;
    }
    if (minuteText) {
      return minDir ? `${minuteText} ${minDir}` : minuteText;
    }
    return degInput;
  };

  // Format the tie line / reference point bearing
  const tieLineBearing = formatBearing(record.degree, record.minutes);
  const formatDistance = (value) => escapeHtml(String(value || '').replace(/[@<>]/g, ''));

  // Build technical description rows (1-2, 2-3, 3-4, 4-1, etc.)
  let techDescTableRows = '';
  
  // Add tie line (Reference Point) as first row
  if (record.refPoint) {
    techDescTableRows += `
            <tr class="tp-row">
              <td class="line-cell">${escapeHtml(record.refPoint)}</td>
              <td class="bearing-cell">${tieLineBearing}</td>
              <td class="distance-cell">${formatDistance(record.distance)}</td>
            </tr>`;
  }

  // Add technical description rows
  let techDesc = [];
  if (Array.isArray(record.technicalDescription)) {
    techDesc = record.technicalDescription;
  } else if (typeof record.technicalDescription === 'string' && record.technicalDescription) {
    // If the API stored it as a joined string, try to parse it back to an array
    try {
      const parsed = JSON.parse(record.technicalDescription);
      if (Array.isArray(parsed)) {
        techDesc = parsed;
      }
    } catch {
      // fallback to parse by separators if it is a joined string
      const parts = record.technicalDescription.split(' | ').map((entry) => entry.trim()).filter(Boolean);
      for (let i = 0; i < parts.length; i += 3) {
        const group = parts.slice(i, i + 3);
        const distanceMatch = group[0]?.match(/Distance:\s*(.*)/i);
        const degreesMatch = group[1]?.match(/Degrees:\s*(.*)/i);
        const minutesMatch = group[2]?.match(/Minutes:\s*(.*)/i);
        techDesc.push({
          distance: distanceMatch ? distanceMatch[1].trim() : '',
          degrees: degreesMatch ? degreesMatch[1].trim() : '',
          minutes: minutesMatch ? minutesMatch[1].trim() : '',
        });
      }
    }
  }

  techDesc.forEach((item, index) => {
    const nextPoint = index === techDesc.length - 1 ? 1 : index + 2;
    const lineNum = `${index + 1}-${nextPoint}`;
    const bearing = item.degrees ? formatBearing(item.degrees, item.minutes) : '';
    const distance = formatDistance(item.distance);
    techDescTableRows += `
            <tr class="tech-row">
              <td class="line-cell">${lineNum}</td>
              <td class="bearing-cell">${bearing}</td>
              <td class="distance-cell">${distance}</td>
            </tr>`;
  });

  // Build HTML table - matching the technical descriptions format from the attachment
  const baseHtml = `
    <div class="technical-desc-container">
      <table class="technical-desc-table">
        <thead>
          <tr class="header-row">
            <th colspan="3">TECHNICAL DESCRIPTIONS</th>
          </tr>
          <tr class="subheader-row">
            <th colspan="3">LOT ${escapeHtml(record.lotNo || '')}</th>
          </tr>
          <tr class="column-headers">
            <th>LINES</th>
            <th>BEARINGS</th>
            <th>DISTANCES</th>
          </tr>
        </thead>
        <tbody>
          ${techDescTableRows}
        </tbody>
      </table>
      <div class="additional-info">
        <dl>
          <dt>ID</dt><dd>${escapeHtml(String(record.id || ''))}</dd>
          <dt>Barangay</dt><dd>${escapeHtml(record.barangay || '')}</dd>
          <dt>ARP No.</dt><dd>${escapeHtml(record.arpNo || '')}</dd>
          <dt>Title No.</dt><dd>${escapeHtml(record.titleNo || '')}</dd>
        </dl>
      </div>
    </div>
  `;

  viewRpuBody.innerHTML = baseHtml;
  modalViewRpu.classList.remove('hidden');
}

async function refreshPropertyRecords() {
  try {
    const q = new URLSearchParams();
    const search = document.getElementById('proprec-search');
    if (search && search.value) q.set('q', search.value.trim());
    const data = await api(`/api/property-records?${q.toString()}`);
    const tbody = document.querySelector('#table-property-records tbody');
    const countEl = document.getElementById('proprec-count');
    const summary = document.getElementById('proprec-summary');
    if (countEl) countEl.textContent = String(data.total ?? (data.records && data.records.length) ?? 0);
    if (summary) summary.textContent = `${(data.records || []).length} record${(data.records || []).length !== 1 ? 's' : ''}`;
    if (!tbody) return;
    tbody.innerHTML = '';
    (data.records || []).forEach((r) => {
      const tr = document.createElement('tr');
      const id = String(r.id || '');
      tr.dataset.proprecId = id;
      tr.__recordData = r;
      tr.innerHTML = `
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(r.barangay || '')}</td>
        <td>${escapeHtml(r.lotNo || '')}</td>
        <td>${escapeHtml(r.arpNo || '')}</td>
        <td>${escapeHtml(r.titleNo || '')}</td>
        <td>${escapeHtml(r.refPoint || '')}</td>
        <td>${escapeHtml(r.distance || '')}</td>
        <td>${escapeHtml(r.degree || '')}</td>
        <td>${escapeHtml(r.minutes || '')}</td>
        <td>${escapeHtml(Array.isArray(r.technicalDescription)
          ? r.technicalDescription
              .map((item) => `Distance: ${item.distance || ''} | Degrees: ${item.degrees || ''} | Minutes: ${item.minutes || ''}`)
              .join(' | ')
          : r.technicalDescription || '')}</td>
        <td>
          <button type="button" class="btn ghost small" data-proprec-delete="${escapeHtml(id)}">Delete</button>
        </td>
      `;
      tr.addEventListener('click', (event) => {
        const element = event.target instanceof HTMLElement ? event.target : event.target.parentElement;
        if (!element) return;
        if (element.closest('[data-proprec-delete]')) return;
        if (tr.__recordData) openRpuView(tr.__recordData);
      });
      tr.style.cursor = 'pointer';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-proprec-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.proprecDelete;
        if (!id) return;
        if (!confirm('Delete record? This cannot be undone.')) return;
        try {
          await api(`/api/property-records/${id}`, { method: 'DELETE' });
          await refreshPropertyRecords();
        } catch (e) {
          alert(e.message || 'Unable to delete');
        }
      });
    });
  } catch (e) {
    // on error, show placeholder row matching screenshot
    const tbody = document.querySelector('#table-property-records tbody');
    const countEl = document.getElementById('proprec-count');
    const summary = document.getElementById('proprec-summary');
    if (countEl) countEl.textContent = '1';
    if (summary) summary.textContent = '1 record';
    if (tbody) {
      tbody.innerHTML = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>2</td>
        <td>Matab-ang</td>
        <td>31</td>
        <td>6465</td>
        <td>65484</td>
        <td>5456</td>
        <td>56&lt;</td>
        <td>2D</td>
        <td>3'E</td>
        <td>Distance: 2 | Degrees: 1 | Minutes: 5 | Designation: | Value:</td>
        <td><button type="button" class="btn ghost small">Delete</button></td>
      `;
      tbody.appendChild(tr);
    }
  }
}

async function refreshSystemConfig() {
  try {
    systemConfig = await api('/api/system/config');
    const barangaySelects = [
      'record-barangay',
      'filter-barangay',
      'view-barangay',
      'register-division',
    ];
    const fillBarangays = (id) => {
      const sel = document.getElementById(id);
      if (!sel || id === 'register-division') return;
      sel.innerHTML = '<option value="">All / Select</option>';
      (systemConfig.barangays || []).forEach((b) => {
        const o = document.createElement('option');
        o.value = b;
        o.textContent = b;
        sel.appendChild(o);
      });
    };
    ['record-barangay', 'filter-barangay', 'view-barangay'].forEach(fillBarangays);

    const cls = document.getElementById('record-classification');
    const fcls = document.getElementById('filter-class');
    [cls, fcls].forEach((sel) => {
      if (!sel) return;
      sel.innerHTML = '<option value="">—</option>';
      Object.entries(systemConfig.classifications || {}).forEach(([k, label]) => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = `${k} — ${label}`;
        sel.appendChild(o);
      });
    });

    const serverTime = document.getElementById('server-time');
    if (serverTime) serverTime.textContent = `PH time: ${systemConfig.serverTime} (GMT+8)`;
  } catch {
    /* ignore */
  }
}

async function loadDivisionsForRegister() {
  try {
    const divisions = await fetch('/api/divisions').then((r) => r.json());
    const sel = document.getElementById('register-division');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Optional —</option>';
    (divisions || []).forEach((d) => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = d.name;
      sel.appendChild(o);
    });
  } catch {
    /* ignore */
  }
}

function initMap() {
  if (window.map || !window.L || mapInstance) return;
  mapInstance = L.map('map').setView([10.3700, 123.6630], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  const qgisWmsUrl = 'http://localhost:8081/ows/';
  qgisLayer = L.tileLayer.wms(qgisWmsUrl, {
    layers: getDefaultVisibleLayers().join(','),
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    map: '/srv/qgis/projects/landbook.qgs',
    attribution: '&copy; QGIS Server',
    maxZoom: 19,
  }).addTo(mapInstance);

  qgisLayer.on('tileerror', (errorEvent) => {
    console.error('QGIS WMS tile error', errorEvent);
  });

  mapInstance.on('load', () => {
    console.log('Leaflet map loaded with QGIS WMS overlay');
  });

  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 200);

  buildLayerControls();
}

async function refreshMapMarkers() {
  // Marker overlay is disabled; keep the record data intact in the backend.
  return;
}

async function refreshDashboard() {
  await refreshSystemConfig();
  try {
    const overview = await api('/api/records/overview');
    document.getElementById('stat-lots').textContent = overview.totalLots ?? '0';
    document.getElementById('stat-area').textContent = formatNum(overview.totalArea);
    if (hasRole(ROLE_SUPER, ROLE_ASSISTANT)) {
      const pending = await api('/api/users/pending');
      const ul = document.getElementById('dash-pending');
      ul.innerHTML = '';
      pending.forEach((u) => {
        const li = document.createElement('li');
        li.textContent = `${u.fullName} — ${u.email}`;
        ul.appendChild(li);
      });
    }
  } catch {
    /* ignore */
  }
  await refreshMapMarkers();
}

async function refreshRecords() {
  const form = document.getElementById('form-records-filter');
  const fd = new FormData(form);
  const q = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (v) q.set(k, v);
  }
  try {
    const data = await api(`/api/records/overview?${q.toString()}`);
    document.getElementById('ov-lots').textContent = data.totalLots ?? '0';
    document.getElementById('ov-area').textContent = formatNum(data.totalArea);
    document.getElementById('ov-index').textContent = (data.indexNumbers || []).join(', ') || '—';
    document.getElementById('ov-barangay').textContent = (data.barangays || []).join(', ') || '—';
    const cl = document.getElementById('ov-class');
    cl.innerHTML = '';
    const labels = systemConfig.classifications || {};
    Object.entries(data.classification || {}).forEach(([code, count]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${code} — ${labels[code] || ''}</span><span>${count}</span>`;
      cl.appendChild(li);
    });
    const tbody = document.querySelector('#table-records tbody');
    tbody.innerHTML = '';
    (data.records || []).forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${escapeHtml(r.assessorsLotNo)}</td>
        <td>${escapeHtml(r.cadastralLotNo)}</td>
        <td>${escapeHtml(r.arpA || '')}</td>
        <td>${escapeHtml(r.arpB || '')}</td>
        <td>${escapeHtml(r.arpC || '')}</td>
        <td>${escapeHtml(r.arpD || '')}</td>
        <td>${escapeHtml(r.arpE || '')}</td>
        <td>${escapeHtml(r.arpF || '')}</td>
        <td>${escapeHtml(r.nameOfOwner)}</td>
        <td>${escapeHtml(r.titleNo || '')}</td>
        <td>${formatNum(r.areaSqm)}</td>
        <td>${escapeHtml(labels[r.classificationCode] || r.classificationCode || 'Unknown')}</td>
        <td>${escapeHtml(String(r.improvement ?? ''))}</td>
        <td>${escapeHtml(r.mch || '')}</td>
        <td>${escapeHtml(r.oth || '')}</td>
        <td>${hasRole(ROLE_SUPER, ROLE_ADMIN) ? `<input type="checkbox" class="select-record-checkbox" data-id="${escapeHtml(r.id)}" />` : '—'}</td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.select-record-checkbox').forEach((input) => {
      input.addEventListener('change', updateBulkOverlay);
    });
    updateBulkOverlay();
  } catch (e) {
    console.error(e);
  }
}

async function refreshViewLand() {
  const form = document.getElementById('form-view-land');
  const fd = new FormData(form);
  const q = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (v) q.set(k, v);
  }
  try {
    const rows = await api(`/api/records/view-land?${q.toString()}`);
    const tbody = document.querySelector('#table-view-land tbody');
    tbody.innerHTML = '';
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const lat = r.latitude != null ? Number(r.latitude) : null;
      const lng = r.longitude != null ? Number(r.longitude) : null;
      const mapBtn =
        lat != null && lng != null
          ? `<button type="button" class="linkish" data-lat="${lat}" data-lng="${lng}" data-cln="${escapeHtml(r.cadastralLotNo)}">Open</button>`
          : '—';
      tr.innerHTML = `
        <td>${escapeHtml(r.assessorsLotNo)}</td>
        <td>${escapeHtml(r.cadastralLotNo)}</td>
        <td>${escapeHtml(r.tdNo || '')}</td>
        <td>${escapeHtml(r.nameOfOwner)}</td>
        <td>${escapeHtml(r.indexNo)}</td>
        <td>${mapBtn}</td>
        <td>${hasRole(ROLE_SUPER, ROLE_ADMIN) ? `<input type="checkbox" class="select-record-checkbox" data-id="${escapeHtml(r.id)}" />` : '—'}</td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.select-record-checkbox').forEach((input) => {
      input.addEventListener('change', updateBulkOverlay);
    });
    updateBulkOverlay();
    tbody.querySelectorAll('button[data-lat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate('dashboard');
        initMap();
        highlightLandSelection(Number(btn.dataset.lat), Number(btn.dataset.lng), { maxZoom: 16 }, btn.dataset.cln);
      });
    });
  } catch (e) {
    console.error(e);
  }
}

async function refreshAdmin() {
  if (!hasRole(ROLE_SUPER, ROLE_ASSISTANT)) return;
  try {
    const pending = await api('/api/users/pending');
    const ul = document.getElementById('list-pending');
    ul.innerHTML = '';
    pending.forEach((u) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(u.fullName)}<br/><small>${escapeHtml(u.email)}</small></span>
        <span>
          <button type="button" class="btn small" data-approve="${u.id}">Approve</button>
          <button type="button" class="btn ghost small" data-reject="${u.id}">Reject</button>
        </span>`;
      ul.appendChild(li);
    });
    ul.querySelectorAll('[data-approve]').forEach((btn) =>
      btn.addEventListener('click', () => approveUser(btn.dataset.approve, true)),
    );
    ul.querySelectorAll('[data-reject]').forEach((btn) =>
      btn.addEventListener('click', () => approveUser(btn.dataset.reject, false)),
    );

    const users = await api('/api/users');
    const ul2 = document.getElementById('list-users');
    ul2.innerHTML = '';
    users.forEach((u) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>
          <button type="button" class="linkish profile-link" data-user="${u.id}">${escapeHtml(u.fullName)}</button>
          <br/><small>${escapeHtml(u.email)} · ${escapeHtml(u.role)} · ${escapeHtml(u.status)}</small>
        </span>
        <span>
          <button type="button" class="btn small" data-role="${u.id}">Assign role</button>
          ${
            u.status === 'active'
              ? `<button type="button" class="btn ghost small" data-deactivate="${u.id}">Deactivate</button>`
              : `<button type="button" class="btn small" data-activate="${u.id}">Activate</button>`
          }
        </span>`;
      ul2.appendChild(li);
    });
    ul2.querySelectorAll('.profile-link').forEach((btn) =>
      btn.addEventListener('click', () => openProfile(btn.dataset.user)),
    );
    ul2.querySelectorAll('[data-role]').forEach((btn) =>
      btn.addEventListener('click', () => openRoleModal(btn.dataset.role)),
    );
    ul2.querySelectorAll('[data-deactivate]').forEach((btn) =>
      btn.addEventListener('click', () => setUserStatus(btn.dataset.deactivate, 'inactive')),
    );
    ul2.querySelectorAll('[data-activate]').forEach((btn) =>
      btn.addEventListener('click', () => setUserStatus(btn.dataset.activate, 'active')),
    );

    const tbody = document.querySelector('#table-audit tbody');
    if (tbody) {
      tbody.innerHTML = '';
      const logs = await api('/api/audit/logs');
      logs.forEach((log) => {
        const tr = document.createElement('tr');
        const when = log.createdAt ? new Date(log.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '';
        tr.innerHTML = `<td>${escapeHtml(when)}</td><td>${escapeHtml(log.user?.fullName || '—')}</td><td>${escapeHtml(log.action)}</td><td>${escapeHtml(log.entity)}</td>`;
        tbody.appendChild(tr);
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function approveUser(id, approve) {
  try {
    await api(`/api/users/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approve }),
    });
    await refreshAdmin();
    await refreshDashboard();
  } catch (e) {
    alert(e.message);
  }
}

async function setUserStatus(id, status) {
  try {
    await api(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await refreshAdmin();
  } catch (e) {
    alert(e.message);
  }
}

async function refreshOrgChart() {
  const host = document.getElementById('org-tree');
  host.innerHTML = '';
  try {
    const data = await api('/api/org-chart');
    const renderNode = (node) => {
      const div = document.createElement('div');
      div.className = 'org-node';
      div.innerHTML = `<strong>${escapeHtml(node.fullName)}</strong> <small>${escapeHtml(node.role)}</small>
        <div style="margin-top:0.35rem">
          <button type="button" class="btn small profile-link-org" data-user="${node.id}">View</button>
          <select data-promote="${node.id}" class="promote-select">
            <option value="">Adjust role to…</option>
            <option value="user">User</option>
          </select>
          <small class="muted">Admin-level roles: use Administration → Assign role (secret key).</small>
        </div>`;
      if (node.children?.length) {
        const kids = document.createElement('div');
        kids.className = 'org-children';
        node.children.forEach((ch) => kids.appendChild(renderNode(ch)));
        div.appendChild(kids);
      }
      return div;
    };
    (data.roots || []).forEach((r) => host.appendChild(renderNode(r)));
    host.querySelectorAll('.profile-link-org').forEach((btn) =>
      btn.addEventListener('click', () => openProfile(btn.dataset.user)),
    );
    host.querySelectorAll('.promote-select').forEach((sel) =>
      sel.addEventListener('change', async () => {
        if (!sel.value) return;
        try {
          await api(`/api/users/${sel.dataset.promote}/promote`, {
            method: 'PATCH',
            body: JSON.stringify({ role: sel.value }),
          });
          sel.value = '';
          await refreshOrgChart();
        } catch (e) {
          alert(e.message);
        }
      }),
    );
  } catch (e) {
    host.textContent = e.message;
  }
}

async function openProfile(userId) {
  profileUserId = userId;
  const u = await api(`/api/users/${userId}`);
  document.getElementById('profile-name').textContent = u.fullName;
  document.getElementById('profile-meta').textContent = `${u.position || '—'} · ${u.division?.name || 'No division'}`;
  document.getElementById('profile-status').textContent = u.status;
  document.getElementById('profile-email').textContent = u.email;
  document.getElementById('profile-contact').textContent = u.contactNumber || '—';
  document.getElementById('profile-address').textContent = u.address || '—';
  document.getElementById('profile-bio').textContent = u.bio || '—';
  const av = document.getElementById('profile-avatar');
  if (u.profilePicture) {
    av.src = u.profilePicture;
    av.classList.remove('hidden');
  } else {
    av.classList.add('hidden');
    av.removeAttribute('src');
  }
  const msg = document.getElementById('profile-message');
  msg.href = `mailto:${encodeURIComponent(u.email)}?subject=Land%20Bookkeeping%20Office`;
  document.getElementById('modal-profile').classList.remove('hidden');
  document.getElementById('profile-avatar-btn').classList.toggle('hidden', currentUser?.id !== userId);
}

function openRoleModal(userId) {
  const f = document.getElementById('form-role');
  f.userId.value = userId;
  document.getElementById('modal-role').classList.remove('hidden');
  document.getElementById('role-message').textContent = '';
  populateDivisionSelect('role-division');
}

async function populateDivisionSelect(id) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const divisions = await api('/api/divisions');
  sel.innerHTML = '<option value="">—</option>';
  divisions.forEach((d) => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = d.name;
    sel.appendChild(o);
  });
}

async function openTasksModal() {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  try {
    let tasks;
    if (hasRole(ROLE_SUPER, ROLE_ASSISTANT, ROLE_ADMIN) && profileUserId && profileUserId !== currentUser.id) {
      const all = await api('/api/tasks');
      tasks = all.filter((t) => t.assigneeId === profileUserId);
    } else {
      tasks = await api('/api/tasks/mine');
    }
    tasks.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = `${t.title} — ${t.status}`;
      ul.appendChild(li);
    });
  } catch (e) {
    ul.innerHTML = `<li>${escapeHtml(e.message)}</li>`;
  }
  document.getElementById('modal-tasks').classList.remove('hidden');
}

function connectRealtime() {
  const token = getToken();
  if (!token || !window.io) return;
  const url = `${window.location.origin}/realtime`;
  socket = window.io(url, { auth: { token } });
  socket.on('notification', () => {
    refreshNotifications();
  });
  socket.on('records_updated', () => {
    if (!document.getElementById('page-records').classList.contains('hidden')) refreshRecords();
    if (!document.getElementById('page-dashboard').classList.contains('hidden')) refreshDashboard();
  });
 }

async function refreshNotifications() {
  try {
    const ul = document.getElementById('notif-list');
    if (!ul) return; // notifications UI removed or unavailable

    const list = await api('/api/notifications');
    ul.innerHTML = '';
    list.forEach((n) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(n.title)}</strong><br/><small>${escapeHtml(n.message)}</small>`;
      ul.appendChild(li);
    });
    const count = await api('/api/notifications/unread-count');
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = String(count);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  } catch {
    /* ignore */
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNum(n) {
  if (n == null || n === '') return '—';
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  return x.toLocaleString('en-PH', { maximumFractionDigits: 2 });
}

function validateRegisterForm(form) {
  const password = form.password.value.trim();
  const confirm = form.confirmPassword.value.trim();
  const address = form.address.value.trim();
  const termsConsent = form.termsConsent.checked;
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (password !== confirm) throw new Error('Password and confirm password must match.');
  if (!address) throw new Error('Address is required.');
  if (!termsConsent) throw new Error('You must accept the Terms & Conditions and Privacy Policy.');
}

async function bootstrap() {
  loadUserFromStorage();
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const id = tab.dataset.tab;
      document.getElementById('form-login').classList.toggle('hidden', id !== 'login');
      document.getElementById('form-register').classList.toggle('hidden', id !== 'register');
    });
  });

  document.getElementById('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const msg = document.getElementById('auth-message');
    msg.textContent = '';
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      setSession(data.accessToken, data.user);
      showApp();
      navigate('dashboard');
      await refreshSystemConfig();
      await refreshDashboard();
      await refreshNotifications();
    } catch (e) {
      msg.textContent = e.message;
      msg.classList.add('error');
    }
  });

  document.getElementById('form-register').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('auth-message');
    msg.textContent = '';
    msg.classList.remove('error', 'ok');
    try {
      validateRegisterForm(ev.target);
      const fd = new FormData(ev.target);
      const body = Object.fromEntries(fd);
      delete body.confirmPassword;
      delete body.termsConsent;
      if (!body.divisionId) delete body.divisionId;
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = 'Registration submitted. Await approval before login.';
      msg.classList.add('ok');
    } catch (e) {
      msg.textContent = e.message;
      msg.classList.add('error');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    showAuth();
  });

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  const bulkSelectAllBtn = document.getElementById('bulk-select-all');
  if (bulkSelectAllBtn) {
    bulkSelectAllBtn.addEventListener('click', () => {
      const active = getBulkContext();
      if (!active) return;
      const checkboxes = Array.from(document.querySelectorAll(`${active} .select-record-checkbox`));
      const allSelected = checkboxes.length > 0 && checkboxes.every((input) => input.checked);
      checkboxes.forEach((input) => {
        input.checked = !allSelected;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      updateBulkOverlay();
    });
  }

  const bulkDeleteBtn = document.getElementById('bulk-delete-action');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', deleteSelectedRecordsFromActive);
  }

  const bulkClearBtn = document.getElementById('bulk-clear-selection');
  if (bulkClearBtn) {
    bulkClearBtn.addEventListener('click', clearBulkSelection);
  }

  const sidebar = document.getElementById('app-sidebar');
  const sidebarToggle = document.getElementById('btn-sidebar-toggle');
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Create filter button dropdown behavior (replaces visible select)
  (function() {
    const hiddenSelect = document.getElementById('map-search-filter');
    const btn = document.getElementById('map-search-filter-btn');
    if (!hiddenSelect || !btn) return;
    const options = Array.from(hiddenSelect.options).map(o => ({ value: o.value, label: o.text }));
    let menu = null;
    function closeMenu() {
      if (menu) { menu.remove(); menu = null; btn.setAttribute('aria-expanded', 'false'); }
      document.removeEventListener('click', closeMenu);
    }
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (menu) return closeMenu();
      menu = document.createElement('div');
      menu.className = 'filter-menu';
      options.forEach(opt => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'filter-menu-item';
        item.textContent = opt.label;
        if (hiddenSelect.value === opt.value) item.classList.add('active');
        item.addEventListener('click', (e) => {
          hiddenSelect.value = opt.value;
          btn.title = `Filter: ${opt.label}`;
          closeMenu();
        });
        menu.appendChild(item);
      });
      document.body.appendChild(menu);
      const rect = btn.getBoundingClientRect();
      menu.style.left = `${rect.left + window.scrollX}px`;
      menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;
      btn.setAttribute('aria-expanded', 'true');
      // close when clicking outside
      setTimeout(() => document.addEventListener('click', closeMenu));
    });
  })();

  // Zoom slider: map percentage -> zoom level mapping and sync
  (function() {
    const slider = document.getElementById('map-zoom-slider');
    const container = document.getElementById('map-zoom-slider-container');
    if (!slider || !container) return;

    function getMapInfo() {
      // prefer OpenLayers `window.map`, fallback to Leaflet `mapInstance`
      if (window.map && window.map.getView) return { type: 'ol', map: window.map, view: window.map.getView() };
      if (typeof mapInstance !== 'undefined' && mapInstance && mapInstance.getCenter) return { type: 'leaflet', map: mapInstance };
      return null;
    }

    function getZoomRange(info) {
      if (!info) return { min: 3, max: 18 };
      if (info.type === 'ol') {
        const view = info.view;
        const min = typeof view.getMinZoom === 'function' ? view.getMinZoom() : 3;
        const max = typeof view.getMaxZoom === 'function' ? view.getMaxZoom() : 18;
        return { min, max };
      }
      if (info.type === 'leaflet') {
        const map = info.map;
        const min = typeof map.getMinZoom === 'function' ? map.getMinZoom() : 3;
        const max = typeof map.getMaxZoom === 'function' ? map.getMaxZoom() : 18;
        return { min, max };
      }
      return { min: 3, max: 18 };
    }

    function percentToZoom(p, range) {
      return range.min + (p / 100) * (range.max - range.min);
    }

    function zoomToPercent(z, range) {
      return Math.round(((z - range.min) / (range.max - range.min)) * 100);
    }

    function applyZoomFromPercent(p) {
      const info = getMapInfo();
      const range = getZoomRange(info);
      const z = percentToZoom(p, range);
      if (!info) return;
      if (info.type === 'ol') {
        try { info.view.setZoom(z); } catch (e) { console.error('OL setZoom failed', e); }
      } else if (info.type === 'leaflet') {
        try { info.map.setZoom(z); } catch (e) { console.error('Leaflet setZoom failed', e); }
      }
    }

    function updateSliderFromMap() {
      const info = getMapInfo();
      if (!info) return;
      let z;
      if (info.type === 'ol') z = info.view.getZoom(); else if (info.type === 'leaflet') z = info.map.getZoom();
      const range = getZoomRange(info);
      const p = zoomToPercent(z, range);
      slider.value = Math.min(100, Math.max(0, p));
    }

    // attach events
    slider.addEventListener('input', (ev) => {
      const p = Number(ev.target.value);
      applyZoomFromPercent(p);
    });

    // keep in sync: poll until map available, then hook map moveend events
    (function waitForMap(retries = 0) {
      const info = getMapInfo();
      if (!info) {
        if (retries > 60) return; // give up after ~6s
        return setTimeout(() => waitForMap(retries + 1), 100);
      }
      // initialize slider position
      updateSliderFromMap();
      if (info.type === 'ol') {
        try { info.view.on('change:resolution', updateSliderFromMap); } catch (e) {}
        try { info.view.on('change:zoom', updateSliderFromMap); } catch (e) {}
      } else if (info.type === 'leaflet') {
        try { info.map.on('zoomend', updateSliderFromMap); } catch (e) {}
      }
    })();
  })();

  const btnNotifications = document.getElementById('btn-notifications');
  const panelNotifications = document.getElementById('panel-notifications');
  if (btnNotifications && panelNotifications) {
    btnNotifications.addEventListener('click', () => {
      panelNotifications.classList.toggle('hidden');
      refreshNotifications();
    });
  }

  document.getElementById('form-geocode').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const q = document.getElementById('map-search').value.trim();
    const filterType = document.getElementById('map-search-filter').value || 'any';
    if (!q) return;

    // Try to match against the qgis2web cadastral features first
    try {
      const ql = q.toLowerCase();
      const searchFieldsByFilter = {
        any: ['LOT NUMBER', 'LAST NAME', 'FIRST NAME', 'BARANGAY', 'PIN', 'FID', 'SECTION'],
        lot: ['LOT NUMBER', 'LOT', 'LOT NO', 'PARCEL NO', 'PARCEL', 'CadastralLot'],
        name: ['LAST NAME', 'FIRST NAME', 'OWNER', 'Name', 'OWNER NAME'],
        barangay: ['BARANGAY', 'BRGY', 'BARANGAY NAME'],
        pin: ['PIN', 'SERVER PIN', 'NEW PIN', 'TAX MAP PIN'],
        fid: ['FID', 'OBJECTID', 'FID_Affect']
      };
      const searchFields = searchFieldsByFilter[filterType] || searchFieldsByFilter.any;
      const sourceFeatures = window.features_CADASTRALCLAIMANTS_1 || (window.jsonSource_CADASTRALCLAIMANTS_1 && window.jsonSource_CADASTRALCLAIMANTS_1.getFeatures && window.jsonSource_CADASTRALCLAIMANTS_1.getFeatures()) || [];
      const matches = [];
      for (const f of sourceFeatures) {
        for (const field of searchFields) {
          let v = null;
          try {
            v = typeof f.get === 'function' ? f.get(field) : (f.properties && f.properties[field]);
          } catch (e) {
            v = null;
          }
          if (v != null && String(v).toLowerCase().includes(ql)) {
            matches.push(f);
            break;
          }
        }
      }

      // If no local matches found, fallback to Nominatim geocoding
      if (!matches.length) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (data?.[0]) {
          // Use the qgis2web/OpenLayers map when available
          if (window.map) {
            const coords = ol.proj.fromLonLat([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
            window.map.getView().setCenter(coords);
            window.map.getView().setZoom(14);
          } else {
            // Fallback to Leaflet
            initMap();
            mapInstance.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 14);
          }
        } else {
          alert('No results in the Philippines for that query.');
        }
        return;
      }

      // If one match, select and zoom to it. If multiple, list clickable results.
      if (matches.length === 1) {
        const f = matches[0];
        // Use qgis2web selection helper when available
        if (typeof selectFeature === 'function' && window.lyr_CADASTRALCLAIMANTS_1) {
          // Ensure map is visible
          navigate('dashboard');
          // Give layout a moment then select
          setTimeout(() => selectFeature(f, window.lyr_CADASTRALCLAIMANTS_1), 50);
        } else if (window.map && f.getGeometry) {
          navigate('dashboard');
          const geom = f.getGeometry();
          const center = ol.extent.getCenter(geom.getExtent());
          window.map.getView().setCenter(center);
          window.map.getView().setZoom(16);
        }
        return;
      }

      // Multiple matches: render a paginated list (15 per page) in the cadastral info card
      const target = document.getElementById('cadastral-info');
      if (target) {
        const pageSize = 15;
        let currentPage = 1;
        const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));

        const header = document.createElement('div');
        header.innerHTML = `<p class="hint">${matches.length} results — click an item to focus:</p>`;

        const resultsWrap = document.createElement('div');
        resultsWrap.className = 'search-results-wrap';

        const pager = document.createElement('div');
        pager.className = 'pager';

        function renderPage(page) {
          currentPage = Math.min(Math.max(1, page), totalPages);
          resultsWrap.innerHTML = '';
          const ul = document.createElement('ul');
          ul.className = 'list-compact';
          const start = (currentPage - 1) * pageSize;
          const slice = matches.slice(start, start + pageSize);
          slice.forEach((mf, idx) => {
            const globalIdx = start + idx;
            const li = document.createElement('li');
            const lot = (mf.get ? mf.get('LOT NUMBER') : mf.properties['LOT NUMBER']) || '—';
            const last = (mf.get ? mf.get('LAST NAME') : mf.properties['LAST NAME']) || '';
            const first = (mf.get ? mf.get('FIRST NAME') : mf.properties['FIRST NAME']) || '';
            const brgy = (mf.get ? mf.get('BARANGAY') : mf.properties['BARANGAY']) || '';
            const section = (mf.get ? mf.get('SECTION') : mf.properties['SECTION']) || '';
            li.innerHTML = `<button type="button" class="linkish search-result" data-idx="${globalIdx}"><strong>${escapeHtml(lot)}</strong> — ${escapeHtml(last)}, ${escapeHtml(first)} — ${escapeHtml(brgy)} / ${escapeHtml(section)}</button>`;
            li.querySelector('button').addEventListener('click', () => {
              try {
                console.log('Search result click', globalIdx, mf);
                // Ensure the dashboard/map is visible
                navigate('dashboard');
                // Prefer the qgis2web selection helper if present
                if (typeof selectFeature === 'function' && window.lyr_CADASTRALCLAIMANTS_1) {
                  // call after a short delay so layout and map resizing settle
                  setTimeout(() => {
                    try {
                      selectFeature(mf, window.lyr_CADASTRALCLAIMANTS_1);
                    } catch (err) {
                      console.error('selectFeature failed', err);
                      // fallback to manual view fit below
                      if (window.map && mf.getGeometry) {
                        try {
                          const geom = mf.getGeometry();
                          if (geom) {
                            const extent = geom.getExtent();
                            window.map.getView().fit(extent, { size: window.map.getSize(), padding: [75,75,75,75], maxZoom: 18 });
                          }
                        } catch (e2) { console.error(e2); }
                      }
                    }
                  }, 80);
                } else if (window.map && mf.getGeometry) {
                  // Fallback: center/fit using OpenLayers view
                  const geom = mf.getGeometry();
                  if (geom) {
                    try {
                      const extent = geom.getExtent();
                      window.map.getView().fit(extent, { size: window.map.getSize(), padding: [75,75,75,75], maxZoom: 18 });
                    } catch (e) { console.error(e); }
                  }
                }
                // Ensure the clicked item is visible in the scrollable results
                const btn = li.querySelector('button');
                if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest' });
              } catch (e) {
                console.error('Error handling search result click', e);
              }
            });
            ul.appendChild(li);
          });
          resultsWrap.appendChild(ul);

          // build pager controls
          pager.innerHTML = '';
          const info = document.createElement('span');
          info.textContent = `Page ${currentPage} of ${totalPages}`;
          info.className = 'pager-info';

          const controls = document.createElement('div');
          controls.className = 'pager-controls';
          const prev = document.createElement('button');
          prev.type = 'button';
          prev.textContent = 'Prev';
          prev.disabled = currentPage === 1;
          prev.addEventListener('click', () => renderPage(currentPage - 1));
          const next = document.createElement('button');
          next.type = 'button';
          next.textContent = 'Next';
          next.disabled = currentPage === totalPages;
          next.addEventListener('click', () => renderPage(currentPage + 1));
          controls.appendChild(prev);
          controls.appendChild(next);

          pager.appendChild(info);
          pager.appendChild(controls);
        }

        target.innerHTML = '';
        target.appendChild(header);
        target.appendChild(resultsWrap);
        target.appendChild(pager);
        renderPage(1);

        // Ensure the cadastral panel/card is visible when multiple results are shown
        try {
          var cadastralPanel = document.querySelector('.cadastral-panel');
          if (cadastralPanel && cadastralPanel.classList.contains('hidden')) {
            cadastralPanel.classList.remove('hidden');
            console.log('Displayed cadastral panel for multiple search results');
          }
        } catch (e) { console.warn('Could not show cadastral panel', e); }
      }
    } catch (e) {
      console.error(e);
      alert('Search error');
    }
  });

  document.getElementById('form-record').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const body = {};
    for (const [k, v] of fd.entries()) {
      if (v === '') continue;
      if (['areaSqm', 'improvement', 'latitude', 'longitude'].includes(k)) {
        body[k] = v ? Number(v) : undefined;
      } else {
        body[k] = v;
      }
    }
    const msg = document.getElementById('record-message');
    msg.textContent = '';
    try {
      const created = await api('/api/records', { method: 'POST', body: JSON.stringify(body) });
      const file = document.getElementById('record-file').files[0];
      if (file) {
        const up = new FormData();
        up.append('file', file);
        up.append('landRecordId', created.id);
        await api('/api/documents/upload', { method: 'POST', body: up });
      }
      msg.textContent = 'Record saved.';
      msg.classList.add('ok');
      ev.target.reset();
    } catch (e) {
      msg.textContent = e.message;
      msg.classList.add('error');
    }
  });

  document.getElementById('form-records-filter').addEventListener('submit', (ev) => {
    ev.preventDefault();
    refreshRecords();
  });

  document.getElementById('form-view-land').addEventListener('submit', (ev) => {
    ev.preventDefault();
    refreshViewLand();
  });

  document.getElementById('form-role').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const userId = fd.get('userId');
    const payload = {
      role: fd.get('role'),
      adminSecretKey: fd.get('adminSecretKey'),
      divisionId: fd.get('divisionId') || undefined,
    };
    const msg = document.getElementById('role-message');
    msg.textContent = '';
    try {
      await api(`/api/users/${userId}/assign-role`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      msg.textContent = 'Role updated.';
      msg.classList.add('ok');
      document.getElementById('modal-role').classList.add('hidden');
      await refreshAdmin();
    } catch (e) {
      msg.textContent = e.message;
      msg.classList.add('error');
    }
  });

  function closeOpenModals() {
    document.querySelectorAll('.modal:not(.hidden)').forEach((modal) => {
      modal.classList.add('hidden');
    });
  }

  function modalHasFormData(modal) {
    const fields = modal.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
    for (const field of fields) {
      if (field instanceof HTMLInputElement) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          if (field.checked) return true;
          continue;
        }
        if (field.type === 'file') {
          if (field.files && field.files.length > 0) return true;
          continue;
        }
      }
      if (field instanceof HTMLSelectElement) {
        if (field.value && field.value !== '') return true;
        continue;
      }
      if (field.value && String(field.value).trim() !== '') return true;
    }
    return false;
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.add('hidden');
    });
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'Esc') {
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        if (modalHasFormData(openModal)) {
          const confirmClose = window.confirm('You have unsaved changes. Close without saving?');
          if (!confirmClose) {
            ev.preventDefault();
            return;
          }
        }
        closeOpenModals();
        ev.preventDefault();
      }
    }
  });

  document.getElementById('btn-profile-self').addEventListener('click', () => {
    if (currentUser) openProfile(currentUser.id);
  });

  document.getElementById('profile-tasks').addEventListener('click', () => {
    openTasksModal();
  });

  document.getElementById('profile-avatar-btn').addEventListener('click', async () => {
    const url = prompt('Profile image URL (https://…)', currentUser?.profilePicture || '');
    if (!url || !currentUser) return;
    try {
      await api(`/api/users/${currentUser.id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ profilePicture: url }),
      });
      currentUser.profilePicture = url;
      setSession(getToken(), currentUser);
      updateSelfChip();
      document.getElementById('profile-avatar').src = url;
      document.getElementById('profile-avatar').classList.remove('hidden');
    } catch (e) {
      alert(e.message);
    }
  });

  // Property Records UI actions
  const proprecSearch = document.getElementById('proprec-search');
  if (proprecSearch) {
    let t = null;
    proprecSearch.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => refreshPropertyRecords(), 350);
    });
  }

  const exportBtn = document.getElementById('export-excel-property');
  if (exportBtn) exportBtn.addEventListener('click', () => {
    // attempt to open export endpoint
    const url = '/api/property-records/export?format=excel';
    window.open(url, '_blank');
  });

  const printBtn = document.getElementById('print-property');
  if (printBtn) printBtn.addEventListener('click', () => {
    window.print();
  });

  const addRpuBtn = document.getElementById('add-rpu-btn');
  const modalRpu = document.getElementById('modal-rpu');
  const modalViewRpu = document.getElementById('modal-view-rpu');
  const viewRpuBody = document.getElementById('view-rpu-body');
  const formRpu = document.getElementById('form-rpu');
  const rpuBarangay = document.getElementById('rpu-barangay');
  const rpuTechRows = document.getElementById('rpu-tech-rows');
  const rpuAddRow = document.getElementById('rpu-add-row');

  function ensureRpuBarangays() {
    if (!rpuBarangay) return;
    if ((rpuBarangay.options || []).length > 1) return; // already populated
    // populate from systemConfig or refresh if empty
    const list = (systemConfig && systemConfig.barangays && systemConfig.barangays.length) ? systemConfig.barangays : [];
    if (!list.length) {
      refreshSystemConfig().then(() => {
        const after = (systemConfig && systemConfig.barangays) || [];
        rpuBarangay.innerHTML = '<option value="">Select or type...</option>' + after.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
      }).catch(() => {});
      return;
    }
    rpuBarangay.innerHTML = '<option value="">Select or type...</option>' + list.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
  }

  function addRpuTechRow(values = {}) {
    if (!rpuTechRows) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'rpu-tech-row';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0px';
    wrapper.innerHTML = `
      <span class="rpu-tech-number" style="display:inline-block; padding:24px 24px 0 8px; opacity:50%; font-size:12px; width:75px; ">1-1</span>
      <label style="display:inline-block;margin-right:8px">Distance (m) *<input name=\"tech_distance[]\" value=\"${escapeHtml(values.distance||'')}\" placeholder=\"@0.00<\" required /></label>
      <label style="display:inline-block;margin-right:8px">Degrees *<input name=\"tech_degrees[]\" value=\"${escapeHtml(values.degrees||'')}\" placeholder=\"0–360D\" required /></label>
      <label style="display:inline-block;">Minutes *<input name=\"tech_minutes[]\" value=\"${escapeHtml(values.minutes||'')}\" placeholder=\"0–59'E\" required /></label>
      <button type="button" class="btn ghost small rpu-remove-row" title="Remove" style="position:absolute;top:0px;right:6px;padding:0px 6px;line-height:1;background:transparent;">&times;</button>
    `;
    rpuTechRows.appendChild(wrapper);
    // refresh numbering for all rows
    updateRpuTechRowNumbers();
  }

  function updateRpuTechRowNumbers() {
    if (!rpuTechRows) return;
    const rows = Array.from(rpuTechRows.children || []);
    const n = rows.length || 0;
    rows.forEach((row, idx) => {
      const numEl = row.querySelector('.rpu-tech-number');
      if (!numEl) return;
      const i = idx + 1;
      const next = (i === n) ? 1 : i + 1;
      numEl.textContent = `${i}-${next}`;
    });
  }

  function isRpuMeasurementInput(input) {
    return input instanceof HTMLInputElement && /^(tie_|tech_)/.test(input.name);
  }

  function sanitizeRpuMeasurementValue(input) {
    if (!isRpuMeasurementInput(input)) return;
    const name = input.name || '';
    const value = input.value || '';
    if (/distance/.test(name)) {
      input.value = value.replace(/[^0-9.]/g, '');
    } else {
      input.value = value.toUpperCase().replace(/[^0-9NSEW]/g, '');
    }
  }

  function handleRpuMeasurementKeydown(ev) {
    const target = ev.target;
    if (!(target instanceof HTMLInputElement) || !isRpuMeasurementInput(target)) return;
    const key = ev.key;
    if (key.length !== 1) return;

    const allowed = /distance/.test(target.name)
      ? /[0-9\.]/
      : /[0-9NSEWnsew]/;

    if (!allowed.test(key) && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
    }
  }

  function handleRpuMeasurementInput(ev) {
    const target = ev.target;
    if (target instanceof HTMLInputElement && isRpuMeasurementInput(target)) {
      sanitizeRpuMeasurementValue(target);
    }
  }

  function formatRpuMeasurementDisplay(input) {
    if (!(input instanceof HTMLInputElement) || !isRpuMeasurementInput(input)) return;
    const name = input.name || '';
    let v = String(input.value || '').trim();

    if (/distance/.test(name)) {
      // normalize numeric portion
      const nums = v.replace(/[^0-9.]/g, '');
      if (name === 'tie_distance') {
        input.value = nums ? nums + '<' : '';
      } else {
        // tech_distance[] -> @start and < end
        if (!nums) {
          input.value = '';
        } else {
          input.value = '@' + nums + '<';
        }
      }
      return;
    }

    if (/degrees/.test(name)) {
      // keep digits and cardinal letters, ensure ends with D
      v = v.toUpperCase().replace(/[^0-9NSEW]/g, '');
      if (v) {
        if (!v.endsWith('D')) v = v + 'D';
      }
      input.value = v;
      return;
    }

    if (/minutes/.test(name)) {
      // format: <number>'<CARDINAL>  (e.g., 12'E)
      const nums = v.replace(/[^0-9]/g, '');
      const cardMatch = (v.match(/[NSEW]/i) || []).join('').toUpperCase();
      if (!nums && !cardMatch) {
        input.value = '';
        return;
      }
      if (nums && cardMatch) {
        input.value = nums + "'" + cardMatch.charAt(0);
      } else if (nums) {
        input.value = nums + "'";
      } else {
        // only cardinal provided; keep it
        input.value = cardMatch.charAt(0);
      }
      return;
    }
  }

  function getRpuInputs() {
    if (!formRpu) return [];
    return Array.from(formRpu.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'));
  }

  function handleRpuEnter(ev) {
    if (ev.key !== 'Enter') return;
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (!formRpu || !formRpu.contains(target)) return;

    const inputs = getRpuInputs();
    const currentIndex = inputs.indexOf(target);
    if (currentIndex === -1) return;

    ev.preventDefault();

    const currentRow = target.closest('.rpu-tech-row');
    const lastTechRow = rpuTechRows?.lastElementChild;
    const isInLastTechRow = currentRow && currentRow === lastTechRow;

    const rowInputs = currentRow ? Array.from(currentRow.querySelectorAll('input')) : [];
    const rowFullyFilled = rowInputs.length > 0 && rowInputs.every((input) => String(input.value).trim() !== '');

    if (isInLastTechRow && rowFullyFilled) {
      addRpuTechRow();
      const newRow = rpuTechRows?.lastElementChild;
      const firstInput = newRow?.querySelector('input');
      if (firstInput) {
        firstInput.focus();
        return;
      }
    }

    const nextInput = inputs[currentIndex + 1];
    if (nextInput) {
      nextInput.focus();
      return;
    }

    const submitButton = formRpu.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.focus();
    }
  }

  function openRpuModal() {
    if (!modalRpu) return;
    // reset form
    if (formRpu) formRpu.reset();
    // clear and add one default technical row
    if (rpuTechRows) rpuTechRows.innerHTML = '';
    addRpuTechRow();
    ensureRpuBarangays();
    modalRpu.classList.remove('hidden');
  }

  if (addRpuBtn) addRpuBtn.addEventListener('click', openRpuModal);

  if (rpuAddRow) rpuAddRow.addEventListener('click', () => addRpuTechRow());

  if (formRpu) {
    formRpu.addEventListener('keydown', handleRpuEnter);
    formRpu.addEventListener('keydown', handleRpuMeasurementKeydown);
    formRpu.addEventListener('input', handleRpuMeasurementInput);
  }

  // delegate remove row
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('.rpu-remove-row');
    if (!btn) return;
    const row = btn.closest('.rpu-tech-row');
    if (row && rpuTechRows && rpuTechRows.contains(row)) {
      row.remove();
      // update numbering after removal
      updateRpuTechRowNumbers();
    }
  });

  function hasCardinalLetter(value) {
    return /[NSEWnsew]/.test(String(value || ''));
  }

  function clearRpuValidationErrors() {
    const formRpu = document.getElementById('form-rpu');
    if (formRpu) {
      formRpu.querySelectorAll('input.rpu-validation-error').forEach(input => {
        input.classList.remove('rpu-validation-error');
      });
    }
  }

  function validateRpuCardinalLetters(payload) {
    const invalidFields = [];

    // Validate tie line
    if (payload.tieLine.degrees && !hasCardinalLetter(payload.tieLine.degrees)) {
      invalidFields.push('tie_degrees');
    }
    if (payload.tieLine.minutes && !hasCardinalLetter(payload.tieLine.minutes)) {
      invalidFields.push('tie_minutes');
    }

    // Validate technical description rows
    payload.technicalDescription.forEach((row, index) => {
      if (row.degrees && !hasCardinalLetter(row.degrees)) {
        const degreesInputs = document.querySelectorAll(`input[name="tech_degrees[]"]`);
        if (degreesInputs[index]) {
          invalidFields.push(degreesInputs[index]);
        }
      }
      if (row.minutes && !hasCardinalLetter(row.minutes)) {
        const minutesInputs = document.querySelectorAll(`input[name="tech_minutes[]"]`);
        if (minutesInputs[index]) {
          invalidFields.push(minutesInputs[index]);
        }
      }
    });

    return invalidFields;
  }

  function highlightRpuValidationErrors(invalidFields) {
    invalidFields.forEach(field => {
      if (typeof field === 'string') {
        const input = document.querySelector(`input[name="${field}"]`);
        if (input) {
          input.classList.add('rpu-validation-error');
        }
      } else {
        field.classList.add('rpu-validation-error');
      }
    });
  }

  if (formRpu) {
    // Clear error highlights when user starts typing
    formRpu.addEventListener('input', (ev) => {
      if (ev.target && ev.target.classList.contains('rpu-validation-error')) {
        ev.target.classList.remove('rpu-validation-error');
      }
    });

    // Format measurement fields on blur
    formRpu.addEventListener('blur', (ev) => {
      const target = ev.target;
      if (target instanceof HTMLInputElement && isRpuMeasurementInput(target)) {
        sanitizeRpuMeasurementValue(target);
        formatRpuMeasurementDisplay(target);
      }
    }, true);

    formRpu.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      // ensure measurement fields are formatted before reading form data
      Array.from(formRpu.querySelectorAll('input')).forEach((inp) => {
        if (inp instanceof HTMLInputElement && isRpuMeasurementInput(inp)) {
          sanitizeRpuMeasurementValue(inp);
          formatRpuMeasurementDisplay(inp);
        }
      });
      const fd = new FormData(formRpu);
      const payload = {
        barangay: fd.get('barangay') || '',
        lotNumber: fd.get('lotNumber') || '',
        arpNumber: fd.get('arpNumber') || '',
        titleNumber: fd.get('titleNumber') || '',
        referencePoint: fd.get('refPoint') || '',
        tieLine: {
          distance: fd.get('tie_distance') || '',
          degrees: fd.get('tie_degrees') || '',
          minutes: fd.get('tie_minutes') || ''
        },
        technicalDescription: []
      };
      const dists = fd.getAll('tech_distance[]');
      const degs = fd.getAll('tech_degrees[]');
      const mins = fd.getAll('tech_minutes[]');
      for (let i = 0; i < Math.max(dists.length, degs.length, mins.length); i++) {
        payload.technicalDescription.push({
          distance: dists[i] || '',
          degrees: degs[i] || '',
          minutes: mins[i] || ''
        });
      }

      // Validate cardinal letters
      clearRpuValidationErrors();
      const invalidFields = validateRpuCardinalLetters(payload);
      if (invalidFields.length > 0) {
        highlightRpuValidationErrors(invalidFields);
        return;
      }

      try {
        await api('/api/property-records', { method: 'POST', body: JSON.stringify(payload) });
        // close modal and refresh list
        if (modalRpu) modalRpu.classList.add('hidden');
        await refreshPropertyRecords();
      } catch (e) {
        alert(e.message || 'Unable to save RPU record');
      }
    });
  }

  await refreshSystemConfig();
  await loadDivisionsForRegister();

  const token = getToken();
  if (token && currentUser) {
    try {
      const me = await api('/api/auth/me');
      setSession(token, me);
      showApp();
      await refreshDashboard();
      await refreshNotifications();
    } catch {
      clearSession();
      showAuth();
    }
  } else {
    showAuth();
  }

  // Print functionality setup
  setupPrintButton();
  setupParcelRedirectButton();
}

// Print functionality
function captureMapAsImage() {
  return new Promise(function(resolve, reject) {
    try {
      if (!window.map) {
        console.error('Map not initialized');
        reject(new Error('Map not initialized'));
        return;
      }
      
      var viewport = window.map.getViewport();
      if (!viewport) {
        console.error('Map viewport not found');
        reject(new Error('Map viewport not found'));
        return;
      }
      
      // Disable Google Satellite layer to avoid CORS taint on canvas
      var googleSatelliteLayer = null;
      var wasGoogleSatelliteVisible = false;
      var allLayers = window.map.getLayers().getArray();
      
      // Find and disable Google Satellite layer
      for (var i = 0; i < allLayers.length; i++) {
        var layer = allLayers[i];
        if (layer && (layer.get('name') === 'Google Satellite Hybrid' || 
                      layer === window.lyr_GoogleSatelliteHybrid_0 ||
                      (layer.getSource && layer.getSource().getAttributions && 
                       layer.getSource().getAttributions()[0] && 
                       layer.getSource().getAttributions()[0].includes('Google')))) {
          googleSatelliteLayer = layer;
          wasGoogleSatelliteVisible = layer.getVisible();
          layer.setVisible(false);
          console.log('Disabled Google Satellite layer for canvas capture');
          break;
        }
      }
      
      // Try to find canvas - might be under different selectors depending on rendering mode
      var canvas = viewport.querySelector('canvas');
      if (!canvas) {
        // Try alternative selector for different OpenLayers versions
        var canvases = viewport.querySelectorAll('canvas');
        if (canvases.length > 0) {
          canvas = canvases[0];
        }
      }
      
      if (!canvas) {
        console.error('Canvas element not found in viewport');
        console.warn('Available elements in viewport:', viewport.innerHTML.substring(0, 200));
        // Re-enable Google Satellite layer if we disabled it
        if (googleSatelliteLayer && wasGoogleSatelliteVisible) {
          googleSatelliteLayer.setVisible(true);
        }
        reject(new Error('Canvas element not found'));
        return;
      }
      
      console.log('Canvas found, dimensions:', canvas.width, 'x', canvas.height);
      
      // Re-render map to ensure canvas is updated without satellite layer
      window.map.render();
      
      // Try to convert canvas to data URL
      try {
        var imageData = canvas.toDataURL('image/png');
        if (!imageData || imageData === 'data:image/png;base64,' || imageData.length < 100) {
          console.warn('Canvas data seems empty, retrying...');
          // Trigger render and retry
          window.map.render();
          setTimeout(function() {
            try {
              var retryData = canvas.toDataURL('image/png');
              console.log('Retry successful, data length:', retryData.length);
              // Re-enable Google Satellite layer
              if (googleSatelliteLayer && wasGoogleSatelliteVisible) {
                googleSatelliteLayer.setVisible(true);
                console.log('Re-enabled Google Satellite layer after capture');
              }
              resolve(retryData);
            } catch (e) {
              console.error('Retry canvas capture failed:', e);
              // Re-enable Google Satellite layer
              if (googleSatelliteLayer && wasGoogleSatelliteVisible) {
                googleSatelliteLayer.setVisible(true);
              }
              reject(new Error('Canvas is empty or cannot be captured. Make sure the map is fully loaded.'));
            }
          }, 200);
        } else {
          console.log('Canvas captured successfully, data length:', imageData.length);
          // Re-enable Google Satellite layer
          if (googleSatelliteLayer && wasGoogleSatelliteVisible) {
            googleSatelliteLayer.setVisible(true);
            console.log('Re-enabled Google Satellite layer after capture');
          }
          resolve(imageData);
        }
      } catch (e) {
        console.error('Canvas toDataURL error:', e);
        // Re-enable Google Satellite layer
        if (googleSatelliteLayer && wasGoogleSatelliteVisible) {
          googleSatelliteLayer.setVisible(true);
        }
        reject(new Error('Failed to capture map: ' + e.message));
      }
    } catch (error) {
      console.error('Unexpected error in captureMapAsImage:', error);
      reject(error);
    }
  });
}

// Helpers to find/disable/reenable Google Satellite layer
function findGoogleSatelliteLayer() {
  if (!window.map || !window.map.getLayers) return null;
  var allLayers = window.map.getLayers().getArray();
  for (var i = 0; i < allLayers.length; i++) {
    var layer = allLayers[i];
    try {
      if (layer && (layer.get('name') === 'Google Satellite Hybrid' || 
                    layer === window.lyr_GoogleSatelliteHybrid_0 ||
                    (layer.getSource && layer.getSource().getAttributions && 
                     layer.getSource().getAttributions()[0] && 
                     layer.getSource().getAttributions()[0].includes('Google')))) {
        return layer;
      }
    } catch (e) {
      // ignore layers that don't expose the expected API
    }
  }
  return null;
}

function disableGoogleSatelliteLayer() {
  var layer = findGoogleSatelliteLayer();
  if (!layer) return null;
  var wasVisible = false;
  try { wasVisible = layer.getVisible(); } catch (e) {}
  try { layer.setVisible(false); console.log('Disabled Google Satellite layer before print'); } catch (e) { console.warn('Could not disable Google Satellite layer', e); }
  return { layer: layer, wasVisible: wasVisible };
}

function reenableGoogleSatelliteLayer(layer, wasVisible) {
  if (!layer) return;
  try {
    if (wasVisible) {
      layer.setVisible(true);
      console.log('Re-enabled Google Satellite layer after print');
    }
  } catch (e) {
    console.warn('Could not re-enable Google Satellite layer', e);
  }
}

function openPrintWindow(featureData, mapImage) {
  console.log('openPrintWindow called');
  console.log('mapImage received, length:', mapImage ? mapImage.length : 'null');
  console.log('featureData received:', featureData);
  
  var printUrl = 'print.html';
  var printWindow = window.open(printUrl, 'print-window', 'width=1400,height=1000,scrollbars=yes');
  
  if (!printWindow) {
    console.error('Failed to open print window - may be blocked by popup blocker');
    alert('Could not open print window. Please check if popups are blocked.');
    return;
  }
  
  console.log('Print window opened successfully');
  
  // Use a more robust loading mechanism
  var loadAttempts = 0;
  var maxAttempts = 15;
  
  function tryPopulatePrintWindow() {
    loadAttempts++;
    console.log('tryPopulatePrintWindow attempt:', loadAttempts);
    try {
      // Check if print window document is ready
      if (!printWindow.document || !printWindow.document.body) {
        console.log('Print window not ready yet, retrying...');
        if (loadAttempts < maxAttempts) {
          setTimeout(tryPopulatePrintWindow, 150);
        } else {
          console.error('Print window did not load in time');
          alert('Print window failed to load. Please try again.');
        }
        return;
      }
      
      console.log('Print window document is ready');
      
      // Set the map image
      var mapContainer = printWindow.document.querySelector('.map-container');
      console.log('Map container found:', !!mapContainer);
      
      if (mapContainer) {
        console.log('Attempting to insert map image...');
        
        // Remove only the previously generated map image and placeholder, but keep overlays like the north arrow
        var existingMapImg = mapContainer.querySelector('.map-img');
        var existingDiv = mapContainer.querySelector('.map-placeholder');
        if (existingMapImg && existingMapImg.parentNode === mapContainer) {
          mapContainer.removeChild(existingMapImg);
        }
        if (existingDiv && existingDiv.parentNode === mapContainer) {
          mapContainer.removeChild(existingDiv);
        }
        
        // Create a new image element
        var mapImg = printWindow.document.createElement('img');
        mapImg.className = 'map-img';
        mapImg.style.maxWidth = '100%';
        mapImg.style.maxHeight = '100%';
        mapImg.style.display = 'block';
        mapImg.style.margin = '0 auto';
        mapImg.style.position = 'absolute';
        mapImg.style.zIndex = '0';
        
        // Set the image source
        if (mapImage && mapImage.length > 0) {
          console.log('Setting image source, data length:', mapImage.length);
          mapImg.src = mapImage;
          mapImg.onload = function() {
            console.log('Map image loaded successfully in print window');
          };
          mapImg.onerror = function() {
            console.error('Failed to load map image in print window');
          };
        } else {
          console.error('Map image is empty or invalid');
          mapContainer.innerHTML = '<div style="color: red;">Map image data is empty</div>';
          return;
        }
        
        // Insert image at the beginning so overlays appear on top
        mapContainer.insertBefore(mapImg, mapContainer.firstChild);
        console.log('Map image element inserted into container');
      } else {
        console.error('Map container not found in print window');
        console.log('Available elements:', printWindow.document.body.innerHTML.substring(0, 500));
        return;
      }
      
      // Populate feature data in the certificate
      if (featureData) {
        console.log('Populating feature data...');
        var lotNo = featureData['LOT NUMBER'] || featureData['LOT_NO'] || featureData['lot'] || 'N/A';
        var barangay = featureData['BARANGAY'] || featureData['brgy'] || 'N/A';
        var area = featureData['AREA (m²)'] || featureData['AREA'] || featureData['area'] || 'N/A';
        var pin = featureData['PIN'] || featureData['pin'] || 'N/A';
        var owner = featureData['LAST NAME'] || '';
        if (featureData['FIRST NAME']) {
          owner = (featureData['FIRST NAME'] || '') + ' ' + owner;
        }
        owner = owner.trim() || 'N/A';
        var dateIssued = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Update the certificate elements
        var lotEl = printWindow.document.getElementById('lot-no');
        var brgyEl = printWindow.document.getElementById('barangay');
        var areaEl = printWindow.document.getElementById('area');
        var pinEl = printWindow.document.getElementById('pin');
        var ownerEl = printWindow.document.getElementById('owner');
        var reqOwnerEl = printWindow.document.getElementById('request-owner');
        var dateEl = printWindow.document.getElementById('date-issued');
        
        if (lotEl) lotEl.textContent = lotNo;
        if (brgyEl) brgyEl.textContent = barangay;
        if (areaEl) areaEl.textContent = area;
        if (pinEl) pinEl.textContent = pin;
        if (ownerEl) ownerEl.textContent = owner;
        if (reqOwnerEl) reqOwnerEl.textContent = owner;
        if (dateEl) dateEl.textContent = dateIssued;
        console.log('Certificate data populated');
      }
    } catch (error) {
      console.error('Error populating print window:', error);
      if (loadAttempts < maxAttempts) {
        setTimeout(tryPopulatePrintWindow, 150);
      } else {
        alert('Error populating certificate data. Please check the console.');
      }
    }
  }
  
  // Start the population process
  setTimeout(tryPopulatePrintWindow, 300);
}

function handleCadastralPrintClick() {
  console.log('Print button clicked');
  console.log('selectedFeatureDataForPrint from app.js:', selectedFeatureDataForPrint);
  console.log('window.selectedFeatureDataForPrint:', window.selectedFeatureDataForPrint);
  
  // Try to get feature data from window object first (set by qgis2web.js)
  var featureData = window.selectedFeatureDataForPrint || selectedFeatureDataForPrint;
  
  if (featureData && Object.keys(featureData).length > 0) {
    console.log('Feature data found, preparing map for capture...');
    
    // Ensure map is fully rendered before capturing
    if (window.map && window.map.getViewport()) {
      // Disable Google Satellite layer immediately to avoid tainted canvas
      var _disabledSatellite = disableGoogleSatelliteLayer();

      // Force a render to ensure canvas is up to date
      window.map.render();

      // Small delay to ensure rendering is complete
      setTimeout(function() {
        console.log('Capturing map image...');
        captureMapAsImage().then(function(mapImage) {
          console.log('Map image captured successfully, opening print window...');
          openPrintWindow(featureData, mapImage);
        }).catch(function(error) {
          console.error('Error capturing map:', error);
          alert('Error preparing map for print. Details: ' + error.message);
        }).finally(function() {
          // Re-enable the satellite layer if we disabled it here
          try {
            if (_disabledSatellite && _disabledSatellite.layer) {
              reenableGoogleSatelliteLayer(_disabledSatellite.layer, _disabledSatellite.wasVisible);
            }
          } catch (e) {
            console.warn('Error re-enabling satellite layer after print attempt', e);
          }
        });
      }, 200);
    } else {
      console.error('Map not available for capture');
      alert('Map is not ready. Please try again.');
    }
  } else {
    console.log('No feature data available');
    alert('No land feature selected. Please click on a land feature on the map first.');
  }
}

function setupPrintButton() {
  var printButton = document.getElementById('cadastral-print');
  if (printButton) {
    printButton.addEventListener('click', handleCadastralPrintClick);
    console.log('Print button event listener attached');
  } else {
    // Retry after a short delay if button not found immediately
    setTimeout(function() {
      var btn = document.getElementById('cadastral-print');
      if (btn) {
        btn.addEventListener('click', handleCadastralPrintClick);
        console.log('Print button event listener attached (delayed)');
      }
    }, 500);
  }
}

function setupParcelRedirectButton() {
  var button = document.getElementById('parcel-menu-btn');
  if (!button) {
    setTimeout(setupParcelRedirectButton, 500);
    return;
  }
  button.addEventListener('click', function () {
    var featureData = window.selectedFeatureDataForPrint || selectedFeatureDataForPrint;
    if (!featureData || Object.keys(featureData).length === 0) {
      alert('Please select a cadastral lot on the map first.');
      return;
    }
    try {
      sessionStorage.setItem('parcelRedirectData', JSON.stringify(featureData));
      window.open('parcel.html', '_blank');
    } catch (error) {
      console.error('Unable to store parcel redirect data:', error);
      alert('Unable to open parcel page. Please try again.');
    }
  });
}

bootstrap();
