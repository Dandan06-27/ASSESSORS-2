const paperSizeSelect = document.getElementById('paperSize');
const printButton = document.getElementById('printButton');
const tracerTable = document.getElementById('tracerTable').querySelector('tbody');
const footerMeta = document.getElementById('footerMeta');
let currentPaperSize = 'a4';

function applyPaperSize(size) {
  currentPaperSize = size;
  document.body.classList.toggle('letter', size === 'letter');
  document.body.classList.toggle('a4', size === 'a4');

  const styleSheetId = 'pageSizeStyle';
  let styleSheet = document.getElementById(styleSheetId);
  if (!styleSheet) {
    styleSheet = document.createElement('style');
    styleSheet.id = styleSheetId;
    document.head.appendChild(styleSheet);
  }

  const pageSizeRule = size === 'letter' ? 'letter' : 'A4';
  styleSheet.textContent = `@page { size: ${pageSizeRule} portrait; margin: 0; }`;
}

function buildRow(cells) {
  const row = document.createElement('tr');
  cells.forEach(value => {
    const cell = document.createElement('td');
    cell.innerHTML = value ? String(value) : '&nbsp;';
    row.appendChild(cell);
  });
  return row;
}

function renderTracerRows(items) {
  tracerTable.innerHTML = '';
  const rows = Array.isArray(items) && items.length ? items : new Array(6).fill(null);
  rows.forEach(item => {
    tracerTable.appendChild(buildRow([
      item?.tdNo,
      item?.declarant,
      item?.location,
      item?.lotNo,
      item?.area,
      item?.pin,
      item?.conveyance,
      item?.eff
    ]));
  });
}

function updateFooter() {
  const now = new Date();
  footerMeta.textContent = `Printed on ${now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function handlePrint() {
  updateFooter();
  window.print();
}

function initializePage() {
  const url = new URL(window.location.href);
  const requestedSize = url.searchParams.get('size');
  const initialSize = requestedSize === 'letter' ? 'letter' : 'a4';
  paperSizeSelect.value = initialSize;
  applyPaperSize(initialSize);

  const rawData = localStorage.getItem('tracerPrintData');
  let rows = [];
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed.rows)) {
        rows = parsed.rows;
      }
    } catch (err) {
      console.warn('Unable to parse tracer print data:', err);
    }
    localStorage.removeItem('tracerPrintData');
  }

  renderTracerRows(rows);
  updateFooter();
}

paperSizeSelect.addEventListener('change', () => {
  applyPaperSize(paperSizeSelect.value);
});
printButton.addEventListener('click', handlePrint);
window.addEventListener('DOMContentLoaded', initializePage);

window.tracerPrint = {
  setPaperSize: applyPaperSize,
  renderTracerRows,
  updateFooter
};
