// ══════════════════════════════════════════════════════════
// STATE-AND-UI.JS — Form state + generic DOM builder helpers
// loadForm/saveForm/history/archiveCurrent (how a report is
// loaded, saved, and moved to history), plus small reusable UI
// builders (h, lbl, inp, sel, card, field, toggle, ambRow, etc.)
// used by every tab in narrative-and-tabs.js.
// Depends on: data.js (EMPTY, PERSONNEL, etc.)
// ══════════════════════════════════════════════════════════

// ══════════════════════════════
// STATE
// ══════════════════════════════
let tab = 0;
let F = {...EMPTY}; // placeholder — properly loaded after personnel fetch

function loadForm() {
  let data = {...EMPTY};
  try {
    const s = localStorage.getItem("afr_v4");
    if (s) {
      const parsed = JSON.parse(s);
      data = Object.assign({}, EMPTY, parsed);
    }
  } catch(e) {}

  // ── Migrations for old data formats ──────────────────────
  // mutual: was string, now array
  if (!Array.isArray(data.mutual)) {
    data.mutual = data.mutual ? [data.mutual] : [];
  }
  // cars: expand to 6 if fewer
  if (!Array.isArray(data.cars)) data.cars = [];
  while (data.cars.length < 6) data.cars.push({model:"",plate:"",color:""});

  // amb: old format had {svc,custom,als} → now {svc,custom,pcr}
  if (!Array.isArray(data.amb)) data.amb = [];
  while (data.amb.length < 3) data.amb.push({svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""});
  data.amb = data.amb.map(a => ({
    svc: a.svc||"", custom: a.custom||"",
    pcr: a.pcr || a.als || "",  // migrate als→pcr if needed
    hospital: a.hospital||"", hospitalOther: a.hospitalOther||""
  }));

  // refusedPcr: ensure array
  if (!Array.isArray(data.refusedPcr)) data.refusedPcr = ["","",""];
  while (data.refusedPcr.length < 3) data.refusedPcr.push("");

  // law: ensure array of 3
  if (!Array.isArray(data.law)) data.law = ["","",""];
  while (data.law.length < 3) data.law.push("");

  // apparatus / personnel: ensure objects
  if (typeof data.apparatus !== 'object' || Array.isArray(data.apparatus)) data.apparatus = {};
  if (typeof data.personnel !== 'object' || Array.isArray(data.personnel)) data.personnel = {};
  if (typeof data.apparatusDriver !== 'object' || Array.isArray(data.apparatusDriver)) data.apparatusDriver = {};
  if (typeof data.apparatusEnroute !== 'object' || Array.isArray(data.apparatusEnroute)) data.apparatusEnroute = {};
  if (typeof data.apparatusArrived !== 'object' || Array.isArray(data.apparatusArrived)) data.apparatusArrived = {};
  // Enroute/Arrived are now tracked per apparatus — drop the old department-wide fields
  delete data.enroute; delete data.arrived;

  // narrative fields: ensure present (added in later version)
  if (typeof data.nerisCat !== 'string') data.nerisCat = '';
  if (typeof data.nerisType !== 'string') data.nerisType = '';
  if (typeof data.nerisTypeOther !== 'string') data.nerisTypeOther = '';
  if (typeof data.nerisCode !== 'string') data.nerisCode = '';
  if (typeof data.icRank !== 'string') data.icRank = '';
  if (typeof data.locationUseOther !== 'string') data.locationUseOther = '';
  if (typeof data.arrivalCondOther !== 'string') data.arrivalCondOther = '';
  if (typeof data.locationUse !== 'string') data.locationUse = '';
  // migrate old NFIRS fields if present
  if (data.nfirsType && !data.nerisType) data.nerisType = data.nfirsType;
  if (data.propertyType && !data.locationUse) data.locationUse = data.propertyType;
  delete data.nfirsType; delete data.propertyType;
  delete data.dispType; delete data.dispDetail;
  delete data.locCode;
  delete data._openTactic; delete data._openTactics;
  if (typeof data._status !== 'string' || !data._status) data._status = 'unstarted';
  if (typeof data.responseMode !== 'string') data.responseMode = '';
  if (typeof data.arrivalCond !== 'string') data.arrivalCond = '';
  if (!Array.isArray(data.actionsTaken)) data.actionsTaken = [];
  // Drop legacy flat action labels (pre-NERIS-tactics format had no "Category: " prefix)
  data.actionsTaken = data.actionsTaken.filter(function(a){ return typeof a==='string' && a.indexOf(': ')>=0; });
  if (typeof data.waterSupply !== 'string') data.waterSupply = '';
  if (typeof data.disposition !== 'string') data.disposition = '';
  if (typeof data.cause !== 'string') data.cause = '';
  if (typeof data.narrative !== 'string') data.narrative = '';
  if (typeof data.numPatients !== 'string') data.numPatients = '';
  if (typeof data.mvcVehicles !== 'string') data.mvcVehicles = '';
  if (typeof data.mvcExtrication !== 'string') data.mvcExtrication = '';
  if (typeof data.mvcEntrapped !== 'string') data.mvcEntrapped = '';
  if (!Array.isArray(data.mvcHazards)) data.mvcHazards = [];

  // Strip retired fields from older saved reports (no longer used)
  delete data.enteredBy; delete data.badge; delete data.entryDate;
  delete data.pg; delete data.pgOf; delete data.signature;

  // ensure a stable id for history tracking
  if (!data._id) data._id = 'r' + Date.now();

  return data;
}

