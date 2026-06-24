/**
 * Tracer - Cadastral Org Chart Interactive Handler
 * Handles line behavior, interactivity, pan/zoom, search, and node management
 */

// Utility function to get property value from object with fallback keys
function getProp(props, keys) {
  for (const k of keys) {
    if (k in props && props[k] != null) return props[k];
  }
  return undefined;
}

function getBarangayCode(name) {
  if (!name) return '';
  let n = String(name).toUpperCase().trim();
  // remove parenthetical annotations like "(Lutopan)"
  n = n.replace(/\(.*\)/g, '').trim();
  n = n.replace(/[\u2019\u2018\u201C\u201D]/g, "'");
  // normalize some common variants
  n = n.replace(/\bCAMP\b/g, 'CAMPO');
  n = n.replace(/\bCAPITAN\b/g, 'CAPT');
  n = n.replace(/\bCAPTAIN\b/g, 'CAPT');

  // canonical map (source codes remain unchanged)
  const map = {
    'POBLACION': '001', 'AWIHAO': '002', 'BAGAKAY': '003', 'BATO': '004', 'BIGA': '005', 'BULONGAN': '006', 'BUNGA': '007', 'CABITOONAN': '008', 'CALONGCALONG': '009', 'CAMBANGUG': '010', 'CAMPO 8': '011', 'CANLULAMPAO': '012', 'CANTABACO': '013', 'CAPT. CLAUDIO': '014', 'CARMEN': '015', 'DAS': '016', 'DUMLOG': '017', 'GEN. CLIMACO': '018', 'IBO': '019', 'ILIHAN': '020', 'LANDAHAN': '021', 'LOAY': '022', 'LURAY II': '023', 'MAGDUGO': '024', 'MATAB-ANG': '025', 'MEDIA-ONCE': '026', 'PANGAMIHAN': '027', 'POOG': '028', 'PUTINGBATO': '029', 'SAGAY': '030', 'SAM-ANG': '031', 'SANGI': '032', 'STO, NIÑO': '033', 'STO NINO': '033', 'SUBAYON': '034', 'TALAVERA': '035', 'TUBOD': '036', 'TUNGKAY': '037', 'DAANLUNGSOD': '038'
  };

  // normalizer used for map keys and input
  function normalizeKey(s) {
    return String(s || '').toUpperCase().replace(/\(.*\)/g, '').replace(/[\u2019\u2018\u201C\u201D]/g, "'").replace(/\bCAMP\b/g, 'CAMPO').replace(/\bCAPITAN\b/g, 'CAPT').replace(/\bCAPTAIN\b/g, 'CAPT').replace(/[^A-Z0-9 ]+/g, '').trim();
  }

  const clean = normalizeKey(n);

  // build normalized lookup (must exist before any alias checks)
  const normalizedMap = {};
  Object.keys(map).forEach(k => {
    normalizedMap[normalizeKey(k)] = map[k];
  });

  // explicit alias entries for known variants that appear in the UI
  const aliasToCanonical = {
    'CANLUMAMPAO': 'CANLULAMPAO',
    'CANLUMAMP AO': 'CANLULAMPAO',
    'DAANGLUNGSOD': 'DAANLUNGSOD',
    'DONANDRESSORIANO': 'DAS',
    'DONANDRESSORIANO LUTOPAN': 'DAS',
    'ANDRESSORIANO': 'DAS'
  };
  Object.entries(aliasToCanonical).forEach(([a, canonical]) => {
    const na = normalizeKey(a);
    const nc = normalizeKey(canonical);
    if (normalizedMap[nc]) normalizedMap[na] = normalizedMap[nc];
  });

  // quick aliases for known problematic variants (handle misspellings and token variants)
  const compact = clean.replace(/[^A-Z0-9]/g, '');

  // Canlumampao variants: CANLULAMPAO, CANLUMAMP A O, CANLUMAMPAO, etc.
  if (/CANLU?L?AM?PA?O?/.test(compact) || /CANLUMAMPAO|CANLULAMPAO/.test(compact)) {
    return normalizedMap[normalizeKey('CANLULAMPAO')];
  }

  // Daanglungsod variants
  if (compact.includes('DAANLUNGSOD') || /DAANGLUNGSOD|DAANLUNGSOD/.test(compact)) {
    return normalizedMap[normalizeKey('DAANLUNGSOD')];
  }

  // Don Andres Soriano variants and DAS lutopan entries
  const nUpper = n.toUpperCase();
  if (nUpper.includes('DON') && nUpper.includes('ANDRES') && nUpper.includes('SORIANO')) {
    return normalizedMap[normalizeKey('DAS')];
  }
  if (nUpper.includes('SORIANO') || nUpper.includes('LUTOPAN') || compact === 'DAS') {
    return normalizedMap[normalizeKey('DAS')];
  }

  // exact normalized match
  if (normalizedMap[clean]) return normalizedMap[clean];

  // compact forms for fuzzy matching
  const compactInput = clean.replace(/[^A-Z0-9]/g, '');
  for (const nk in normalizedMap) {
    const compactKey = nk.replace(/[^A-Z0-9]/g, '');
    if (!compactInput || !compactKey) continue;
    if (compactKey === compactInput) return normalizedMap[nk];
    if (compactKey.includes(compactInput) || compactInput.includes(compactKey)) return normalizedMap[nk];
    // token-based partial match
    const tokens = clean.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      if (t.length < 3) continue;
      if (nk.indexOf(t) !== -1 || nk.replace(/[^A-Z0-9]/g, '').indexOf(t.replace(/[^A-Z0-9]/g, '')) !== -1) return normalizedMap[nk];
    }
  }

  return '';
}

function fillRecordBarangays(list) {
  if (!barangaySelect) return;
  barangaySelect.innerHTML = '<option value="">Select barangay</option>';
  (list || []).forEach(b => {
    const option = document.createElement('option');
    option.value = b;
    option.textContent = b;
    barangaySelect.appendChild(option);
  });
}

function fillRecordClassifications(classifications) {
  if (!classificationSelect) return;
  classificationSelect.innerHTML = '<option value="">Select classification</option>';
  if (!classifications || typeof classifications !== 'object') return;
  Object.entries(classifications).forEach(([code, label]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = String(label || code);
    classificationSelect.appendChild(option);
  });
}

function tryLoadSystemConfig() {
  if (!window.fetch) return;
  fetch('/api/system/config').then(res => {
    if (!res.ok) throw new Error('no config');
    return res.json();
  }).then(cfg => {
    fillRecordBarangays(cfg && cfg.barangays ? cfg.barangays : []);
    fillRecordClassifications(cfg && cfg.classifications ? cfg.classifications : {});
  }).catch(() => {
    fillRecordBarangays([
      'POBLACION','AWIHAO','BAGAKAY','BATO','BIGA','BULONGAN','BUNGA','CABITOONAN','CALONG-CALONG','CAMBANG-UG','CAMPO 8','CANLULAMPAO','CANTABACO','CAPT. CLAUDIO','CARMEN','DAS','DUMLOG','GEN. CLIMACO','IBO','ILIHAN','LANDAHAN','LOAY','LURAY II','MAGDUGO','MATAB-ANG','MEDIA-ONCE','PANGAMIHAN','POOG','PUTINGBATO','SAGAY','SAM-ANG','SANGI','STO, NIÑO','STO NINO','SUBAYON','TALAVERA','TUBOD','TUNGKAY','DAANLUNGSOD'
    ]);
    fillRecordClassifications({});
  });
}

// Find layer by required fields
function findLayerByFields(requiredKeys) {
  const candidates = Object.keys(window).filter(k => k.startsWith('json_'));
  for (const name of candidates) {
    try {
      const layer = window[name];
      if (!layer || !Array.isArray(layer.features) || !layer.features.length) continue;
      const props = layer.features[0].properties || {};
      const keys = Object.keys(props).map(x => x.toLowerCase());
      const hits = requiredKeys.filter(r => keys.includes(r.toLowerCase()));
      if (hits.length >= 2) return layer;
    } catch (e) {
      /*ignore*/
    }
  }
  return null;
}

// Build org data from available layers
function buildFromLayer() {
  const claimantsLayer = findLayerByFields(['LOT NUMBER', 'FIRST NAME', 'LAST NAME']);
  const parcelsLayer = window.json_TOLEDOPARCELS_0 || findLayerByFields(['PIN', 'PARCEL NO', 'Assessors Data_PARCEL NO']);

  if (!claimantsLayer) return null;

  const root = { id: 'root', name: 'TOLEDO', type: 'root', children: [] };

  claimantsLayer.features.forEach((f, idx) => {
    const p = f.properties || {};
    const lot = getProp(p, ['LOT NUMBER', 'LOT_NUMBER', 'Lot_No', 'lotNumber']) || ('lot_' + idx);
    const cadNode = {
      id: 'cad_' + String(lot).replace(/\s+/g, '_'),
      type: 'cadastral',
      lotNumber: lot,
      firstName: getProp(p, ['FIRST NAME', 'FirstName', 'first_name', 'firstName']) || '',
      lastName: getProp(p, ['LAST NAME', 'LastName', 'last_name', 'lastName']) || '',
      barangay: getProp(p, ['BARANGAY', 'Barangay']) || '',
      section: getProp(p, ['SECTION', 'Section', 'SECTION NO', 'SECTION_NO']) || '',
      area: getProp(p, ['AREA (m²)', 'AREA (M²)', 'AREA', 'Area', 'AREA_M2', 'AREA_M²', 'TOTAL_AREA']) || '',
      remarks: getProp(p, ['REMARKS', 'Remarks']) || '',
      children: [],
      collapsed: true
    };

    root.children.push(cadNode);
  });

  return root;
}

const STORAGE_KEY = 'tracerOrgData';

function isValidOrgData(data) {
  return data && typeof data === 'object' && data.id === 'root' && Array.isArray(data.children);
}

function loadSavedOrgData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (isValidOrgData(saved)) return saved;
  } catch (e) {
    console.warn('Unable to load saved tracer data', e);
  }
  return null;
}

function saveOrgData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ORG_DATA));
  } catch (e) {
    console.warn('Unable to save tracer data', e);
  }
}