function saveForm() {
  try { localStorage.setItem("afr_v4", JSON.stringify(F)); } catch(e) {}
}

// When a roster member is chosen in any dropdown (IC, driver, report-by,
// injured), automatically check them on the Personnel tab so the on-scene
// count stays accurate. Only marks valid roster badges; ignores blanks.
function markOnScene(badge) {
  if (!badge) return;
  if (!PERSONNEL.some(p => p.badge === badge)) return;
  if (!F.personnel) F.personnel = {};
  F.personnel[badge] = true;
}

// Build a fresh empty report object
function blankReport() {
  return Object.assign({}, EMPTY, {
    amb:[{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""},{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""},{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""}],
    refusedPcr:["","",""],
    law:["","",""],
    cars:[{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""}],
    apparatus:{}, apparatusDriver:{}, apparatusEnroute:{}, apparatusArrived:{}, personnel:{}, mutual:[],
  });
}

// ── Report history (keeps the last 10 saved reports) ──────
function getHistory() {
  try {
    const s = localStorage.getItem("afr_history");
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch(e) { return []; }
}

function setHistory(arr) {
  try { localStorage.setItem("afr_history", JSON.stringify(arr.slice(0,10))); } catch(e) {}
}

// Returns true if the current report has any meaningful data worth saving
function reportHasData() {
  if (F.runNum || F.date || F.ic || F.address || F.remarks) return true;
  if (Object.keys(F.personnel||{}).length) return true;
  if (Object.keys(F.apparatus||{}).length) return true;
  if (F.disp || F.clear || F.inQ) return true;
  return false;
}

// Archive the current report into history (newest first), dedupe by id.
// Saves to localStorage immediately (always works, even offline), and
// also pushes to the shared cloud database in the background so every
// member's app can see it.
function archiveCurrent() {
  if (!reportHasData()) return;
  const hist = getHistory();
  // ensure the current report has a stable id
  if (!F._id) F._id = 'r' + Date.now();
  F._saved = Date.now();
  // remove any existing copy with the same id, then prepend
  const filtered = hist.filter(r => r._id !== F._id);
  filtered.unshift(JSON.parse(JSON.stringify(F)));
  setHistory(filtered);
  saveReportToCloud(F);
}

// Push one report to the shared cloud database. Fire-and-forget: if it
// fails (offline, Worker down), the report still lives in local history
// and gets synced next time saveReportToCloud succeeds for it.
async function saveReportToCloud(report) {
  try {
    const icP = PERSONNEL.find(p => p.badge === report.ic);
    const payload = Object.assign({}, report, { _icName: icP ? icP.name : (report.ic||''), _status: report._status || 'unstarted' });
    const res = await fetch(REPORTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (e) {
    console.warn('Could not save report to cloud (kept locally):', e.message);
  }
}

// Start a brand-new report (archives the current one first)
function newReport() {
  if (reportHasData() && !confirm("Start a new report? The current report will be saved to history first.")) return;
  archiveCurrent();
  F = blankReport();
  F._id = 'r' + Date.now();
  F._status = 'unstarted';
  viewMode = 'editor';
  tab = 0;
  try { localStorage.setItem("afr_v4", JSON.stringify(F)); } catch(e) {}
  render();
  showCadPasteModal();
}

// Marks the current report as opened/being worked on. Called whenever a
// member navigates into an Unstarted report's tabs — flips it out of the
// Unstarted queue and into In Progress, both locally and in the cloud.
function markInProgress() {
  if (F._status === 'unstarted') {
    F._status = 'in_progress';
    saveForm();
    saveReportToCloud(F);
  }
}

// Modal shown at the start of a new report: paste the CAD dispatch email to
// auto-fill the opening fields. Fully skippable.
function showCadPasteModal() {
  // Remove any existing modal first
  var existing = document.getElementById('cadModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'cadModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;'
    + 'display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto';

  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:14px;max-width:560px;width:100%;margin-top:24px;'
    + 'padding:20px 20px 16px;box-shadow:0 10px 40px rgba(0,0,0,0.35);font-family:Georgia,serif';

  const h = document.createElement('div');
  h.style.cssText = 'font-size:18px;font-weight:700;color:#8b0000;margin-bottom:4px';
  h.textContent = 'Start from Dispatch';
  box.appendChild(h);

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:12.5px;color:#777;margin-bottom:12px;line-height:1.45';
  sub.textContent = 'Paste the CAD dispatch email to auto-fill the incident number, address, time, category, apparatus times, and mutual aid. Or skip and enter it by hand.';
  box.appendChild(sub);

  const modalTa = document.createElement('textarea');
  modalTa.className = 'ta';
  modalTa.rows = 8;
  modalTa.placeholder = 'Paste the dispatch email / CAD text here…';
  Object.assign(modalTa.style, { fontSize:'13px', lineHeight:'1.4', width:'100%', marginBottom:'10px' });
  box.appendChild(modalTa);

  const status = document.createElement('div');
  status.style.cssText = 'font-size:12px;margin:0 0 12px;line-height:1.4;min-height:16px';
  box.appendChild(status);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap';

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.style.cssText = 'background:none;border:1.5px solid #c8a97a;color:#8b0000;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;font-family:Georgia,serif;cursor:pointer';
  skipBtn.addEventListener('click', () => {
    overlay.remove();
    saveReportToCloud(F); // record the blank Unstarted entry either way
  });
  btnRow.appendChild(skipBtn);

  const goBtn = document.createElement('button');
  goBtn.textContent = '⚡ Auto-Fill & Start';
  goBtn.style.cssText = 'background:#1a4a8a;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:700;font-family:Georgia,serif;cursor:pointer';
  goBtn.addEventListener('click', () => {
    const res = applyDispatchParse(modalTa.value);
    if (res.filled.length) {
      overlay.remove();
      saveReportToCloud(F);
      render();
    } else {
      status.style.color = '#8b0000';
      status.textContent = res.anyFound
        ? 'Those fields are already filled in.'
        : 'Couldn\u2019t recognize anything in that text. You can skip and enter it by hand.';
    }
  });
  btnRow.appendChild(goBtn);

  box.appendChild(btnRow);
  overlay.appendChild(box);
  // Tapping the dark area skips
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  modalTa.focus();
}

// Load a report from history into the active form
function loadFromHistory(id) {
  const hist = getHistory();
  const found = hist.find(r => r._id === id);
  if (!found) return;
  // archive whatever is currently open first (if it has data and isn't the same report)
  if (reportHasData() && F._id !== id) archiveCurrent();
  F = Object.assign(blankReport(), JSON.parse(JSON.stringify(found)));
  tab = 0;
  try { localStorage.setItem("afr_v4", JSON.stringify(F)); } catch(e) {}
  render();
}

// Delete a report from history (local + cloud)
function deleteFromHistory(id) {
  if (!confirm("Delete this report from history? This cannot be undone.")) return;
  setHistory(getHistory().filter(r => r._id !== id));
  deleteReportFromCloud(id);
  render();
}

async function deleteReportFromCloud(id) {
  try {
    const res = await fetch(REPORTS_API_URL + '?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (e) {
    console.warn('Could not delete report from cloud:', e.message);
  }
}

// Open a report that exists in the cloud but maybe not in local history
// (e.g. filed by another member on a different device).
async function loadFromCloudReport(id) {
  try {
    const res = await fetch(REPORTS_API_URL + '?id=' + encodeURIComponent(id));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const found = await res.json();
    if (reportHasData() && F._id !== id) archiveCurrent();
    F = Object.assign(blankReport(), found);
    tab = 0;
    try { localStorage.setItem("afr_v4", JSON.stringify(F)); } catch(e) {}
    render();
  } catch (e) {
    alert('Could not load that report: ' + e.message);
  }
}

function clearForm() {
  if (!confirm("Clear all form data and start fresh?")) return;
  F = blankReport();
  F._id = 'r' + Date.now();
  try { localStorage.removeItem("afr_v4"); } catch(e) {}
  render();
}

// ══════════════════════════════
// HELPERS
// ══════════════════════════════
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})) {
    if (k === 'onclick') el.addEventListener('click', v);
    else if (k === 'onchange') el.addEventListener('change', v);
    else if (k === 'oninput') el.addEventListener('input', v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

function lbl(text) {
  const d = document.createElement('div');
  d.className = 'lbl';
  d.textContent = text;
  return d;
}

function inp(value, onInput, opts={}) {
  const el = document.createElement('input');
  el.type = opts.type || 'text';
  el.value = value || '';
  el.placeholder = opts.placeholder || '';
  el.className = 'inp';
  if (opts.style) Object.assign(el.style, opts.style);
  el.addEventListener('input', e => { onInput(e.target.value); });
  return el;
}

// Like inp but does NOT call onChange on every keystroke — only on blur/change.
// Use this inside functions that re-render their parent container on save,
// so the input field isn't destroyed mid-typing.
function stableInp(value, onChange, opts={}) {
  const el = document.createElement('input');
  el.type = opts.type || 'text';
  el.value = value || '';
  el.placeholder = opts.placeholder || '';
  el.className = 'inp';
  if (opts.style) Object.assign(el.style, opts.style);
  // Save on blur (when user leaves the field)
  el.addEventListener('blur', e => { onChange(e.target.value); });
  // Also save on Enter key
  el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
  return el;
}

function sel(value, options, onChange, style={}) {
  const el = document.createElement('select');
  el.className = 'sel';
  Object.assign(el.style, style);
  for (const [v, t] of options) {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    if (v === value) o.selected = true;
    el.appendChild(o);
  }
  el.addEventListener('change', e => onChange(e.target.value));
  return el;
}

function card(title, ...children) {
  const c = document.createElement('div');
  c.className = 'card';
  if (title) {
    const t = document.createElement('div');
    t.className = 'card-title';
    t.textContent = title;
    c.appendChild(t);
  }
  const b = document.createElement('div');
  b.className = 'card-body';
  for (const child of children.flat()) {
    if (child) b.appendChild(child);
  }
  c.appendChild(b);
  return c;
}

function field(labelText, inputEl, mb=10) {
  const w = document.createElement('div');
  w.className = 'field-row';
  w.style.marginBottom = mb+'px';
  w.appendChild(lbl(labelText));
  w.appendChild(inputEl);
  return w;
}

// A labeled dropdown that reveals a free-text box when an "Other" option is
// chosen. `getVal`/`setVal` read/write the main value; `getOther`/`setOther`
// read/write the companion custom text. The text box shows whenever the
// selected option label starts with or equals "Other".
function fieldWithOther(labelText, value, options, onChange, otherValue, onOtherChange, mb=10) {
  const w = document.createElement('div');
  w.className = 'field-row';
  w.style.marginBottom = mb+'px';
  w.appendChild(lbl(labelText));

  function isOther(v){ return typeof v === 'string' && /^other\b/i.test(v.trim()); }

  const otherBox = document.createElement('input');
  otherBox.type = 'text';
  otherBox.className = 'inp';
  otherBox.placeholder = 'Please specify…';
  otherBox.value = otherValue || '';
  otherBox.style.marginTop = '8px';
  otherBox.style.display = isOther(value) ? 'block' : 'none';
  otherBox.addEventListener('input', e => onOtherChange(e.target.value));

  const dd = sel(value, options, v => {
    onChange(v);
    otherBox.style.display = isOther(v) ? 'block' : 'none';
    if (!isOther(v)) { otherBox.value = ''; onOtherChange(''); }
  });

  w.appendChild(dd);
  w.appendChild(otherBox);
  return w;
}

function flexRow(...children) {
  const d = document.createElement('div');
  d.className = 'flex-row';
  for (const c of children) if (c) d.appendChild(c);
  return d;
}

function flexCol(flex, ...children) {
  const d = document.createElement('div');
  d.style.flex = flex;
  for (const c of children) if (c) d.appendChild(c);
  return d;
}

function toggle(labelText, subText, isOn, onToggle) {
  const d = document.createElement('div');
  d.className = 'toggle' + (isOn ? ' on' : '');

  const box = document.createElement('div');
  box.className = 'toggle-box';
  box.textContent = '✓';

  const textWrap = document.createElement('div');
  const tl = document.createElement('div');
  tl.className = 'toggle-label';
  tl.textContent = labelText;
  textWrap.appendChild(tl);
  if (subText) {
    const ts = document.createElement('div');
    ts.className = 'toggle-sub';
    ts.textContent = subText;
    textWrap.appendChild(ts);
  }

  d.appendChild(box);
  d.appendChild(textWrap);
  d.addEventListener('click', () => onToggle(!isOn));
  return d;
}

function timeInput(labelText, value, onChange) {
  const w = document.createElement('div');
  w.style.flex = '1';
  w.appendChild(lbl(labelText));
  const i = inp(value, onChange, {type:'time'});
  w.appendChild(i);
  return w;
}

function ambRow(i, renderFn) {
  const a = F.amb[i];
  const wrap = document.createElement('div');

  // Service dropdown
  const svcOpts = [["","— Select Service —"], ...AMB_SERVICES.map(s=>[s,s])];
  wrap.appendChild(lbl('Service'));
  const svcSel = sel(a.svc, svcOpts, v => {
    F.amb[i] = {...F.amb[i], svc:v, custom:""};
    saveForm();
    if (renderFn) renderFn();
  }, {marginBottom:'8px'});
  wrap.appendChild(svcSel);

  // Custom name if "Other"
  if (a.svc === 'Other') {
    const custLbl = document.createElement('div');
    custLbl.className = 'lbl';
    custLbl.textContent = 'Enter Service Name';
    custLbl.style.marginBottom = '4px';
    wrap.appendChild(custLbl);
    const ci = inp(a.custom, v => { F.amb[i].custom = v; saveForm(); }, {placeholder:'Service name'});
    ci.style.marginBottom = '8px';
    wrap.appendChild(ci);
  }

  // PCR # + destination (only shown once a service is selected)
  if (a.svc) {
    const pcrLbl = document.createElement('div');
    pcrLbl.className = 'lbl';
    pcrLbl.textContent = 'PCR #';
    pcrLbl.style.marginBottom = '4px';
    wrap.appendChild(pcrLbl);
    const pcrInp = stableInp(a.pcr || '', v => {
      F.amb[i].pcr = v;
      saveForm();
      if (renderFn) renderFn();
    }, {placeholder:'PCR number…'});
    pcrInp.style.marginBottom = '8px';
    wrap.appendChild(pcrInp);

    // Transported to — receiving hospital (includes a Standby option for
    // an ambulance that responded but had no patient contact/transport)
    const hospLbl = document.createElement('div');
    hospLbl.className = 'lbl';
    hospLbl.textContent = 'Transported To';
    hospLbl.style.marginBottom = '4px';
    wrap.appendChild(hospLbl);
    const hospOpts = [["","— Select Hospital —"], ...HOSPITALS.map(h=>[h,h])];
    const hospSel = sel(a.hospital || '', hospOpts, v => {
      F.amb[i].hospital = v;
      if (v !== 'Other') F.amb[i].hospitalOther = '';
      saveForm();
      if (renderFn) renderFn();
    }, {marginBottom: a.hospital === 'Other' ? '8px' : '0'});
    wrap.appendChild(hospSel);

    // Free text when "Other"
    if (a.hospital === 'Other') {
      const hoLbl = document.createElement('div');
      hoLbl.className = 'lbl';
      hoLbl.textContent = 'Enter Hospital Name';
      hoLbl.style.marginBottom = '4px';
      wrap.appendChild(hoLbl);
      const hoInp = stableInp(a.hospitalOther || '', v => {
        F.amb[i].hospitalOther = v;
        saveForm();
      }, {placeholder:'Hospital name…'});
      wrap.appendChild(hoInp);
    }
  }

  return wrap;
}