// Initialize data
const savedData = loadSavedOrgData();
const built = savedData || buildFromLayer();
const ORG_DATA = built || {
  id: 'root', name: 'TOLEDO', type: 'root', children: [
    {
      id: 'cad_3086', type: 'cadastral', lotNumber: '3086', lastName: 'Canillo', firstName: 'Victorino',
      barangay: 'Bato', section: '2', area: '551 sqm', remarks: 'AR', children: [
        {
          id: 'par_1', type: 'parcel', FID: 1, PIN: '149-00-004-02-029', SERVER_PIN: '149-00-0004-02-029-0000',
          NEW_PIN: null, BARANGAY: 'Bato', SECTION_NO: '2', CADASTRAL_SURVEY_NO: '3086', TITLE_NO: 'NULL',
          DECLARATION_NO: '7201', PARCEL_NO: '29', DISPLAY_NAME: 'Victorino Canillo',
          OWNER_ADDRESS: 'Bato, Toledo City', TOTAL_AREA: '551', DATA_UNIT: 'sqm',
          TOTAL_MARKET_VALUE: '137750', TOTAL_ASSESSED_VALUE: '13780', CLASSIFICATION: 'AR'
        }
      ]
    }
  ]
};

// DOM References
const chart = document.getElementById('chart');
const searchInput = document.getElementById('searchInput');
const sidebar = document.getElementById('sidebar');
const details = document.getElementById('details');
const sidebarFooter = document.getElementById('sidebarFooter');
const tracerPrintBtn = document.getElementById('tracer-print');
const addPartitionSidebarBtn = document.getElementById('addPartitionSidebarBtn');
const addPartitionModal = document.getElementById('addPartitionModal');
const addPartitionForm = document.getElementById('addPartitionForm');
const cancelAddPartitionBtn = document.getElementById('cancelAddPartitionBtn');
const barangaySelect = document.getElementById('record-barangay');
const classificationSelect = document.getElementById('record-classification');
const wrap = document.getElementById('chart-wrap');
let activeSidebarNode = null;

// Transform state
let transform = { x: 0, y: 0, scale: 1 };
let pointer = { down: false, x: 0, y: 0 };

// Viewport rendering state
const VIEWPORT_PADDING = 200; // Extra space to render beyond visible area
let visibleNodes = new Set(); // Track which nodes are currently visible
let nodePositions = new Map(); // Cache calculated positions
let currentSearchQuery = ''; // Track active search query

// Debounce/throttle for expensive operations
let redrawTimeout;
let resizeTimeout;

/**
 * Schedule a connector line redraw with debouncing
 */
function scheduleRedraw() {
  clearTimeout(redrawTimeout);
  redrawTimeout = setTimeout(() => {
    drawConnectorLines();
  }, 100);
}

// Create SVG container for connector lines (will be inserted after chart renders)
let svgContainer;

// ============================================================================
// RENDERING & DOM CREATION
// ============================================================================

/**
 * Calculate viewport bounds in chart space
 * Takes into account pan offset without moving nodes visually
 */
function getViewportBounds() {
  const wrapRect = wrap.getBoundingClientRect();
  
  // Viewport is centered, pan offset determines what's visible
  const viewportX = -transform.x / transform.scale;
  const viewportY = -transform.y / transform.scale;
  const viewportWidth = wrapRect.width / transform.scale;
  const viewportHeight = wrapRect.height / transform.scale;
  
  return {
    left: viewportX - VIEWPORT_PADDING,
    top: viewportY - VIEWPORT_PADDING,
    right: viewportX + viewportWidth + VIEWPORT_PADDING,
    bottom: viewportY + viewportHeight + VIEWPORT_PADDING
  };
}

/**
 * Check if a node would be visible in the viewport
 * Estimates node position based on tree structure
 */
function isNodeInViewport(node, depth = 0, xPos = 0) {
  const bounds = getViewportBounds();
  
  // Rough estimate of node position (horizontal)
  // Cards are spaced approximately 280px apart
  const estimatedWidth = 280;
  const horizontalSpacing = 80;
  
  // Estimate y position based on depth
  const nodeHeight = 120; // card height + gap
  const estimatedY = depth * nodeHeight;
  
  // Check if node is in viewport bounds
  const isVisible = (
    xPos < bounds.right &&
    xPos + estimatedWidth > bounds.left &&
    estimatedY < bounds.bottom &&
    estimatedY + nodeHeight > bounds.top
  );
  
  return isVisible;
}

/**
 * Filter tree to only include nodes in viewport
 * Recursively culls branches outside visible area
 */
function filterVisibleNodes(node, depth = 0, xPos = 0) {
  // Always include root
  if (node.id === 'root') {
    const filteredChildren = [];
    const childCount = node.children?.length || 1;
    let childXPos = -((childCount - 1) * 150);
    
    if (node.children) {
      node.children.forEach(child => {
        const filtered = filterVisibleNodes(child, depth + 1, childXPos);
        if (filtered) filteredChildren.push(filtered);
        childXPos += 300;
      });
    }
    
    return filteredChildren.length > 0 
      ? { ...node, children: filteredChildren }
      : node;
  }
  
  // For non-root nodes, check if in viewport
  if (!isNodeInViewport(node, depth, xPos)) {
    return null;
  }
  
  // Include this node and filter its children
  const filteredChildren = [];
  let childXPos = xPos - ((node.children?.length || 1) * 150);
  
  if (node.children) {
    node.children.forEach(child => {
      const filtered = filterVisibleNodes(child, depth + 1, childXPos);
      if (filtered) filteredChildren.push(filtered);
      childXPos += 300;
    });
  }
  
  return {
    ...node,
    children: filteredChildren.length > 0 ? filteredChildren : []
  };
}

/**
 * Main render function - builds the entire tree with viewport culling
 */
function render() {
  chart.innerHTML = '';
  
  // Create SVG container for lines
  svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgContainer.setAttribute('id', 'connector-lines');
  svgContainer.setAttribute('style', 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;overflow:visible;');
  chart.appendChild(svgContainer);
  
  // Start with full data or search-filtered data
  let dataToRender = ORG_DATA;
  let filteredData = null;
  
  // If there's an active search query, apply search filter first
  if (currentSearchQuery) {
    const searchFiltered = filterNodes(ORG_DATA, currentSearchQuery);
    dataToRender = searchFiltered || ORG_DATA;
    filteredData = dataToRender;
  } else {
    // Then apply viewport culling when not searching
    filteredData = filterVisibleNodes(dataToRender);
  }
  
  if (filteredData) {
    const ul = createNodeElement(filteredData);
    ul.classList.add('tree');
    chart.appendChild(ul);
  }
  
  // Redraw connector lines with debouncing
  scheduleRedraw();
}

/**
 * Draw SVG connector lines between parent and child nodes
 * Calculates actual positions to ensure lines connect properly
 * Optimized for performance
 */
function drawConnectorLines() {
  if (!svgContainer) return;
  
  // Clear previous lines
  svgContainer.innerHTML = '';
  
  // Get all cards to find the actual bounds - do this once
  const allCards = document.querySelectorAll('.card');
  if (allCards.length === 0) return;
  
  const chartRect = chart.getBoundingClientRect();
  
  // Calculate bounds of all content
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  allCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardX = rect.left - chartRect.left;
    const cardY = rect.top - chartRect.top;
    
    minX = Math.min(minX, cardX);
    maxX = Math.max(maxX, cardX + rect.width);
    minY = Math.min(minY, cardY);
    maxY = Math.max(maxY, cardY + rect.height);
  });
  
  // Add padding around bounds
  const padding = 50;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  
  const svgWidth = maxX - minX + padding * 2;
  const svgHeight = maxY - minY + padding * 2;
  
  // Set SVG dimensions and position
  svgContainer.setAttribute('width', svgWidth);
  svgContainer.setAttribute('height', svgHeight);
  svgContainer.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svgContainer.style.left = minX + 'px';
  svgContainer.style.top = minY + 'px';
  
  // Build a document fragment to batch DOM updates
  const fragment = document.createDocumentFragment();
  
  // Get all node-children containers - cache the query
  const childContainers = document.querySelectorAll('.node-children');
  
  childContainers.forEach(childContainer => {
    const parentCard = childContainer.parentElement?.querySelector('.card');
    if (!parentCard) return;
    
    // Get positions relative to SVG origin
    const parentRect = parentCard.getBoundingClientRect();
    const parentX = (parentRect.left - chartRect.left) - minX + parentRect.width / 2;
    const parentY = (parentRect.top - chartRect.top) - minY + parentRect.height;
    
    // Get all child cards in this container
    const childCards = childContainer.querySelectorAll(':scope > .node > .card');
    
    childCards.forEach(childCard => {
      const childRect = childCard.getBoundingClientRect();
      if (!childRect.width || !childRect.height) return;
      const childX = (childRect.left - chartRect.left) - minX + childRect.width / 2;
      const childY = (childRect.top - chartRect.top) - minY;
      
      // Calculate the midpoint for the connector
      const midY = (parentY + childY) / 2;
      
      // Create path for the connector line
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${parentX} ${parentY} L ${parentX} ${midY} L ${childX} ${midY} L ${childX} ${childY}`);
      path.setAttribute('stroke', 'rgba(99, 102, 241, 0.34)');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      
      fragment.appendChild(path);
    });
  });
  
  // Batch append all paths at once
  svgContainer.appendChild(fragment);
}

/**
 * Create DOM element for a tree node with all interactive features
 * Includes connector lines via CSS (::before, ::after on node-children)
 */
function createNodeElement(node) {
  const li = document.createElement('div');
  li.className = 'node fade';
  li.setAttribute('data-node-id', node.id);

  // Card element
  const card = document.createElement('div');
  card.className = 'card';

  // Toggle button for nodes with children
  if (node.children && node.children.length) {
    const t = document.createElement('div');
    t.className = 'node-toggle';
    t.textContent = '▾';
    t.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      li.classList.toggle('collapsed');
      scheduleRedraw();
    };
    card.appendChild(t);
    if (node.type === 'cadastral' && node.collapsed !== false) {
      li.classList.add('collapsed');
    }
  }
  const title = document.createElement('div');
  title.className = 'title';
  const sub = document.createElement('div');
  sub.className = 'sub';

  // Populate card content based on node type
  if (node.type === 'cadastral') {
    title.textContent = node.lotNumber || 'Cadastral';
    sub.textContent = (node.lastName ? node.lastName + ', ' + (node.firstName || '') : node.name || '');
  } else if (node.type === 'parcel') {
    title.textContent = node.PIN || node.DISPLAY_NAME || 'Parcel';
    sub.textContent = node.DISPLAY_NAME || node.PIN;
  } else if (node.type === 'blank') {
    card.classList.add('blank-card');
    title.textContent = node.name || 'New node';
    sub.textContent = node.name ? '' : 'Click to edit details';
  } else {
    title.textContent = node.name || 'Root';
    sub.textContent = '';
  }

  card.appendChild(title);
  card.appendChild(sub);

  // Add button (for nodes with < 2 children)
  const childCount = node.children ? node.children.length : 0;
  if (childCount < 2) {
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.type = 'button';
    addBtn.innerHTML = '+';
    addBtn.title = 'Add nodes';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      const actualNode = findNodeById(ORG_DATA, node.id) || node;
      insertBlankChildren(actualNode);
    };
    card.appendChild(addBtn);
  }

  // Delete button (for non-root nodes)
  if (node.id !== 'root') {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '−';
    deleteBtn.title = 'Delete node';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      showDeleteModal(node);
    };
    card.appendChild(deleteBtn);
  }

  // Click handler to show details
  card.onclick = (e) => {
    e.stopPropagation();
    showDetails(node);
  };

  li.appendChild(card);

  // Children container (connector lines are drawn via CSS ::before and ::after)
  if (node.children && node.children.length) {
    const childWrap = document.createElement('div');
    childWrap.className = 'node-children';
    node.children.forEach(c => {
      const child = createNodeElement(c);
      childWrap.appendChild(child);
    });
    li.appendChild(childWrap);
  }

  return li;
}

// ============================================================================
// NODE MANAGEMENT
// ============================================================================

/**
 * Insert blank child nodes
 */
function insertBlankChildren(parentNode) {
  if (!parentNode.children) parentNode.children = [];
  const baseId = parentNode.id + '_new';
  parentNode.children.push(
    { id: baseId + '_1', type: 'blank', name: '', children: [] },
    { id: baseId + '_2', type: 'blank', name: '', children: [] }
  );
  parentNode.collapsed = false;
  saveOrgData();
  render();
}

/**
 * Delete node by id (recursive search)
 */
function deleteNodeById(parent, nodeId) {
  if (!parent.children) return false;
  const idx = parent.children.findIndex(child => child.id === nodeId);
  if (idx !== -1) {
    parent.children.splice(idx, 1);
    return true;
  }
  return parent.children.some(child => deleteNodeById(child, nodeId));
}

function findNodeById(node, nodeId) {
  if (!node) return null;
  if (node.id === nodeId) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Delete a node (unless it's root)
 */
function deleteNode(node) {
  if (node.id === 'root') return;
  deleteNodeById(ORG_DATA, node.id);
  saveOrgData();
  render();
}

let pendingDeleteNode = null;

function showDeleteModal(node) {
  pendingDeleteNode = node;
  const modal = document.getElementById('deleteModal');
  const input = document.getElementById('deletePasskeyInput');
  const error = modal.querySelector('.error');
  input.value = '';
  error.textContent = '';
  modal.classList.remove('hidden');
}

function hideDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.add('hidden');
  pendingDeleteNode = null;
}

function confirmDeleteNode(event) {
  event.preventDefault();
  const value = document.getElementById('deletePasskeyInput').value.trim();
  const error = document.querySelector('#deleteModal .error');
  if (value !== 'passkey') {
    error.textContent = 'Invalid passkey';
    return;
  }
  if (pendingDeleteNode) {
    deleteNode(pendingDeleteNode);
  }
  hideDeleteModal();
}

// ============================================================================
// DETAILS SIDEBAR
// ============================================================================

/**
 * Show node details in sidebar
 */
function showDetails(node) {
  // Remove highlight from previously selected card
  document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
  
  // Highlight the selected card
  const selectedCard = document.querySelector(`[data-node-id="${node.id}"]`)?.querySelector('.card');
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  details.innerHTML = '';
  const h = document.createElement('div');
  h.className = 'h';
  h.textContent = node.type === 'parcel' ? (node.DISPLAY_NAME || node.PIN) : (node.lotNumber || node.name);
  details.appendChild(h);
  const table = document.createElement('div');
  table.className = 'field-grid';

  if (node.type === 'cadastral') {
    const fields = ['lotNumber', 'lastName', 'firstName', 'barangay', 'section', 'area', 'remarks'];
    fields.forEach(k => {
      const v = node[k] ?? '';
      const row = document.createElement('div');
      row.className = 'field-row';
      row.innerHTML = `<span class="label">${k.replace(/([A-Z])/g, ' $1')}</span><span class="value">${v}</span>`;
      table.appendChild(row);
    });
  } else if (node.type === 'parcel') {
    const fields = ['FID', 'PIN', 'SERVER_PIN', 'NEW_PIN', 'BARANGAY', 'SECTION_NO', 'CADASTRAL_SURVEY_NO', 'TITLE_NO', 'EFF', 'DECLARATION_NO', 'CONVEYANCE', 'DECLARANT', 'PARCEL_NO', 'DISPLAY_NAME', 'OWNER_ADDRESS', 'TOTAL_AREA', 'DATA_UNIT', 'TOTAL_MARKET_VALUE', 'TOTAL_ASSESSED_VALUE', 'CLASSIFICATION'];
    fields.forEach(k => {
      const v = node[k] ?? '';
      const label = k === 'NEW_PIN' ? 'NEW PIN'
        : k === 'EFF' ? 'EFF.'
        : k === 'DECLARATION_NO' ? 'DECLARATION NO'
        : k === 'CONVEYANCE' ? 'CONVEYANCE'
        : k === 'DECLARANT' ? 'DECLARANT'
        : k.replace(/_/g, ' ');
      const row = document.createElement('div');
      row.className = 'field-row';
      row.innerHTML = `<span class="label">${label}</span><span class="value">${v}</span>`;
      table.appendChild(row);
    });
  } else if (node.type === 'blank') {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `<span class="label">Type</span><span class="value">New node placeholder</span>`;
    table.appendChild(row);
    const hint = document.createElement('div');
    hint.className = 'field-row';
    hint.innerHTML = `<span class="label">Next</span><span class="value">Use the data editor to enter node details.</span>`;
    table.appendChild(hint);
    sidebarFooter?.classList.remove('hidden');
  } else {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `<span class="label">Type</span><span class="value">${node.type}</span>`;
    table.appendChild(row);
    sidebarFooter?.classList.add('hidden');
  }

  details.appendChild(table);
  activeSidebarNode = node;
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
}

// ============================================================================
// PROGRAMMATIC FOCUS (postMessage API)
// ============================================================================

function normalizeKeyForMatch(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
}

function findNodeByLot(node, lot) {
  if (!node) return null;
  const target = normalizeKeyForMatch(lot);
  const nodeLot = normalizeKeyForMatch(node.lotNumber || node.CADASTRAL_SURVEY_NO || node.CADASTRAL || '');
  if (nodeLot && target && (nodeLot === target || nodeLot.indexOf(target) !== -1 || target.indexOf(nodeLot) !== -1)) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeByLot(child, lot);
    if (found) return found;
  }
  return null;
}

function findPathToNode(root, nodeId, path) {
  path = path || [];
  if (!root) return null;
  if (root.id === nodeId) return path.concat(root);
  if (!root.children) return null;
  for (const child of root.children) {
    const p = findPathToNode(child, nodeId, path.concat(root));
    if (p) return p;
  }
  return null;
}

function focusOnLot(lot) {
  if (!lot) return;
  const q = String(lot).trim();
  // set search input but don't prematurely open details for fuzzy matches
  searchInput.value = q;
  currentSearchQuery = q.toLowerCase();
  handleSearch();

  // Prefer exact normalized match first
  function findExact(node, lotNorm) {
    if (!node) return null;
    const nodeLot = normalizeKeyForMatch(node.lotNumber || node.CADASTRAL_SURVEY_NO || node.CADASTRAL || '');
    if (nodeLot && nodeLot === lotNorm) return node;
    if (!node.children) return null;
    for (const child of node.children) {
      const f = findExact(child, lotNorm);
      if (f) return f;
    }
    return null;
  }

  const norm = normalizeKeyForMatch(lot);
  const exactNode = findExact(ORG_DATA, norm);
  let node = exactNode || findNodeByLot(ORG_DATA, lot);
  if (node) {
    const path = findPathToNode(ORG_DATA, node.id) || [];
    path.forEach(n => { if (n) n.collapsed = false; });
    render();
    setTimeout(() => {
      try {
        const card = document.querySelector(`[data-node-id="${node.id}"] .card`);
        if (card) {
          const duration = exactNode ? 3000 : 1600;
          card.classList.add('focused-by-parent');
          setTimeout(() => card.classList.remove('focused-by-parent'), duration);
        }
      } catch (e) { /* ignore */ }
    }, 160);
  }
}

// Listen for messages from parent window (parcel page)
window.addEventListener('message', function (ev) {
  try {
    var msg = ev.data || {};
    if (!msg || !msg.type) return;
    if (msg.type === 'parcel-root' || msg.type === 'parcel-data') {
      var lot = msg.lot || msg.cadastralLot || '';
      if (!lot) return;
      focusOnLot(lot);
    }
  } catch (e) { /* ignore malicious/invalid messages */ }
});

/**
 * Close sidebar
 */
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebarFooter?.classList.add('hidden');
  activeSidebarNode = null;
  document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
}

function normalizePrintValue(value) {
  return value == null ? '' : String(value).trim();
}

function getNodeDisplayName(node) {
  if (!node) return '';
  if (node.type === 'parcel') {
    return normalizePrintValue(node.DISPLAY_NAME) || normalizePrintValue(node.DECLARANT) || [normalizePrintValue(node.lastName), normalizePrintValue(node.firstName)].filter(Boolean).join(', ');
  }
  if (node.type === 'cadastral') {
    return [normalizePrintValue(node.lastName), normalizePrintValue(node.firstName)].filter(Boolean).join(', ') || normalizePrintValue(node.name);
  }
  return '';
}

function getNodeLocationValue(node) {
  if (!node) return '';
  return normalizePrintValue(node.LOCATION) || normalizePrintValue(node.OWNER_ADDRESS) || normalizePrintValue(node.barangay) || normalizePrintValue(node.section);
}

function getTracerPrintRows(node) {
  if (!node) return [];
  const path = findPathToNode(ORG_DATA, node.id) || [];
  const rows = path.slice(1).reverse().map(n => ({
    tdNo: normalizePrintValue(n.TD_NO || n.EFF || n.DECLARATION_NO),
    declarant: normalizePrintValue(n.DECLARANT) || getNodeDisplayName(n),
    location: getNodeLocationValue(n),
    lotNo: normalizePrintValue(n.lotNumber || n.CADASTRAL_SURVEY_NO || n.PARCEL_NO),
    area: normalizePrintValue(n.area || n.TOTAL_AREA),
    pin: normalizePrintValue(n.PIN || n.NEW_PIN || n.SERVER_PIN),
    conveyance: normalizePrintValue(n.CONVEYANCE),
    eff: normalizePrintValue(n.EFF)
  }));
  return rows;
}

function getSelectedSidebarNode() {
  if (activeSidebarNode) return activeSidebarNode;
  const selectedCard = document.querySelector('.card.selected');
  if (!selectedCard) return null;
  const nodeId = selectedCard.closest('[data-node-id]')?.getAttribute('data-node-id');
  if (!nodeId) return null;
  return findNodeById(ORG_DATA, nodeId);
}

function openTracerPrint() {
  const node = getSelectedSidebarNode();
  const rows = getTracerPrintRows(node);
  localStorage.setItem('tracerPrintData', JSON.stringify({ rows }));
  window.open('./tracerprint.html', '_blank');
}

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

/**
 * Recursive filter function for search
 */
function filterNodes(node, query) {
  let match = false;
  const lotNumber = node.lotNumber ? String(node.lotNumber).trim() : '';
  const normalizedLotNumber = lotNumber.replace(/^0+/, '') || lotNumber;
  const normalizedQuery = query.replace(/^0+/, '') || query;
  const isNumericQuery = /^\d+$/.test(query);
  const text = [node.lastName, node.firstName, node.DISPLAY_NAME, node.CLASSIFICATION, lotNumber, node.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  if (isNumericQuery) {
    if (normalizedLotNumber && normalizedLotNumber === normalizedQuery) match = true;
  } else {
    if (text.includes(query) || text.includes(normalizedQuery)) match = true;
    if (!match && /^\d+$/.test(query) && normalizedLotNumber && normalizedLotNumber === normalizedQuery) {
      match = true;
    }
  }
  
  let children = [];
  if (node.children) {
    children = node.children
      .map(child => filterNodes(child, query))
      .filter(Boolean);
  }
  
  if (match) {
    // If this node matches, keep its full child subtree so newly added children remain visible.
    return Object.assign({}, node, { children: node.children ? node.children.slice() : [] });
  }
  
  if (children.length) {
    return Object.assign({}, node, { children });
  }
  
  return null;
}

/**
 * Handle search input
 */
function handleSearch() {
  const q = searchInput.value.trim().toLowerCase();
  currentSearchQuery = q;
  
  if (!q) {
    render();
    return;
  }
  
  // Use the standard render function which applies both search and viewport filters
  render();
}

// ============================================================================
// PAN & ZOOM INTERACTIVITY
// ============================================================================

/**
 * Apply transform to chart
 * Only applies scale - pan is handled via viewport culling (Facebook-style)
 */
function applyTransform() {
  // Apply both pan and zoom transforms so the chart moves visually.
  chart.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
}

/**
 * Reset view to default
 */
function resetView() {
  transform = { x: 0, y: 0, scale: 1 };
  currentSearchQuery = '';
  searchInput.value = '';
  applyTransform();
  render();
}

/**
 * Fit chart to default view
 */
function fitView() {
  transform = { x: 0, y: 0, scale: 1 };
  applyTransform();
  render();
}

/**
 * Scroll chart up
 */
function scrollUp() {
  transform.y += 100;
  applyTransform();
  render();
}

/**
 * Scroll chart down
 */
function scrollDown() {
  transform.y -= 100;
  applyTransform();
  render();
}

// ============================================================================
// EVENT LISTENERS - WHEEL & MOUSE (Pan & Zoom)
// ============================================================================

wrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  
  // Shift+Scroll for vertical navigation (Y axis)
  if (e.shiftKey) {
    const panAmount = e.deltaY * 0.5;
    transform.y -= panAmount;
    applyTransform();
    scheduleRedraw();
  } else {
    // Use scroll for horizontal panning instead of zoom
    // Positive deltaY (scroll down) pans right, negative (scroll up) pans left
    const panAmount = e.deltaY * 0.5; // Adjust multiplier for pan sensitivity
    transform.x -= panAmount;
    applyTransform();
    scheduleRedraw();
  }
});

wrap.addEventListener('mousedown', (e) => {
  pointer.down = true;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  wrap.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
  pointer.down = false;
  wrap.style.cursor = 'default';
  // Redraw lines after panning stops
  scheduleRedraw();
});

wrap.addEventListener('mousemove', (e) => {
  if (!pointer.down) return;
  const dx = e.clientX - pointer.x;
  const dy = e.clientY - pointer.y;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  transform.x += dx;
  transform.y += dy;
  applyTransform();
  
  // Re-render with viewport culling on pan
  // Use requestAnimationFrame for smooth panning
  requestAnimationFrame(() => {
    render();
  });
});

// ============================================================================
// EVENT LISTENERS - UI CONTROLS
// ============================================================================

document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
if (tracerPrintBtn) {
  tracerPrintBtn.addEventListener('click', openTracerPrint);
}
document.getElementById('scrollUp').addEventListener('click', () => {
  scrollUp();
  render();
});
document.getElementById('scrollDown').addEventListener('click', () => {
  scrollDown();
  render();
});
document.getElementById('resetView').addEventListener('click', resetView);
document.getElementById('fit').addEventListener('click', fitView);
searchInput.addEventListener('input', handleSearch);

if (addPartitionSidebarBtn) {
  addPartitionSidebarBtn.addEventListener('click', () => {
    if (!activeSidebarNode || activeSidebarNode.type !== 'blank') return;
    showAddPartitionModal();
  });
}

function setArpDefaults() {
  if (!addPartitionForm) return;
  const arpA = addPartitionForm.querySelector('[name="arpA"]');
  const arpB = addPartitionForm.querySelector('[name="arpB"]');
  const arpC = addPartitionForm.querySelector('[name="arpC"]');
  if (arpA) arpA.value = '149';
  if (arpB) arpB.value = '00';
  if (arpC) {
    const selectedBarangay = barangaySelect?.value || '';
    arpC.value = selectedBarangay ? getBarangayCode(selectedBarangay) : '';
  }
}

function showAddPartitionModal() {
  setArpDefaults();
  addPartitionModal?.classList.remove('hidden');
}

function hideAddPartitionModal() {
  addPartitionModal?.classList.add('hidden');
}

if (addPartitionModal) {
  addPartitionModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', hideAddPartitionModal));
}
if (cancelAddPartitionBtn) {
  cancelAddPartitionBtn.addEventListener('click', hideAddPartitionModal);
}
if (barangaySelect) {
  barangaySelect.addEventListener('change', () => {
    const val = barangaySelect.value || '';
    const code = getBarangayCode(val);
    // debug: log selected barangay and resolved code to console
    try { console.debug('barangay select ->', val, '-> code', code); } catch (e) { /* ignore */ }
    const arpC = addPartitionForm?.querySelector('[name="arpC"]');
    if (arpC) arpC.value = code;
  });
}
if (addPartitionForm) {
  addPartitionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(addPartitionForm);
    const arpValues = [
      formData.get('arpA')?.toString().trim() || '',
      formData.get('arpB')?.toString().trim() || '',
      formData.get('arpC')?.toString().trim() || '',
      formData.get('arpD')?.toString().trim() || '',
      formData.get('arpE')?.toString().trim() || '',
      formData.get('arpF')?.toString().trim() || ''
    ];
    const serverPin = arpValues.join('-');

    const effValue = formData.get('eff')?.toString().trim() || '';
    const newNode = {
      id: 'par_' + Date.now(),
      type: 'parcel',
      FID: null,
      PIN: formData.get('assessorsLotNo')?.toString().trim() || '',
      SERVER_PIN: serverPin,
      NEW_PIN: formData.get('newPin')?.toString().trim() || '',
      BARANGAY: formData.get('barangay')?.toString().trim() || '',
      SECTION_NO: formData.get('section')?.toString().trim() || '',
      CADASTRAL_SURVEY_NO: formData.get('cadastralLotNo')?.toString().trim() || '',
      TITLE_NO: formData.get('titleNo')?.toString().trim() || '',
      EFF: effValue,
      DECLARATION_NO: effValue,
      CONVEYANCE: formData.get('conveyance')?.toString().trim() || '',
      DECLARANT: formData.get('declarant')?.toString().trim() || '',
      PARCEL_NO: formData.get('arpE')?.toString().trim() || '',
      DISPLAY_NAME: formData.get('nameOfOwner')?.toString().trim() || '',
      OWNER_ADDRESS: formData.get('location')?.toString().trim() || '',
      TOTAL_AREA: formData.get('areaSqm')?.toString().trim() || '',
      DATA_UNIT: 'sqm',
      TOTAL_MARKET_VALUE: '',
      TOTAL_ASSESSED_VALUE: '',
      CLASSIFICATION: formData.get('classificationCode')?.toString().trim() || '',
      SECTION_NO: formData.get('sectionNo')?.toString().trim() || '',
      name: formData.get('nameOfOwner')?.toString().trim() || 'New parcel',
      children: []
    };

    if (activeSidebarNode) {
      replaceNodeById(ORG_DATA, activeSidebarNode.id, newNode);
      saveOrgData();
      hideAddPartitionModal();
      addPartitionForm.reset();
      showDetails(newNode);
      render();
    }
  });
}

function replaceNodeById(node, nodeId, replacement) {
  if (!node || !node.children) return false;
  const index = node.children.findIndex(child => child.id === nodeId);
  if (index !== -1) {
    node.children[index] = replacement;
    return true;
  }
  return node.children.some(child => replaceNodeById(child, nodeId, replacement));
}

// Delete modal event handlers
const deleteModalForm = document.getElementById('deleteModalForm');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

if (deleteModalForm) {
  deleteModalForm.addEventListener('submit', confirmDeleteNode);
}
if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', hideDeleteModal);
}

// Redraw connector lines on window resize (with debouncing)
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    render();
  }, 150);
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Populate dropdowns in the Add Partition modal
tryLoadSystemConfig();

// Initial render
render();
applyTransform();

// If the page was opened with a `lot` or `pin` query param, focus that node
(function() {
  try {
    var params = new URLSearchParams(window.location.search || '');
    var lot = params.get('lot') || params.get('search') || params.get('lotNumber');
    var pin = params.get('pin');
    if (lot) {
      // delay slightly so initial layout settles
      setTimeout(function() { focusOnLot(lot); }, 180);
    } else if (pin) {
      setTimeout(function() { focusOnLot(pin); }, 180);
    }
  } catch (e) { /* ignore */ }
})();

/**
 * USAGE NOTES:
 * - Edit ORG_DATA to add more nodes
 * - Add children arrays with type: 'cadastral' (lotNumber, lastName, firstName, barangay, section, area, remarks)
 *   or type: 'parcel' (PIN, FID, SERVER_PIN, DISPLAY_NAME, OWNER_ADDRESS, etc.)
 * - Lines connecting parent-child nodes are drawn via CSS (node-children::before and ::after pseudo-elements)
 * - All interactivity is handled here: pan, zoom, search, node add/delete, sidebar details
 */
