// ══════════════════════════════════════════════════════════
// NARRATIVE-AND-TABS.JS — Tab builders + auto-narrative generator
// One function per tab (tabIncident, tabCommand, tabTimes, ...,
// tabReview, tabPreview) that builds that tab's DOM. Also holds
// generateNarrative(), which turns the report's fields into
// natural-language prose.
// Depends on: data.js, state-and-ui.js, cad-parser.js (uses
// applyDispatchParse from the Dispatch tab's Auto-Fill button)
// ══════════════════════════════════════════════════════════

function tabEMS() {
  const wrap = document.createElement('div');

  // ── Number of Patients ───────────────────────────────────
  const npBody = document.createElement('div');
  const npOpts = [["","— Select —"],["0","0"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6+","6 or more"]];
  npBody.appendChild(field('Number of Patients', sel(F.numPatients||'', npOpts, v=>{F.numPatients=v;saveForm();})));
  wrap.appendChild(card('Patients', npBody));

  // ── Ambulances — progressive reveal ─────────────────────
  const emsCard = document.createElement('div');
  emsCard.className = 'card';
  const emsTitle = document.createElement('div');
  emsTitle.className = 'card-title';
  emsTitle.textContent = 'Ambulances Used / Standby';
  const emsBody = document.createElement('div');
  emsBody.className = 'card-body';
  emsCard.appendChild(emsTitle);
  emsCard.appendChild(emsBody);

  function renderAmb() {
    emsBody.innerHTML = '';
    // Show next only when previous has a service selected
    const show = [
      true,
      !!(F.amb[0].svc),
      !!(F.amb[1].svc),
    ];
    for (let i = 0; i < 3; i++) {
      if (!show[i]) continue;
      if (i > 0) {
        const div = document.createElement('div');
        div.style.cssText = 'border-top:1px solid #f0e8d8;margin:12px 0 12px';
        emsBody.appendChild(div);
      }
      const rowTitle = document.createElement('div');
      rowTitle.style.cssText = 'font-size:11px;font-weight:700;color:#8b0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px';
      rowTitle.textContent = `Ambulance ${i + 1}`;
      emsBody.appendChild(rowTitle);
      emsBody.appendChild(ambRow(i, renderAmb));
    }
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#aaa;margin-top:8px';
    hint.textContent = 'Next ambulance appears after a service is selected.';
    emsBody.appendChild(hint);
  }
  renderAmb();
  wrap.appendChild(emsCard);

  // ── Refused Transport PCR — progressive reveal ───────────
  if (!F.refusedPcr) F.refusedPcr = ["","",""];
  const refCard = document.createElement('div');
  refCard.className = 'card';
  const refTitle = document.createElement('div');
  refTitle.className = 'card-title';
  refTitle.textContent = 'Refused Transport PCR #';
  const refBody = document.createElement('div');
  refBody.className = 'card-body';
  refCard.appendChild(refTitle);
  refCard.appendChild(refBody);

  function renderRefused() {
    refBody.innerHTML = '';
    const show = [
      true,
      !!(F.refusedPcr[0] && F.refusedPcr[0].trim()),
      !!(F.refusedPcr[1] && F.refusedPcr[1].trim()),
    ];
    for (let i = 0; i < 3; i++) {
      if (!show[i]) continue;
      const rowWrap = document.createElement('div');
      rowWrap.style.marginBottom = '8px';
      const rl = document.createElement('div');
      rl.className = 'lbl';
      rl.style.marginBottom = '4px';
      rl.textContent = `Refused Transport PCR #${i + 1}`;
      rowWrap.appendChild(rl);
      const ri = stableInp(F.refusedPcr[i] || '', v => {
        F.refusedPcr[i] = v;
        saveForm();
        renderRefused();
      }, {placeholder:'PCR number…'});
      rowWrap.appendChild(ri);
      refBody.appendChild(rowWrap);
    }
    const hint2 = document.createElement('div');
    hint2.style.cssText = 'font-size:11px;color:#aaa;margin-top:4px';
    hint2.textContent = 'Additional fields appear as each PCR # is entered.';
    refBody.appendChild(hint2);
  }
  renderRefused();
  wrap.appendChild(refCard);

  return wrap;
}

// ══════════════════════════════
// TABS
// ══════════════════════════════
function tabIncident() {
  const wrap = document.createElement('div');

  // Single shared style applied to every input/select in this card
  const UNI = {
    width: '100%',
    boxSizing: 'border-box',
    height: '46px',
    padding: '0 12px',
    fontSize: '16px',
    lineHeight: '46px',
    display: 'block',
  };

  function dateInp(value, onChange) {
    const el = document.createElement('input');
    el.type = 'date';
    el.className = 'inp';
    el.value = value || '';
    el.setAttribute('inputmode', 'numeric');
    Object.assign(el.style, UNI, {
      textAlign: 'left',
      WebkitAppearance: 'none',
      appearance: 'none',
      minHeight: '46px',
      maxHeight: '46px',
      lineHeight: 'normal',
    });
    el.addEventListener('change', e => onChange(e.target.value));
    return el;
  }

  function persDropdown(currentVal, onChange) {
    const opts = [["","— Select —"], ...PERSONNEL.map(p=>[p.badge, p.name])];
    const el = sel(currentVal, opts, onChange);
    Object.assign(el.style, UNI);
    return el;
  }

  function textInp(value, onChange, placeholder) {
    const el = inp(value, onChange, {placeholder});
    Object.assign(el.style, UNI);
    return el;
  }

  // ── Date / Incident Number card ─────────────────────────
  const infoCard = card('Date / Incident Number',
    field('Date',            dateInp(F.date,   v=>{F.date=v;   saveForm();updateHeader();}), 10),
    field('Incident Number', textInp(F.runNum, v=>{F.runNum=v; saveForm();updateHeader();}, 'e.g. 25-0142'), 0)
  );
  wrap.appendChild(infoCard);

  // ── Address card ─────────────────────────────────────────
  const addrInp = textInp(F.address, v=>{F.address=v;saveForm();}, 'Street address…');
  Object.assign(addrInp.style, UNI);

  const locBody = document.createElement('div');
  locBody.appendChild(lbl('Street Address'));
  locBody.appendChild(addrInp);

  const locCard = document.createElement('div');
  locCard.className = 'card';
  const locTitle = document.createElement('div');
  locTitle.className = 'card-title';
  locTitle.textContent = 'Location / Address';
  const locCardBody = document.createElement('div');
  locCardBody.className = 'card-body';
  locCardBody.appendChild(locBody);
  locCard.appendChild(locTitle);
  locCard.appendChild(locCardBody);
  wrap.appendChild(locCard);

  // ── Actual Dispatch Text (standalone, with auto-fill) ────
  const dtBody = document.createElement('div');

  const dtHelp = document.createElement('div');
  dtHelp.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px;line-height:1.4';
  dtHelp.textContent = 'Paste the dispatch email or text here, then tap Auto-Fill to pull out the incident number, address, date, and time.';
  dtBody.appendChild(dtHelp);

  const dtTa = document.createElement('textarea');
  dtTa.className = 'ta';
  dtTa.rows = 5;
  dtTa.placeholder = 'Paste the dispatch email / text here…';
  dtTa.value = F.dispActual || '';
  Object.assign(dtTa.style, { fontSize:'14px', lineHeight:'1.4', marginBottom:'8px' });
  dtTa.addEventListener('input', e => { F.dispActual = e.target.value; saveForm(); });
  dtBody.appendChild(dtTa);

  const dtFillStatus = document.createElement('div');
  dtFillStatus.style.cssText = 'font-size:12px;color:#888;margin-top:8px;line-height:1.5';

  const dtFillBtn = document.createElement('button');
  dtFillBtn.textContent = '⚡ Auto-Fill from Text';
  dtFillBtn.style.cssText = 'background:#1a4a8a;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:600;font-family:Georgia,serif';
  dtFillBtn.addEventListener('click', () => {
    const res = applyDispatchParse(dtTa.value);
    if (res.filled.length) {
      if (res.dispText) dtTa.value = res.dispText;
      dtFillStatus.style.color = '#2d6a2d';
      dtFillStatus.textContent = '✓ Filled: ' + res.filled.join(' · ') + '. Review everything before filing.';
      renderTab();
    } else {
      dtFillStatus.style.color = '#8b0000';
      dtFillStatus.textContent = res.anyFound
        ? 'Nothing added — those fields are already filled in. Clear a field first to re-fill it.'
        : 'Couldn\u2019t recognize anything in that text. Fill the fields in manually.';
    }
  });
  dtBody.appendChild(dtFillBtn);
  dtBody.appendChild(dtFillStatus);

  wrap.appendChild(card('Actual Dispatch Text', dtBody));

  // ── Mutual Aid card — progressive multi-select up to 12 ──
  const MUTUAL_AGENCIES = [
    "Throop Fire","Cayuga Fire","Seneca Falls Fire","Owasco Fire",
    "Auburn Fire","Union Springs Fire","Port Byron Fire","Weedsport Fire",
    "Fleming Fire","Montezuma Fire","Aurora Fire","Scipio Fire","Poplar Ridge Fire",
    "Genoa Fire","Moravia Fire","Other"
  ];

  if (!Array.isArray(F.mutual)) F.mutual = F.mutual ? [F.mutual] : [];

  const mutualCard = document.createElement('div');
  mutualCard.className = 'card';
  const mutualTitle = document.createElement('div');
  mutualTitle.className = 'card-title';
  mutualTitle.textContent = 'Mutual Aid';
  const mutualBody = document.createElement('div');
  mutualBody.className = 'card-body';

  // Given / Received direction
  const mutualDirLbl = document.createElement('div');
  mutualDirLbl.className = 'lbl';
  mutualDirLbl.textContent = 'Given or Received';
  mutualDirLbl.style.marginBottom = '4px';
  mutualBody.appendChild(mutualDirLbl);
  const mutualDirSel = sel(F.mutualDir||'', [
    ["","— Select —"],
    ["Given","Given (we assisted them)"],
    ["Received","Received (they assisted us)"],
    ["Both","Both"]
  ], v=>{ F.mutualDir=v; saveForm(); });
  Object.assign(mutualDirSel.style, UNI, {marginBottom:'12px'});
  mutualBody.appendChild(mutualDirSel);

  // Agency list container
  const agencyListDiv = document.createElement('div');
  mutualBody.appendChild(agencyListDiv);

  function renderMutualAgencies() {
    agencyListDiv.innerHTML = '';

    // Show existing entries + one new blank slot (if < 12)
    const entries = [...F.mutual];
    const showCount = Math.min(entries.length + 1, 12);

    for (let i = 0; i < showCount; i++) {
      const current = entries[i] || '';
      const isCustom = current && !MUTUAL_AGENCIES.includes(current);

      const rowDiv = document.createElement('div');
      rowDiv.style.marginBottom = '10px';

      const rowLbl = document.createElement('div');
      rowLbl.className = 'lbl';
      rowLbl.style.marginBottom = '4px';
      rowLbl.textContent = i === 0 ? 'Agency' : `Agency ${i + 1}`;
      rowDiv.appendChild(rowLbl);

      // Agency dropdown
      const agSel = document.createElement('select');
      agSel.className = 'sel';
      agSel.style.marginBottom = '6px';
      const blankOpt = document.createElement('option');
      blankOpt.value = ''; blankOpt.textContent = '— Select Agency —';
      agSel.appendChild(blankOpt);
      for (const a of MUTUAL_AGENCIES) {
        const o = document.createElement('option');
        o.value = a; o.textContent = a;
        if (a === current || (a === 'Other' && isCustom)) o.selected = true;
        agSel.appendChild(o);
      }
      rowDiv.appendChild(agSel);

      // Custom text box
      const custInp = document.createElement('input');
      custInp.type = 'text';
      custInp.className = 'inp';
      custInp.placeholder = 'Enter agency name…';
      custInp.style.marginBottom = '4px';
      custInp.style.display = (current === 'Other' || isCustom) ? 'block' : 'none';
      custInp.value = isCustom ? current : '';

      agSel.addEventListener('change', () => {
        if (agSel.value === 'Other') {
          custInp.style.display = 'block';
          custInp.focus();
          F.mutual[i] = '';
        } else {
          custInp.style.display = 'none';
          custInp.value = '';
          F.mutual[i] = agSel.value;
          // Remove trailing empty entries
          while (F.mutual.length > 0 && !F.mutual[F.mutual.length-1]) F.mutual.pop();
          saveForm();
          renderMutualAgencies();
        }
      });

      // Use blur so keyboard stays open
      custInp.addEventListener('blur', () => {
        F.mutual[i] = custInp.value.trim();
        while (F.mutual.length > 0 && !F.mutual[F.mutual.length-1]) F.mutual.pop();
        saveForm();
        renderMutualAgencies();
      });
      custInp.addEventListener('keydown', e => { if(e.key==='Enter') custInp.blur(); });

      rowDiv.appendChild(custInp);

      // Remove button (only for filled entries)
      if (current) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕ Remove';
        removeBtn.style.cssText = 'background:none;border:none;color:#8b0000;font-size:12px;cursor:pointer;padding:0;margin-top:2px;font-family:Georgia,serif';
        removeBtn.addEventListener('click', () => {
          F.mutual.splice(i, 1);
          saveForm();
          renderMutualAgencies();
        });
        rowDiv.appendChild(removeBtn);
      }

      agencyListDiv.appendChild(rowDiv);
    }

    if (F.mutual.length >= 12) {
      const cap = document.createElement('div');
      cap.style.cssText = 'font-size:11px;color:#aaa;margin-top:4px';
      cap.textContent = 'Maximum 12 agencies reached.';
      agencyListDiv.appendChild(cap);
    } else if (F.mutual.length > 0) {
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:11px;color:#aaa;margin-top:4px';
      hint.textContent = 'Select an agency above to add another.';
      agencyListDiv.appendChild(hint);
    }
  }

  renderMutualAgencies();

  mutualCard.appendChild(mutualTitle);
  mutualCard.appendChild(mutualBody);
  wrap.appendChild(mutualCard);

  return wrap;
}

// ── Command tab (Incident Commander + Rank) ─────────────────
function tabCommand() {
  const wrap = document.createElement('div');

  function persDropdown(currentVal, onChange) {
    const opts = [["","— Select —"], ...PERSONNEL.map(p=>[p.badge, p.name])];
    const el = sel(currentVal, opts, onChange);
    Object.assign(el.style, {
      width: '100%', boxSizing: 'border-box', height: '46px',
      padding: '0 12px', fontSize: '16px', lineHeight: '46px', display: 'block',
    });
    return el;
  }

  const icRankOpts = [["","— Select Rank —"], ...IC_RANKS.map(r=>[r,r])];
  const cmdCard = card('Incident Command',
    field('Incident Commander', persDropdown(F.ic, v=>{F.ic=v; markOnScene(v); saveForm();}), 10),
    field('Rank', sel(F.icRank||'', icRankOpts, v=>{F.icRank=v; saveForm();}), 0)
  );
  wrap.appendChild(cmdCard);

  return wrap;
}

// ── Time helpers ────────────────────────────────────────
function timeDiff(t1, t2) {
  // returns "X min" difference between two HH:MM strings, or '' if invalid
  if (!t1 || !t2) return '';
  const [h1,m1] = t1.split(':').map(Number);
  const [h2,m2] = t2.split(':').map(Number);
  if (isNaN(h1)||isNaN(m1)||isNaN(h2)||isNaN(m2)) return '';
  let diff = (h2*60+m2) - (h1*60+m1);
  if (diff < 0) diff += 1440; // crosses midnight
  if (diff === 0) return '';
  return `${diff} min`;
}

function makeTimeField(labelText, storeKey, prevKey) {
  const row = document.createElement('div');
  Object.assign(row.style, { display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' });

  // Label column
  const labelCol = document.createElement('div');
  Object.assign(labelCol.style, { width:'110px', flexShrink:'0' });
  const l = document.createElement('div');
  l.className = 'lbl';
  l.textContent = labelText;
  labelCol.appendChild(l);

  // Input
  const el = document.createElement('input');
  el.type = 'text';
  el.inputMode = 'numeric';
  el.className = 'inp';
  el.value = F[storeKey] || '';
  el.placeholder = 'HH:MM';
  Object.assign(el.style, { flex:'1', fontSize:'18px', fontWeight:'600', letterSpacing:'0.05em', textAlign:'center' });
  el.addEventListener('input', e => {
    let v = e.target.value.replace(/[^0-9]/g,'');
    if (v.length > 4) v = v.slice(0,4);
    // auto-insert colon
    if (v.length >= 3) v = v.slice(0,2) + ':' + v.slice(2);
    el.value = v;
    F[storeKey] = v;
    saveForm();
    updateDiff();
  });

  // Diff badge
  const diffBadge = document.createElement('div');
  Object.assign(diffBadge.style, {
    minWidth:'54px', textAlign:'center', fontSize:'12px', fontWeight:'700',
    background:'#fff3cd', border:'1px solid #c8a97a', borderRadius:'6px',
    padding:'4px 6px', color:'#5a3e00', flexShrink:'0'
  });

  function updateDiff() {
    if (prevKey) {
      const d = timeDiff(F[prevKey], F[storeKey]);
      diffBadge.textContent = d ? '+'+d : '—';
      diffBadge.style.background = d ? '#d4edda' : '#f5f5f5';
      diffBadge.style.color = d ? '#155724' : '#999';
    }
  }
  updateDiff();

  row.appendChild(labelCol);
  row.appendChild(el);
  if (prevKey) {
    row.appendChild(diffBadge);
  } else {
    // No diff badge for the first field — add an invisible spacer the same
    // size so the input width matches the other rows.
    const spacer = document.createElement('div');
    Object.assign(spacer.style, { minWidth:'54px', padding:'4px 6px', flexShrink:'0', visibility:'hidden' });
    spacer.textContent = '—';
    row.appendChild(spacer);
  }
  return row;
}

function tabTimes() {
  const wrap = document.createElement('div');

  // ── Time entry card ──────────────────────────────────────
  const body = document.createElement('div');
  body.style.padding = '13px';

  const note = document.createElement('div');
  note.style.cssText = 'font-size:11px;color:#888;margin-bottom:12px';
  note.textContent = 'Enter time as HHMM (e.g. 0405 → 04:05). Elapsed time shown in green.';
  body.appendChild(note);

  body.appendChild(makeTimeField('Dispatched',  'disp',  null));
  body.appendChild(makeTimeField('Cleared',     'clear', 'disp'));
  body.appendChild(makeTimeField('In Quarters', 'inQ',   'clear'));

  const perNote = document.createElement('div');
  perNote.style.cssText = 'font-size:11px;color:#888;margin-top:6px;line-height:1.4';
  perNote.textContent = 'Enroute and arrival times are recorded per unit on the Apparatus tab.';
  body.appendChild(perNote);

  const c = document.createElement('div');
  c.className = 'card';
  const t = document.createElement('div');
  t.className = 'card-title';
  t.textContent = 'Times';
  c.appendChild(t);
  c.appendChild(body);
  wrap.appendChild(c);

  // ── Response Time Summary card ───────────────────────────
  function parseMin(t) {
    if (!t) return null;
    const p = t.split(':');
    const h = parseInt(p[0]||0), m = parseInt(p[1]||0);
    return isNaN(h)||isNaN(m) ? null : h*60+m;
  }
  function fmtDur(mins) {
    if (mins === null || mins < 0) return '—';
    const h = Math.floor(mins/60), m = mins%60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }

  // Earliest apparatus arrival = first unit on scene
  function firstArrival() {
    var best = null;
    var arr = F.apparatusArrived || {};
    for (var k in arr) {
      if (!F.apparatus[k]) continue;
      var m = parseMin(arr[k]);
      if (m === null) continue;
      if (best === null || m < best) best = m;
    }
    return best;
  }
  var fa = firstArrival();
  var faStr = null;
  if (fa !== null) { var fh2=Math.floor(fa/60), fm2=fa%60; faStr = String(fh2).padStart(2,'0')+':'+String(fm2).padStart(2,'0'); }

  const segments = [
    ['Response Time (Dispatch → First Unit On Scene)', F.disp, faStr],
    ['Total Call Time (Dispatch → In Quarters)', F.disp, F.inQ],
  ];

  const sumCard = document.createElement('div');
  sumCard.className = 'card';
  const sumTitle = document.createElement('div');
  sumTitle.className = 'card-title';
  sumTitle.textContent = 'Response Time Summary';
  const sumBody = document.createElement('div');
  sumBody.className = 'card-body';
  sumBody.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';

  for (const [label, t1, t2] of segments) {
    const p1 = parseMin(t1), p2 = parseMin(t2);
    let diff = null;
    if (p1 !== null && p2 !== null) { diff = p2 - p1; if (diff < 0) diff += 1440; }

    const box = document.createElement('div');
    box.style.cssText = 'flex:1;min-width:130px;background:#f5ede0;border:1px solid #e0c9a6;border-radius:6px;padding:8px 10px';
    const dl = document.createElement('div');
    dl.style.cssText = 'font-size:10px;font-weight:700;color:#8b0000;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px';
    dl.textContent = label;
    const dv = document.createElement('div');
    dv.style.cssText = 'font-size:18px;font-weight:700;color:#1a1a1a';
    dv.textContent = diff !== null ? fmtDur(diff) : '—';
    box.appendChild(dl);
    box.appendChild(dv);
    sumBody.appendChild(box);
  }

  sumCard.appendChild(sumTitle);
  sumCard.appendChild(sumBody);
  wrap.appendChild(sumCard);

  return wrap;
}

function tabDispatch() {
  const wrap = document.createElement('div');

  function optList(arr){ return [["","— Select —"], ...arr.map(x=>[x,x])]; }

  // ── NERIS Incident Type — tap a category, then pick a subtype ──
  const niBody = document.createElement('div');

  const helpLine = document.createElement('div');
  helpLine.style.cssText = 'font-size:11px;color:#888;margin-bottom:10px;line-height:1.4';
  helpLine.textContent = 'Classify by what you actually found on scene (NERIS). Tap a category, then choose the type.';
  niBody.appendChild(helpLine);

  // Category buttons grid
  const catGrid = document.createElement('div');
  catGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:12px';
  for (const cat of NERIS_CATEGORIES) {
    const on = F.nerisCat === cat.code;
    const b = document.createElement('button');
    b.textContent = cat.label;
    b.style.cssText = 'padding:11px 8px;border-radius:8px;font-size:13px;font-weight:700;font-family:Georgia,serif;cursor:pointer;border:1.5px solid '
      + (on ? '#8b0000;background:#8b0000;color:#fff' : '#c8a97a;background:#fff8f0;color:#8b0000');
    b.addEventListener('click', () => {
      if (F.nerisCat !== cat.code) {
        F.nerisCat = cat.code; F.nerisType = ''; F.nerisTypeOther = ''; F.nerisCode = '';
        F._openTactics = {}; // let the new type's suggested tactics expand
      }
      saveForm(); renderTab();
    });
    catGrid.appendChild(b);
  }
  niBody.appendChild(catGrid);

  // Subtype dropdown for the chosen category
  if (F.nerisCat) {
    const catObj = NERIS_CATEGORIES.find(x => x.code === F.nerisCat);
    if (catObj) {
      // Options are [label, label] so F.nerisType stays a readable label;
      // the true NERIS code is stored alongside in F.nerisCode.
      const subOpts = [["","— Select —"], ...catObj.subtypes.map(s => [s.l, s.l])];
      niBody.appendChild(fieldWithOther('Incident Type — ' + catObj.label,
        F.nerisType||'', subOpts,
        v=>{
          F.nerisType = v;
          var hit = catObj.subtypes.find(s => s.l === v);
          F.nerisCode = hit ? hit.c : '';
          saveForm();
        },
        F.nerisTypeOther||'', v=>{F.nerisTypeOther=v;saveForm();}));

      // Show the official NERIS code for the selection
      if (F.nerisCode) {
        const codeLine = document.createElement('div');
        codeLine.style.cssText = 'font-size:10px;color:#888;font-family:monospace;margin-top:-4px;word-break:break-all';
        codeLine.textContent = F.nerisCode;
        niBody.appendChild(codeLine);
      }
    }
  }
  wrap.appendChild(card('Incident Type (NERIS)', niBody));

  // ── Incident Details ─────────────────────────────────────
  const detailBody = document.createElement('div');
  detailBody.appendChild(fieldWithOther('Location / Use Type',
    F.locationUse||'', optList(LOCATION_USE_TYPES),
    v=>{F.locationUse=v;saveForm();},
    F.locationUseOther||'', v=>{F.locationUseOther=v;saveForm();}));
  detailBody.appendChild(field('Response Mode', sel(F.responseMode||'', optList(RESPONSE_MODES), v=>{F.responseMode=v;saveForm();})));
  detailBody.appendChild(fieldWithOther('Conditions on Arrival',
    F.arrivalCond||'', optList(ARRIVAL_CONDITIONS),
    v=>{F.arrivalCond=v;saveForm();},
    F.arrivalCondOther||'', v=>{F.arrivalCondOther=v;saveForm();}));
  wrap.appendChild(card('Incident Details', detailBody));

  // ── Actions & Tactics (NERIS: tactic category → actions) ──
  const actBody = document.createElement('div');
  if (!Array.isArray(F.actionsTaken)) F.actionsTaken = [];

  // Suggested actions for the selected incident category (hints only)
  const suggested = TACTIC_SUGGESTIONS[F.nerisCat] || [];
  const suggestedCats = {};
  suggested.forEach(function(k){
    var i = k.indexOf(': ');
    if (i > 0) suggestedCats[k.slice(0,i)] = true;
  });

  // Which categories are expanded: manual toggles override, otherwise
  // suggested categories start open once an incident type is chosen.
  if (!F._openTactics || typeof F._openTactics !== 'object' || Array.isArray(F._openTactics)) F._openTactics = {};
  function isOpen(cat) {
    if (Object.prototype.hasOwnProperty.call(F._openTactics, cat)) return !!F._openTactics[cat];
    return !!suggestedCats[cat];
  }

  const actHelp = document.createElement('div');
  actHelp.style.cssText = 'font-size:11px;color:#888;margin-bottom:10px;line-height:1.4';
  actHelp.textContent = suggested.length
    ? 'Tactics likely for this incident type are expanded, and suggested actions are outlined. Nothing is pre-checked — tap the actions your crews actually performed.'
    : 'Tap a tactic to expand it, then check the specific actions taken (NERIS).';
  actBody.appendChild(actHelp);

  for (const t of NERIS_TACTICS) {
    // how many actions in this category are selected
    const selCount = t.actions.filter(a => F.actionsTaken.includes(t.cat + ': ' + a)).length;
    const open = isOpen(t.cat);
    const isSuggestedCat = !!suggestedCats[t.cat];

    // Category header button
    const catBtn = document.createElement('button');
    catBtn.style.cssText = 'width:100%;text-align:left;padding:10px 12px;margin-bottom:'
      + (open ? '0' : '6px') + ';border-radius:' + (open ? '8px 8px 0 0' : '8px')
      + ';font-size:13.5px;font-weight:700;font-family:Georgia,serif;cursor:pointer;'
      + 'display:flex;justify-content:space-between;align-items:center;border:1.5px solid '
      + (selCount ? '#8b0000;background:#8b0000;color:#fff'
                  : (isSuggestedCat ? '#8b0000;background:#fdf3f3;color:#8b0000'
                                    : '#c8a97a;background:#fff8f0;color:#8b0000'));
    const catLabel = document.createElement('span');
    catLabel.textContent = t.cat + (selCount ? '  (' + selCount + ')' : '');
    const catRight = document.createElement('span');
    catRight.style.cssText = 'display:flex;align-items:center;gap:8px';
    if (isSuggestedCat && !selCount) {
      const sugTag = document.createElement('span');
      sugTag.textContent = 'suggested';
      sugTag.style.cssText = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.75';
      catRight.appendChild(sugTag);
    }
    const catArrow = document.createElement('span');
    catArrow.textContent = open ? '\u25be' : '\u25b8';
    catArrow.style.opacity = '0.7';
    catRight.appendChild(catArrow);
    catBtn.appendChild(catLabel);
    catBtn.appendChild(catRight);
    catBtn.addEventListener('click', () => {
      F._openTactics[t.cat] = !open;
      renderTab();
    });
    actBody.appendChild(catBtn);

    // Expanded action chips for the open category
    if (open) {
      const actGrid = document.createElement('div');
      actGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:10px;margin-bottom:6px;'
        + 'border:1.5px solid #8b0000;border-top:none;border-radius:0 0 8px 8px;background:#fffdf9';
      for (const a of t.actions) {
        const key = t.cat + ': ' + a;
        const on = F.actionsTaken.includes(key);
        const isSug = suggested.indexOf(key) >= 0;
        const chip = document.createElement('button');
        chip.textContent = (on ? '\u2713 ' : '') + a;
        var chipStyle = 'padding:7px 11px;border-radius:16px;font-size:12px;font-family:Georgia,serif;cursor:pointer;border:1.5px ';
        if (on) chipStyle += 'solid #8b0000;background:#8b0000;color:#fff';
        else if (isSug) chipStyle += 'dashed #8b0000;background:#fdf3f3;color:#8b0000;font-weight:600';
        else chipStyle += 'solid #c8a97a;background:#fff;color:#5a3000';
        chip.style.cssText = chipStyle;
        chip.addEventListener('click', () => {
          if (F.actionsTaken.includes(key)) F.actionsTaken = F.actionsTaken.filter(x => x !== key);
          else F.actionsTaken.push(key);
          saveForm(); renderTab();
        });
        actGrid.appendChild(chip);
      }
      actBody.appendChild(actGrid);
    }
  }
  wrap.appendChild(card('Actions & Tactics', actBody));

  // ── Outcome ──────────────────────────────────────────────
  const outBody = document.createElement('div');
  outBody.appendChild(field('Water Supply', sel(F.waterSupply||'', optList(WATER_SUPPLY), v=>{F.waterSupply=v;saveForm();})));
  outBody.appendChild(field('Disposition / Outcome', sel(F.disposition||'', optList(DISPOSITIONS), v=>{F.disposition=v;saveForm();})));
  outBody.appendChild(field('Cause (optional)', sel(F.cause||'', optList(CAUSES), v=>{F.cause=v;saveForm();})));  wrap.appendChild(card('Outcome', outBody));

  return wrap;
}

// ── Auto-narrative generator ─────────────────────────────
// Returns the custom "Other" text when the selected value is an Other option,
// otherwise the value itself.
function effVal(main, other){
  if (typeof main==='string' && /^other\b/i.test(main.trim()) && other) return other;
  return main;
}

function generateNarrative() {
  function fmtDur2(t1,t2){
    function pm(t){if(!t)return null;var p=t.split(':');var h=parseInt(p[0]||0),m=parseInt(p[1]||0);return isNaN(h)||isNaN(m)?null:h*60+m;}
    var a=pm(t1),b=pm(t2); if(a===null||b===null)return null; var d=b-a; if(d<0)d+=1440;
    var h=Math.floor(d/60),mn=d%60;
    var words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
    function w(n){ return n<=12 ? words[n] : String(n); }
    if (h===0) return mn + (mn===1?' minute':' minutes');
    var hs = w(h) + (h===1?' hour':' hours');
    if (mn===0) return hs;
    return hs + ' and ' + mn + (mn===1?' minute':' minutes');
  }

  // Deterministic pick: same report → same wording (seeded by incident #).
  var seedStr = (F.runNum||'') + (F.date||'');
  var seed = 0; for (var si=0; si<seedStr.length; si++) seed = (seed*31 + seedStr.charCodeAt(si)) & 0xffffffff;
  function pick(arr){ if(!arr.length) return ''; var idx = Math.abs(seed + arr.length*7) % arr.length; seed = (seed*1103515245 + 12345) & 0x7fffffff; return arr[idx]; }

  const icP = PERSONNEL.find(p=>p.badge===F.ic);
  const icName = icP ? icP.name : (F.ic||'');
  const apps = APPARATUS.filter(a=>F.apparatus[a]);
  const selPers = PERSONNEL.filter(p=>F.personnel[p.badge]);
  const totalPers = parseInt(F.totalCt)||selPers.length;
  const mutArr = (Array.isArray(F.mutual)?F.mutual:[F.mutual]).filter(Boolean);
  const ambArr = (F.amb||[]).filter(a=>a.svc && a.hospital !== 'Standby — No Transport' && a.hospital !== 'Not Transported').map(ambName);
  const ambNotTransportedArr = (F.amb||[]).filter(a=>a.svc && a.hospital === 'Not Transported').map(ambName);
  const ambStandbyArr = (F.amb||[]).filter(a=>a.svc && a.hospital === 'Standby — No Transport').map(ambName);
  var nerisTypeEff = effVal(F.nerisType, F.nerisTypeOther);
  var locationUseEff = effVal(F.locationUse, F.locationUseOther);
  var arrivalEff = effVal(F.arrivalCond, F.arrivalCondOther);
  var cat = F.nerisCat || '';

  let s = [];

  // ── Sentence 1 — dispatch ──
  var dispVerb = pick(['was dispatched','was toned out','responded','was alerted']);
  var s1 = 'On ' + (F.date||'[date]') + ' at ' + (F.disp||'[time]') + ' hours, Aurelius Fire & Rescue ' + dispVerb;
  if (F.responseMode) {
    var rm = F.responseMode.replace(/ \(.*\)/,'').toLowerCase();
    if (rm.indexOf('emergency')>=0 && rm.indexOf('non')<0) s1 += ' emergency';
    else if (rm.indexOf('non')>=0) s1 += ' non-emergency';
  }
  // Humanize the incident type: expand abbreviations, tidy separators
  var typeText = 'incident';
  if (nerisTypeEff) {
    // Labels look like "Structure — Structural Involvement Fire" or
    // "Injury — Motor Vehicle Collision". The part after the dash is the
    // specific type and reads best on its own.
    var t = nerisTypeEff;
    var dash = t.indexOf(' — ');
    if (dash > 0) {
      var head = t.slice(0, dash);
      var tail = t.slice(dash + 3);
      // Keep the head when the tail alone wouldn't make sense on its own
      // ("Vehicle Fire — RV" → "RV vehicle fire"; "False Alarm — Accidental"
      // → "accidental false alarm"). Otherwise the tail is self-describing.
      if (/fire$|alarm$|investigation$|overpressure$/i.test(head)) {
        // don't double a word the tail already ends with ("CO Alarm" + "Alarm")
        if (tail.toLowerCase().endsWith(head.toLowerCase())) t = tail;
        else t = tail + ' ' + head;
      }
      else t = tail;
    }
    typeText = t.toLowerCase()
      .replace(/\bmvc\b/g, 'motor vehicle collision')
      .replace(/\bco\b/g, 'carbon monoxide')
      .replace(/\bess\b/g, 'energy storage system')
      .replace(/\bcva\b/g, 'stroke')
      .replace(/\brv\b/g, 'RV')
      // collapse an accidental doubled word ("...alarm alarm" → "...alarm")
      .replace(/\b(\w+)\s+\1\b/gi, '$1');
  }
  // Correct a/an for the chosen lead-in
  var lead = pick(['to a reported','for a reported','to a']);
  if (/^[aeiou]/i.test(typeText)) lead = lead.replace(/\ba$/,'an');
  s1 += ' ' + lead + ' ' + typeText;
  if (F.address && F.address.trim()) s1 += ' at ' + F.address.trim();
  if (locationUseEff && locationUseEff!=='N/A') {
    var luw = locationUseEff.toLowerCase();
    if (luw === 'residential — single family') luw = 'single-family residence';
    else if (luw === 'residential — multi family') luw = 'multi-family residence';
    else luw = luw.replace(/\s*—\s*/g, ', ');
    s1 += ', a ' + luw;
  }
  s1 += '.';
  s.push(s1);

  // ── Sentence 2 — response ──
  if (apps.length || totalPers) {
    var s2 = '';
    var respVerb = pick(['responded','turned out','were dispatched']);
    if (apps.length) {
      s2 += joinList(apps) + ' ' + respVerb;
    } else {
      s2 += 'Units ' + respVerb;
    }
    if (totalPers) s2 += ' with ' + totalPers + ' personnel';
    if (icName) {
      var icTitle = F.icRank ? F.icRank + ' ' + icName : icName;
      s2 += ', ' + pick(['under the command of','with command established by','under']) + ' ' + icTitle + (icP?(' (#'+icP.badge+')'):'');
    }
    s2 += '.';
    s.push(s2);
  }

  // ── Sentence 3 — arrival (+ patient count) ──
  // earliest apparatus arrival = first unit on scene
  var firstArr = null;
  (function(){
    var arr = F.apparatusArrived || {};
    for (var k in arr) {
      if (!F.apparatus[k]) continue;
      var t = arr[k];
      if (!t) continue;
      var p = t.split(':'); var mm = parseInt(p[0]||0)*60 + parseInt(p[1]||0);
      if (isNaN(mm)) continue;
      if (firstArr === null || mm < firstArr.m) firstArr = { m: mm, s: t };
    }
  })();

  var patientPhrase = '';
  if (F.numPatients && F.numPatients !== '0' && F.numPatients !== '') {
    patientPhrase = F.numPatients === '6+' ? '6 or more patients'
      : (F.numPatients === '1' ? 'one patient' : F.numPatients + ' patients');
  }
  if (arrivalEff) {
    var arrLow = arrivalEff.toLowerCase();
    var s3;
    if (firstArr) {
      // "The first unit arrived at HH:MM hours to find working fire"
      s3 = pick(['The first unit arrived at','First-arriving units reached the scene at','The first company arrived at'])
        + ' ' + firstArr.s + ' hours ' + pick(['to find','and found']) + ' ' + arrLow;
    } else {
      s3 = pick(['On arrival, crews found','Upon arrival, units encountered','First-arriving crews found','Crews arrived to find'])
        + ' ' + arrLow;
    }
    if (patientPhrase) {
      // avoid doubling "on scene" if the arrival condition already says it
      s3 += /on scene|patient/.test(arrLow) ? ' (' + patientPhrase + ')' : ' with ' + patientPhrase + ' on scene';
    }
    s3 += '.';
    s.push(s3);
  } else if (patientPhrase) {
    s.push(pick(['Crews found','Units encountered','On scene, crews found']) + ' ' + patientPhrase + '.');
  }

  // ── MVC details ──
  if (F.mvcVehicles || F.mvcExtrication || (F.mvcHazards && F.mvcHazards.length)) {
    var sm = pick(['The collision involved','The crash involved','Responders found']) + ' ';
    sm += (F.mvcVehicles ? (F.mvcVehicles === '6+' ? '6 or more vehicles' : (F.mvcVehicles === '1' ? 'a single vehicle' : F.mvcVehicles + ' vehicles')) : 'one or more vehicles');
    if (F.mvcExtrication === 'YES') {
      sm += ', and crews performed extrication';
      if (F.mvcEntrapped) sm += ' to free ' + (F.mvcEntrapped === '5+' ? '5 or more occupants' : (F.mvcEntrapped === '1' ? 'one occupant' : F.mvcEntrapped + ' occupants'));
    } else if (F.mvcExtrication === 'NO') {
      sm += ', with no extrication required';
    }
    sm += '.';
    s.push(sm);
    if (F.mvcHazards && F.mvcHazards.length) {
      s.push(pick(['Scene hazards included','Hazards on scene included','Crews managed hazards including']) + ' ' + joinList(F.mvcHazards.map(function(h){return h.toLowerCase();})) + '.');
    }
  }

  // ── Actions — incident-aware verb + natural action names ──
  if (Array.isArray(F.actionsTaken) && F.actionsTaken.length) {
    var actMap = {
      'establish incident command':'established command',
      'incident assessment (360 completed)':'completed a 360 size-up',
      'structural fire suppression — interior':'advanced an interior attack',
      'structural fire suppression — exterior':'conducted an exterior attack',
      'structural fire suppression — interior and exterior':'attacked the fire interior and exterior',
      'outside fire suppression':'extinguished the outside fire',
      'fire control/extinguishment':'controlled and extinguished the fire',
      'ventilation performed':'ventilated the structure',
      'forcible entry performed':'forced entry',
      'primary search':'conducted a primary search',
      'secondary search':'conducted a secondary search',
      'overhaul':'performed overhaul',
      'salvage / property conservation':'performed salvage',
      'patient assessment':'assessed the patient',
      'provide basic life support':'provided basic life support',
      'provide advanced life support':'provided advanced life support',
      'provide transport':'provided transport',
      'control traffic':'controlled traffic',
      'leak stop':'stopped the leak',
      'spill control':'controlled the spill'
    };
    var actNames = F.actionsTaken.map(function(a){
      var i = a.indexOf(': ');
      var raw = (i>=0 ? a.slice(i+2) : a).toLowerCase();
      return actMap[raw] || raw;
    });
    var actVerb;
    if (cat==='FIRE') actVerb = pick(['Crews','Companies','Firefighters']);
    else if (cat==='MEDICAL') actVerb = pick(['Crews','Responders','Personnel']);
    else actVerb = pick(['Crews','Personnel','Responders']);
    s.push(actVerb + ' ' + joinList(actNames) + '.');
  }

  // ── Water supply ──
  if (F.waterSupply && F.waterSupply!=='N/A') {
    s.push(pick(['Water supply was established via','Water was supplied by','A water supply was secured via']) + ' ' + F.waterSupply.toLowerCase() + '.');
  }

  // ── Mutual aid ──
  if (mutArr.length) {
    var dir = (F.mutualDir||'').toLowerCase();
    if (dir==='given') s.push('Mutual aid was provided to ' + joinList(mutArr) + '.');
    else if (dir==='received') s.push('Mutual aid was received from ' + joinList(mutArr) + '.');
    else s.push('Mutual aid was coordinated with ' + joinList(mutArr) + '.');
  }

  // ── Law enforcement on scene ──
  var lawArr = (F.law||[]).filter(function(l){ return l && l.trim(); }).map(function(l){
    var p = l.split('||');
    var agency = (p[0]||'').trim();
    var officer = (p[1]||'').trim();
    return { agency: agency, officer: officer };
  }).filter(function(x){ return x.agency; });

  if (lawArr.length) {
    // Group officers under each agency so one agency isn't repeated
    var byAgency = [];
    lawArr.forEach(function(x){
      var found = null;
      for (var i=0;i<byAgency.length;i++) if (byAgency[i].agency===x.agency) { found = byAgency[i]; break; }
      if (!found) { found = { agency: x.agency, officers: [] }; byAgency.push(found); }
      if (x.officer) found.officers.push(x.officer);
    });
    var agencyPhrases = byAgency.map(function(g){
      var t = g.agency;
      if (g.officers.length === 1) t += ' (' + g.officers[0] + ')';
      else if (g.officers.length > 1) t += ' (' + joinList(g.officers) + ')';
      return t;
    });
    var lawVerb = byAgency.length > 1
      ? pick(['were on scene','responded to the scene','were present on scene','also responded'])
      : pick(['was on scene','responded to the scene','was present on scene','also responded']);
    s.push(joinList(agencyPhrases) + ' ' + lawVerb + '.');
  }

  // ── EMS / disposition (combined) ──
  var disp = F.disposition || '';
  var isPatientDisp = disp === 'Patient Transported' || disp === 'Patient Refused';
  var dispHandled = false;

  // Transported ambulances, each paired with its OWN destination — avoids
  // implying multiple ambulances jointly carried one patient to one
  // hospital when in fact each is likely a separate patient/destination
  // (e.g. a multi-patient call with different ambulances going different
  // places).
  var transportedAmbs = (F.amb||[]).filter(function(a){
    return a.svc && a.hospital && a.hospital !== 'Not Transported' && a.hospital !== 'Standby — No Transport';
  }).map(function(a){
    var h = a.hospital === 'Other' ? (a.hospitalOther || '') : a.hospital;
    return { name: ambName(a), hosp: h ? h.split(' — ')[0].trim() : '' };
  });

  if (transportedAmbs.length) {
    if (transportedAmbs.length === 1) {
      // Exactly one transporting ambulance — no ambiguity about which
      // patient it carried, safe to say "the patient".
      var tHosp1 = transportedAmbs[0].hosp;
      var tHospPhrase1 = tHosp1 ? ' to ' + tHosp1 : '';
      if (disp === 'Patient Transported') {
        s.push(pick(['Patient care was provided and the patient was transported by','The patient was treated and transported by','Care was rendered and transport provided by']) + ' ' + transportedAmbs[0].name + tHospPhrase1 + '.');
        dispHandled = true;
      } else {
        s.push('Patient care and transport were handled by ' + transportedAmbs[0].name + tHospPhrase1 + '.');
      }
    } else if (transportedAmbs.every(function(x){return x.hosp===transportedAmbs[0].hosp;})) {
      // Multiple ambulances, same hospital — the app doesn't track which
      // ambulance carried which patient, so describe this factually
      // (who transported, where to) without asserting how many patients
      // were involved. Saying "the patient(s)" here would be a guess.
      var tNames = transportedAmbs.map(function(x){return x.name;});
      var tHosp = transportedAmbs[0].hosp;
      var tHospPhrase = tHosp ? ' to ' + tHosp : '';
      s.push(joinList(tNames) + ' provided patient care and transport' + tHospPhrase + '.');
      dispHandled = true;
    } else {
      // Different ambulances went to different hospitals — almost
      // certainly separate patients. Give each its own clause instead of
      // implying a joint transport.
      transportedAmbs.forEach(function(x){
        s.push(x.name + ' transported a patient' + (x.hosp ? ' to ' + x.hosp : '') + '.');
      });
      dispHandled = true;
    }
  } else if (isPatientDisp) {
    if (disp === 'Patient Transported') { s.push('The patient was transported.'); dispHandled = true; }
    else { s.push('The patient refused transport.'); dispHandled = true; }
  } else if (disp === 'Patient Refused' && ambArr.length) {
    s.push('Patient care was provided by ' + joinList(ambArr) + ', but the patient refused transport.');
    dispHandled = true;
  }

  // Ambulance(s) marked "Not Transported" — care was given, no transport.
  // Skip only if the disposition sentence already said this (that only
  // happens when there were no OTHER ambulances that did transport —
  // otherwise this ambulance's own "not transported" status still needs
  // its own mention even if a different ambulance transported the patient).
  // Avoids saying "the patient" — since the app doesn't track which
  // ambulance goes with which patient, that would be a guess on a
  // multi-patient call.
  if (ambNotTransportedArr.length && !(dispHandled && !transportedAmbs.length)) {
    s.push(joinList(ambNotTransportedArr) + ' provided patient care; no patient was transported.');
  }

  // Standby ambulance(s) — responded but had no patient contact/transport
  if (ambStandbyArr.length) {
    s.push(joinList(ambStandbyArr) + ' staged on standby and had no patient contact.');
  }

  // Refused Transport PCR # entries — documents a patient refusal with a
  // PCR on file, independent of the ambulance rows above.
  var refPcrArr = (F.refusedPcr||[]).filter(function(p){ return p && p.trim(); });
  if (refPcrArr.length) {
    var pcrWord = refPcrArr.length > 1 ? 'PCRs' : 'a PCR';
    s.push('Refusal of transport was documented with ' + pcrWord + ' on file (' + refPcrArr.join(', ') + ').');
  }

  // ── Outcome + cause ──
  var s8 = '';
  if (disp && !dispHandled) {
    if (cat==='FIRE' && /extinguish|control|out/i.test(disp)) {
      s8 += pick(['The fire was placed under control','The fire was brought under control','The fire was knocked down and extinguished']) + '.';
    } else {
      s8 += pick(['The incident was resolved as','The call was cleared as','The incident concluded as']) + ' ' + disp.toLowerCase() + '.';
    }
  }
  if (F.cause && !['Undetermined','N/A','Under Investigation'].includes(F.cause)) {
    s8 += (s8?' ':'') + pick(['The cause was determined to be','The cause was found to be','Cause was attributed to']) + ' ' + F.cause.toLowerCase() + '.';
  } else if (F.cause==='Under Investigation') {
    s8 += (s8?' ':'') + 'The cause remains under investigation.';
  }
  if (s8) s.push(s8);

  // ── Return to quarters ──
  if (F.inQ) {
    var clearVerb = pick(['Units returned to quarters','Companies were placed back in service','Units cleared and returned to quarters']);
    var s9 = clearVerb + ' at ' + F.inQ + ' hours';
    var tot = fmtDur2(F.disp, F.inQ);
    if (tot) s9 += ', ' + pick(['for a total call time of','having operated for','after a total incident time of']) + ' ' + tot;
    s9 += '.';
    s.push(s9);
  }

  return s.join(' ');
}

function joinList(arr){
  if (!arr.length) return '';
  if (arr.length===1) return arr[0];
  if (arr.length===2) return arr[0]+' and '+arr[1];
  return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];
}

function tabApparatus() {
  const wrap = document.createElement('div');
  const persOpts = [["","— Select Driver —"], ...PERSONNEL.map(p=>[p.badge, p.name+(p.qual?' ('+p.qual+')':'')])];

  for (const a of APPARATUS) {
    const isOn = !!F.apparatus[a];

    // Container card per apparatus
    const itemWrap = document.createElement('div');
    Object.assign(itemWrap.style, { marginBottom:'10px' });

    // Toggle row
    const tog = toggle(a, isOn && F.apparatusDriver && F.apparatusDriver[a]
      ? 'Driver: ' + (PERSONNEL.find(p=>p.badge===(F.apparatusDriver||{})[a])||{name:''}).name
      : '', isOn, on => {
      if (on) F.apparatus[a] = true;
      else {
        delete F.apparatus[a];
        if (F.apparatusDriver) delete F.apparatusDriver[a];
        if (F.apparatusEnroute) delete F.apparatusEnroute[a];
        if (F.apparatusArrived) delete F.apparatusArrived[a];
      }
      saveForm(); renderTab();
    });
    itemWrap.appendChild(tog);

    // If active, show driver dropdown + per-unit times
    if (isOn) {
      if (!F.apparatusDriver) F.apparatusDriver = {};
      const driverSel = sel(F.apparatusDriver[a]||'', persOpts, v => {
        if (!F.apparatusDriver) F.apparatusDriver = {};
        F.apparatusDriver[a] = v;
        markOnScene(v);
        saveForm();
        // update sub label without full re-render
        const sub = tog.querySelector('.toggle-sub');
        if (sub) sub.textContent = v ? 'Driver: '+(PERSONNEL.find(p=>p.badge===v)||{name:''}).name : '';
      }, { marginTop:'6px', borderRadius:'6px', padding:'8px 10px', fontSize:'14px' });
      itemWrap.appendChild(driverSel);

      // Per-unit Enroute / Arrived times
      if (!F.apparatusEnroute) F.apparatusEnroute = {};
      if (!F.apparatusArrived) F.apparatusArrived = {};

      const timeRow = document.createElement('div');
      timeRow.style.cssText = 'display:flex;gap:8px;margin-top:6px';

      function unitTimeInput(store, label) {
        const box = document.createElement('div');
        box.style.cssText = 'flex:1';
        const l = document.createElement('div');
        l.className = 'lbl';
        l.textContent = label;
        l.style.cssText = 'font-size:10px;margin-bottom:3px';
        box.appendChild(l);
        const inp2 = document.createElement('input');
        inp2.type = 'text';
        inp2.inputMode = 'numeric';
        inp2.className = 'inp';
        inp2.placeholder = 'HH:MM';
        inp2.value = (F[store] && F[store][a]) || '';
        Object.assign(inp2.style, { padding:'8px 10px', fontSize:'15px', fontWeight:'600', textAlign:'center', letterSpacing:'0.05em' });
        inp2.addEventListener('input', e => {
          let v = e.target.value.replace(/[^0-9]/g,'');
          if (v.length > 4) v = v.slice(0,4);
          if (v.length >= 3) v = v.slice(0,2) + ':' + v.slice(2);
          e.target.value = v;
          if (!F[store]) F[store] = {};
          F[store][a] = v;
          saveForm();
          updateUnitDiff();
        });
        box.appendChild(inp2);
        return box;
      }

      const enrBox = unitTimeInput('apparatusEnroute', 'Enroute');
      const arrBox = unitTimeInput('apparatusArrived', 'Arrived');

      // elapsed badge: dispatch → this unit's arrival
      const unitDiff = document.createElement('div');
      unitDiff.style.cssText = 'min-width:56px;text-align:center;font-size:11px;font-weight:700;'
        + 'background:#f5f5f5;border:1px solid #c8a97a;border-radius:6px;padding:4px 6px;color:#999;'
        + 'align-self:flex-end;margin-bottom:1px';
      function updateUnitDiff() {
        const d = timeDiff(F.disp, (F.apparatusArrived||{})[a]);
        unitDiff.textContent = d ? '+'+d : '—';
        unitDiff.style.background = d ? '#d4edda' : '#f5f5f5';
        unitDiff.style.color = d ? '#155724' : '#999';
      }
      updateUnitDiff();

      timeRow.appendChild(enrBox);
      timeRow.appendChild(arrBox);
      timeRow.appendChild(unitDiff);
      itemWrap.appendChild(timeRow);
    }

    wrap.appendChild(itemWrap);
  }

  const c = document.createElement('div');
  c.className = 'card';
  const t = document.createElement('div');
  t.className = 'card-title';
  t.textContent = 'Apparatus Responding';
  c.appendChild(t);
  const b = document.createElement('div');
  b.className = 'card-body';
  b.appendChild(wrap);
  c.appendChild(b);
  return c;
}

function tabPersonnel() {
  const selCount = PERSONNEL.filter(p=>F.personnel[p.badge]).length;

  // Calculate total personnel hours = selCount × totalCallMinutes
  function parseMin(t) {
    if (!t) return null;
    const p = t.split(':');
    const h = parseInt(p[0]||0), m = parseInt(p[1]||0);
    return isNaN(h)||isNaN(m) ? null : h*60+m;
  }
  const tDisp = parseMin(F.disp), tInQ = parseMin(F.inQ);
  let callMins = null;
  if (tDisp !== null && tInQ !== null) {
    callMins = tInQ - tDisp;
    if (callMins < 0) callMins += 1440;
  }
  const totalPersonnel = parseInt(F.totalCt) || selCount;
  const persHours = (callMins !== null && totalPersonnel > 0)
    ? ((callMins * totalPersonnel) / 60).toFixed(1)
    : null;

  const wrap = document.createElement('div');
  const togglesWrap = document.createElement('div');
  for (const p of PERSONNEL) {
    togglesWrap.appendChild(toggle(p.name, `Badge ${p.badge}${p.qual?' · '+p.qual.toUpperCase():''}`, !!F.personnel[p.badge], on => {
      if (on) F.personnel[p.badge]=true; else delete F.personnel[p.badge];
      saveForm(); renderTab();
    }));
  }
  wrap.appendChild(card(`Personnel — ${selCount} selected`, togglesWrap));

  // Counts card with personnel hours
  const countCard = document.createElement('div');
  countCard.className = 'card';
  const countTitle = document.createElement('div');
  countTitle.className = 'card-title';
  countTitle.textContent = 'Counts';
  const countBody = document.createElement('div');
  countBody.className = 'card-body';

  countBody.appendChild(flexRow(
    flexCol(1, lbl('EMTs'), inp(F.emtCt, v=>{F.emtCt=v;saveForm();}, {type:'number', placeholder:String(PERSONNEL.filter(p=>F.personnel[p.badge]&&p.qual&&p.qual.includes('emt')).length)+' (auto)'})),
    flexCol(1, lbl('Interior FF'), inp(F.intCt, v=>{F.intCt=v;saveForm();}, {type:'number', placeholder:String(PERSONNEL.filter(p=>F.personnel[p.badge]&&p.qual&&p.qual.includes('int')).length)+' (auto)'})),
    flexCol(1, lbl('Total'), inp(F.totalCt, v=>{F.totalCt=v;saveForm();}, {type:'number', placeholder:String(selCount)+' (auto)'}))
  ));

  // Personnel hours display
  const phDiv = document.createElement('div');
  phDiv.style.cssText = 'margin-top:12px;background:#f5ede0;border:1px solid #e0c9a6;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:14px';
  const phLabel = document.createElement('div');
  phLabel.style.cssText = 'font-size:11px;font-weight:700;color:#8b0000;text-transform:uppercase;letter-spacing:.05em';
  phLabel.textContent = 'Total Personnel Hours';
  const phValue = document.createElement('div');
  phValue.style.cssText = 'font-size:22px;font-weight:700;color:#1a1a1a';
  phValue.textContent = persHours !== null ? persHours + ' hrs' : '—';
  const phNote = document.createElement('div');
  phNote.style.cssText = 'font-size:10px;color:#888;margin-top:1px';
  phNote.textContent = callMins !== null
    ? `${totalPersonnel} personnel × ${callMins} min call`
    : 'Set times on Dispatch tab to calculate';
  const phLeft = document.createElement('div');
  phLeft.appendChild(phLabel);
  phLeft.appendChild(phNote);
  phDiv.appendChild(phLeft);
  phDiv.appendChild(phValue);
  countBody.appendChild(phDiv);

  countCard.appendChild(countTitle);
  countCard.appendChild(countBody);
  wrap.appendChild(countCard);

  // ── Personnel Injured ────────────────────────────────────
  wrap.appendChild(injuredCard());

  // ── Reload Roster button ─────────────────────────────────
  const btnReload = document.createElement('button');
  btnReload.className = 'btn-print';
  btnReload.textContent = '🔄 Reload Roster';
  btnReload.style.background = '#2d6a2d';
  btnReload.style.marginTop = '14px';
  btnReload.addEventListener('click', (e) => reloadPersonnel(e));
  wrap.appendChild(btnReload);

  return wrap;
}

// ── Common vehicles list ──────────────────────────────────
const COMMON_VEHICLES = [
  // Pickup Trucks
  "Ford F-150","Ford F-250","Ford F-350",
  "Chevrolet Silverado 1500","Chevrolet Silverado 2500","Chevrolet Silverado 3500",
  "GMC Sierra 1500","GMC Sierra 2500","GMC Sierra 3500",
  "Ram 1500","Ram 2500","Ram 3500",
  "Toyota Tacoma","Toyota Tundra",
  "Nissan Frontier","Nissan Titan",
  // SUVs
  "Ford Explorer","Ford Escape","Ford Edge","Ford Expedition","Ford Bronco",
  "Chevrolet Equinox","Chevrolet Traverse","Chevrolet Tahoe","Chevrolet Suburban",
  "GMC Acadia","GMC Yukon","GMC Terrain",
  "Jeep Grand Cherokee","Jeep Cherokee","Jeep Wrangler","Jeep Compass",
  "Toyota RAV4","Toyota Highlander","Toyota 4Runner","Toyota Sequoia",
  "Honda CR-V","Honda Pilot","Honda HR-V","Honda Passport",
  "Nissan Rogue","Nissan Murano","Nissan Pathfinder","Nissan Armada",
  "Hyundai Tucson","Hyundai Santa Fe","Hyundai Palisade",
  "Kia Sportage","Kia Sorento","Kia Telluride",
  "Subaru Forester","Subaru Outback","Subaru Crosstrek",
  "Mazda CX-5","Mazda CX-9",
  "Dodge Durango","Dodge Journey",
  "Lincoln Navigator","Lincoln Corsair",
  "Cadillac Escalade","Cadillac XT5",
  // Sedans / Cars
  "Toyota Camry","Toyota Corolla","Toyota Prius",
  "Honda Accord","Honda Civic",
  "Ford Fusion","Ford Mustang",
  "Chevrolet Malibu","Chevrolet Impala","Chevrolet Camaro",
  "Nissan Altima","Nissan Sentra","Nissan Maxima",
  "Hyundai Elantra","Hyundai Sonata",
  "Kia Optima","Kia Forte",
  "Subaru Impreza","Subaru Legacy",
  "Dodge Charger","Dodge Challenger",
  "Chrysler 300",
  "Volkswagen Jetta","Volkswagen Passat","Volkswagen Tiguan",
  "BMW 3 Series","BMW 5 Series","BMW X5",
  "Mercedes-Benz C-Class","Mercedes-Benz E-Class","Mercedes-Benz GLE",
  "Audi A4","Audi Q5",
  "Lexus RX","Lexus ES",
  // Vans / Minivans
  "Chrysler Pacifica","Chrysler Voyager",
  "Honda Odyssey","Toyota Sienna","Kia Carnival",
  "Ford Transit","Ford Transit Connect",
  "Chevrolet Express","GMC Savana",
  "Ram ProMaster","Ram ProMaster City",
  // Commercial / Other
  "Box Truck","Tractor Trailer / Semi","Dump Truck","Flatbed Truck",
  "School Bus","Coach Bus","Transit Bus",
  "ATV / UTV","Motorcycle","Snowmobile",
  "Other (type below)",
];

function vehicleSelector(currentVal, onChange) {
  const wrap = document.createElement('div');

  // Determine if current value is a custom entry
  const isCustom = currentVal && !COMMON_VEHICLES.includes(currentVal);
  const selectVal = isCustom ? 'Other (type below)' : (currentVal || '');

  const dd = document.createElement('select');
  dd.className = 'sel';
  dd.style.marginBottom = '8px';

  // Build option list grouped by category
  const groups = [
    { label: '— Select Vehicle —', items: [''] },
    { label: 'Pickup Trucks',      items: COMMON_VEHICLES.slice(0, 14) },
    { label: 'SUVs',               items: COMMON_VEHICLES.slice(14, 46) },
    { label: 'Cars & Sedans',      items: COMMON_VEHICLES.slice(46, 76) },
    { label: 'Vans & Minivans',    items: COMMON_VEHICLES.slice(76, 87) },
    { label: 'Commercial & Other', items: COMMON_VEHICLES.slice(87) },
  ];

  for (const g of groups) {
    if (g.label === '— Select Vehicle —') {
      const o = document.createElement('option');
      o.value = ''; o.textContent = '— Select Vehicle —';
      dd.appendChild(o);
    } else {
      const og = document.createElement('optgroup');
      og.label = g.label;
      for (const v of g.items) {
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        if (v === selectVal) o.selected = true;
        og.appendChild(o);
      }
      dd.appendChild(og);
    }
  }

  // Custom text input (shown when "Other" selected or custom value)
  const customInp = document.createElement('input');
  customInp.type = 'text';
  customInp.className = 'inp';
  customInp.placeholder = 'Year, Make, Model (e.g. 2019 Ford F-150)';
  customInp.style.display = (selectVal === 'Other (type below)' || isCustom) ? 'block' : 'none';
  customInp.value = isCustom ? currentVal : '';

  dd.addEventListener('change', () => {
    const v = dd.value;
    if (v === 'Other (type below)') {
      customInp.style.display = 'block';
      customInp.focus();
      onChange('');
    } else {
      customInp.style.display = 'none';
      onChange(v);
    }
  });

  customInp.addEventListener('input', () => { onChange(customInp.value); });

  wrap.appendChild(dd);
  wrap.appendChild(customInp);
  return wrap;
}

const VEHICLE_COLORS = [
  "Black","White","Silver","Gray","Red","Blue","Dark Blue","Light Blue",
  "Green","Dark Green","Brown","Tan / Beige","Gold","Yellow","Orange",
  "Purple","Maroon / Burgundy","Pink","Teal","Cream / Off-White",
  "Two-Tone","Other",
];

const LAW_AGENCIES = [
  "New York State Police",
  "Cayuga County Sheriff's Department",
  "City of Auburn Police",
  "Other",
];

function colorSelector(currentVal, onChange) {
  const isCustom = currentVal && !VEHICLE_COLORS.includes(currentVal);
  const wrap = document.createElement('div');

  const dd = document.createElement('select');
  dd.className = 'sel';

  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = '— Select Color —';
  dd.appendChild(blank);

  for (const c of VEHICLE_COLORS) {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    if (c === currentVal || (c === 'Other' && isCustom)) o.selected = true;
    dd.appendChild(o);
  }

  const customInp = document.createElement('input');
  customInp.type = 'text';
  customInp.className = 'inp';
  customInp.placeholder = 'Describe color…';
  customInp.style.marginTop = '6px';
  customInp.style.display = (currentVal === 'Other' || isCustom) ? 'block' : 'none';
  customInp.value = isCustom ? currentVal : '';

  dd.addEventListener('change', () => {
    if (dd.value === 'Other') {
      customInp.style.display = 'block';
      customInp.focus();
      onChange('Other');
    } else {
      customInp.style.display = 'none';
      onChange(dd.value);
    }
  });
  customInp.addEventListener('input', () => onChange(customInp.value));

  wrap.appendChild(dd);
  wrap.appendChild(customInp);
  return wrap;
}

function lawRow(idx, renderFn) {
  // Build one law enforcement row: agency dropdown + optional unit/officer text
  const current = F.law[idx] || '';
  // stored as "Agency||UnitDetail"
  const parts = current.split('||');
  const agency = parts[0] || '';
  const detail = parts[1] || '';
  const isOther = agency === 'Other';
  const isCustomAgency = agency && !LAW_AGENCIES.includes(agency);

  const wrap = document.createElement('div');
  wrap.style.marginBottom = '10px';

  const rowLbl = document.createElement('div');
  rowLbl.className = 'lbl';
  rowLbl.textContent = `Officer / Unit ${idx + 1}`;
  rowLbl.style.marginBottom = '4px';
  wrap.appendChild(rowLbl);

  const agencySel = document.createElement('select');
  agencySel.className = 'sel';
  agencySel.style.marginBottom = '6px';

  const blankOpt = document.createElement('option');
  blankOpt.value = ''; blankOpt.textContent = '— Select Agency —';
  agencySel.appendChild(blankOpt);

  for (const a of LAW_AGENCIES) {
    const o = document.createElement('option');
    o.value = a; o.textContent = a;
    if (a === agency) o.selected = true;
    agencySel.appendChild(o);
  }

  // Custom agency text box
  const customAgency = document.createElement('input');
  customAgency.type = 'text';
  customAgency.className = 'inp';
  customAgency.placeholder = 'Enter agency name…';
  customAgency.style.marginBottom = '6px';
  customAgency.style.display = isOther ? 'block' : 'none';
  customAgency.value = isOther ? (isCustomAgency ? agency : '') : '';

  // Officer / unit detail text box (shown once agency is chosen)
  const detailInp = document.createElement('input');
  detailInp.type = 'text';
  detailInp.className = 'inp';
  detailInp.placeholder = 'Officer name / badge / unit #';
  detailInp.style.display = agency ? 'block' : 'none';
  detailInp.value = detail;

  function save() {
    const ag = agencySel.value === 'Other'
      ? (customAgency.value.trim() || 'Other')
      : agencySel.value;
    F.law[idx] = ag ? ag + '||' + detailInp.value : '';
    saveForm();
    // Only trigger re-render from the dropdown change, not from text fields
  }

  function saveAndRender() {
    save();
    if (renderFn) renderFn();
  }

  agencySel.addEventListener('change', () => {
    customAgency.style.display = agencySel.value === 'Other' ? 'block' : 'none';
    detailInp.style.display = agencySel.value ? 'block' : 'none';
    if (agencySel.value !== 'Other') customAgency.value = '';
    saveAndRender();
  });
  // Use blur not input — so keyboard stays open while typing
  customAgency.addEventListener('blur',  save);
  customAgency.addEventListener('keydown', e => { if(e.key==='Enter') customAgency.blur(); });
  detailInp.addEventListener('blur',  saveAndRender);
  detailInp.addEventListener('keydown', e => { if(e.key==='Enter') detailInp.blur(); });

  wrap.appendChild(agencySel);
  wrap.appendChild(customAgency);
  wrap.appendChild(detailInp);
  return wrap;
}

function tabMVA() {
  const wrap = document.createElement('div');

  // ── MVC Details (collision specifics — NERIS) ────────────
  const mvcBody = document.createElement('div');

  const mvcHelp = document.createElement('div');
  mvcHelp.style.cssText = 'font-size:11px;color:#888;margin-bottom:10px;line-height:1.4';
  mvcHelp.textContent = 'Collision details (NERIS). Individual vehicle make / plate / color are recorded below.';
  mvcBody.appendChild(mvcHelp);

  const mvcVehOpts = [["","— Select —"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6+","6 or more"]];
  mvcBody.appendChild(field('Number of Vehicles Involved', sel(F.mvcVehicles||'', mvcVehOpts, v=>{F.mvcVehicles=v;saveForm();})));

  const mvcYnOpts = [["","— Select —"],["YES","Yes"],["NO","No"]];
  mvcBody.appendChild(field('Extrication Required', sel(F.mvcExtrication||'', mvcYnOpts, v=>{F.mvcExtrication=v;saveForm();renderTab();})));

  // Number entrapped only if extrication required
  if (F.mvcExtrication === 'YES') {
    const mvcEntOpts = [["","— Select —"],["1","1"],["2","2"],["3","3"],["4","4"],["5+","5 or more"]];
    mvcBody.appendChild(field('Number Entrapped', sel(F.mvcEntrapped||'', mvcEntOpts, v=>{F.mvcEntrapped=v;saveForm();})));
  }

  // Hazards present — multi-select chips
  const mvcHazLbl = document.createElement('div');
  mvcHazLbl.className = 'lbl';
  mvcHazLbl.textContent = 'Hazards Present';
  mvcHazLbl.style.cssText = 'margin-bottom:6px;margin-top:4px';
  mvcBody.appendChild(mvcHazLbl);

  if (!Array.isArray(F.mvcHazards)) F.mvcHazards = [];
  const MVC_HAZARDS = ['Fuel/Fluid Spill','Vehicle Fire','Rollover','Downed Wires','Entrapment','Hazmat Load','Vehicle Unstable','Traffic Hazard'];
  const mvcHazGrid = document.createElement('div');
  mvcHazGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  for (const hz of MVC_HAZARDS) {
    const on = F.mvcHazards.includes(hz);
    const chip = document.createElement('button');
    chip.textContent = (on ? '\u2713 ' : '') + hz;
    chip.style.cssText = 'padding:7px 11px;border-radius:16px;font-size:12px;font-family:Georgia,serif;cursor:pointer;border:1.5px solid '
      + (on ? '#8b0000;background:#8b0000;color:#fff' : '#c8a97a;background:#fff8f0;color:#5a3000');
    chip.addEventListener('click', () => {
      if (F.mvcHazards.includes(hz)) F.mvcHazards = F.mvcHazards.filter(x => x !== hz);
      else F.mvcHazards.push(hz);
      saveForm(); renderTab();
    });
    mvcHazGrid.appendChild(chip);
  }
  mvcBody.appendChild(mvcHazGrid);
  wrap.appendChild(card('MVC Details', mvcBody));

  // Ensure cars array has 6 slots
  while (F.cars.length < 6) F.cars.push({model:"",plate:"",color:""});

  // Card container
  const mvaCard = document.createElement('div');
  mvaCard.className = 'card';
  const mvaTitle = document.createElement('div');
  mvaTitle.className = 'card-title';
  mvaTitle.textContent = 'Vehicles Involved';
  const mvaBody = document.createElement('div');
  mvaBody.className = 'card-body';
  mvaCard.appendChild(mvaTitle);
  mvaCard.appendChild(mvaBody);

  function vehicleComplete(i) {
    // A vehicle slot is "started" if any field has a value
    const c = F.cars[i];
    return !!(c.model || c.plate || c.color);
  }

  function renderVehicles() {
    mvaBody.innerHTML = '';

    for (let i = 0; i < 6; i++) {
      // Show slot if: it's the first, OR the previous slot has been started
      const show = i === 0 || vehicleComplete(i - 1);
      if (!show) break;

      // Divider between entries
      if (i > 0) {
        const div = document.createElement('div');
        div.style.cssText = 'border-top:1px solid #f0e8d8;margin:14px 0 14px';
        mvaBody.appendChild(div);
      }

      const rowTitle = document.createElement('div');
      rowTitle.style.cssText = 'font-size:11px;font-weight:700;color:#8b0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px';
      rowTitle.textContent = `Vehicle ${i + 1}`;
      mvaBody.appendChild(rowTitle);

      // Vehicle selector
      const modelLbl = document.createElement('div');
      modelLbl.className = 'lbl';
      modelLbl.textContent = 'Year / Make / Model';
      modelLbl.style.marginBottom = '4px';
      mvaBody.appendChild(modelLbl);

      const vs = vehicleSelector(F.cars[i].model, v => {
        F.cars[i].model = v;
        saveForm();
        renderVehicles();
      });
      mvaBody.appendChild(vs);

      mvaBody.appendChild((() => { const d = document.createElement('div'); d.style.height = '8px'; return d; })());

      // Plate and Color
      const plateCol = flexCol(1,
        lbl('Plate #'),
        stableInp(F.cars[i].plate, v => { F.cars[i].plate = v; saveForm(); renderVehicles(); }, {placeholder:'Plate #'})
      );

      const colorCol = document.createElement('div');
      colorCol.style.flex = '1';
      const colorLbl = document.createElement('div');
      colorLbl.className = 'lbl';
      colorLbl.style.marginBottom = '4px';
      colorLbl.textContent = 'Color';
      colorCol.appendChild(colorLbl);
      colorCol.appendChild(colorSelector(F.cars[i].color, v => {
        F.cars[i].color = v;
        saveForm();
        renderVehicles();
      }));

      mvaBody.appendChild(flexRow(plateCol, colorCol));
    }

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#aaa;margin-top:10px';
    const shown = F.cars.filter((_,i) => i===0 || vehicleComplete(i-1)).length;
    if (shown < 6) hint.textContent = `Vehicle ${shown + 1} will appear after Vehicle ${shown} is filled in.`;
    mvaBody.appendChild(hint);
  }

  renderVehicles();
  wrap.appendChild(mvaCard);
  return wrap;
}

function tabLaw() {
  const wrap = document.createElement('div');
  const lawCard = document.createElement('div');
  lawCard.className = 'card';
  const lawTitle = document.createElement('div');
  lawTitle.className = 'card-title';
  lawTitle.textContent = 'Law Enforcement';
  const lawBody = document.createElement('div');
  lawBody.className = 'card-body';
  lawCard.appendChild(lawTitle);
  lawCard.appendChild(lawBody);

  function renderLaw() {
    lawBody.innerHTML = '';
    const showRows = [
      true,
      !!(F.law[0] && F.law[0].trim()),
      !!(F.law[1] && F.law[1].trim()),
    ];
    for (let i = 0; i < 3; i++) {
      if (showRows[i]) lawBody.appendChild(lawRow(i, renderLaw));
    }
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#aaa;margin-top:4px';
    hint.textContent = 'Additional officer fields appear after each entry.';
    lawBody.appendChild(hint);
  }
  renderLaw();

  wrap.appendChild(lawCard);
  return wrap;
}


function tabRemarks() {
  const wrap = document.createElement('div');

  // ── Incident Narrative ───────────────────────────────────
  const nCard = document.createElement('div');
  nCard.className = 'card';
  const nTitle = document.createElement('div');
  nTitle.className = 'card-title';
  nTitle.textContent = 'Incident Narrative';
  const nBody = document.createElement('div');
  nBody.className = 'card-body';

  const nHelp = document.createElement('div');
  nHelp.style.cssText = 'font-size:11px;color:#888;margin-bottom:10px;line-height:1.4';
  nHelp.textContent = 'Auto-write a narrative from the data entered on the other tabs, then edit as needed. Include cause of incident, extent of damage, insurance carrier, etc.';
  nBody.appendChild(nHelp);

  const nTa = document.createElement('textarea');
  nTa.className = 'ta';
  nTa.rows = 9;
  nTa.placeholder = 'Tap "Generate from Fields" to auto-write a narrative, then edit as needed.';
  nTa.value = F.narrative || '';
  Object.assign(nTa.style, { fontSize:'14px', lineHeight:'1.5', marginBottom:'8px' });
  nTa.addEventListener('input', e => { F.narrative = e.target.value; F._narrManual = true; saveForm(); });
  nBody.appendChild(nTa);

  // Staleness notice: if there's a saved narrative that was auto-generated and
  // the fields have since changed, the text may be out of date.
  if (F.narrative && F._narrGen && F.narrative === F._narrGen) {
    var freshNow = generateNarrative();
    if (freshNow !== F.narrative) {
      const stale = document.createElement('div');
      stale.style.cssText = 'background:#fff3cd;border:1px solid #e0c86a;border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:12.5px;color:#7a5c00;line-height:1.4';
      stale.textContent = '\u26a0 The report data has changed since this narrative was generated. Tap "Generate from Fields" to update it.';
      nBody.insertBefore(stale, nTa);
    }
  }

  const genBtn = document.createElement('button');
  genBtn.textContent = '✨ Generate from Fields';
  genBtn.style.cssText = 'background:#1a4a8a;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:600;font-family:Georgia,serif;margin-right:8px';
  genBtn.addEventListener('click', () => {
    const text = generateNarrative();
    F.narrative = text; F._narrGen = text; F._narrManual = false; saveForm();
    nTa.value = text;
    renderTab();
  });
  nBody.appendChild(genBtn);

  const clrBtn = document.createElement('button');
  clrBtn.textContent = '✕ Clear';
  clrBtn.style.cssText = 'background:none;border:1.5px solid #c8a97a;color:#8b0000;border-radius:8px;padding:10px 14px;font-size:14px;font-weight:600;font-family:Georgia,serif';
  clrBtn.addEventListener('click', () => { F.narrative=''; saveForm(); nTa.value=''; });
  nBody.appendChild(clrBtn);

  nCard.appendChild(nTitle);
  nCard.appendChild(nBody);
  wrap.appendChild(nCard);

  return wrap;
}

// Builds the Personnel Injured card (used on the Personnel tab)
function injuredCard() {
  const injCard = document.createElement('div');
  injCard.className = 'card';
  const injTitle = document.createElement('div');
  injTitle.className = 'card-title';
  injTitle.textContent = 'Personnel Injured';
  const injBody = document.createElement('div');
  injBody.className = 'card-body';

  // Name — pull down from personnel database
  const injNameLbl = document.createElement('div');
  injNameLbl.className = 'lbl';
  injNameLbl.textContent = 'Name';
  injNameLbl.style.marginBottom = '4px';
  injBody.appendChild(injNameLbl);

  const injOpts = [["","— Select (if applicable) —"], ...PERSONNEL.map(p=>[p.badge, p.name])];
  const injSel = sel(F.injName, injOpts, v => { F.injName = v; markOnScene(v); saveForm(); });
  injSel.style.marginBottom = '12px';
  injBody.appendChild(injSel);

  // Badge number (auto-filled from selection, read-only display)
  const injBadgeWrap = document.createElement('div');
  injBadgeWrap.style.marginBottom = '12px';
  const injBadgeLbl = document.createElement('div');
  injBadgeLbl.className = 'lbl';
  injBadgeLbl.textContent = 'Badge Number';
  injBadgeLbl.style.marginBottom = '4px';
  const injBadgeVal = document.createElement('div');
  injBadgeVal.style.cssText = 'padding:9px 10px;background:#f0e8d8;border:1.5px solid #c8a97a;border-radius:6px;font-size:15px;color:#555;min-height:40px';
  const resolvedBadge = F.injName ? (PERSONNEL.find(p=>p.badge===F.injName)||{badge:'—'}).badge : '—';
  injBadgeVal.textContent = resolvedBadge;
  injBadgeWrap.appendChild(injBadgeLbl);
  injBadgeWrap.appendChild(injBadgeVal);
  injBody.appendChild(injBadgeWrap);

  // Update badge display when name changes
  injSel.addEventListener('change', () => {
    const found = PERSONNEL.find(p => p.badge === F.injName);
    injBadgeVal.textContent = found ? found.badge : '—';
  });

  // Report Filed
  const rptLbl = document.createElement('div');
  rptLbl.className = 'lbl';
  rptLbl.textContent = 'Report Filed';
  rptLbl.style.marginBottom = '4px';
  injBody.appendChild(rptLbl);
  const rptSel = sel(F.rptFiled, [["","—"],["YES","YES"],["NO","NO"]], v=>{F.rptFiled=v;saveForm();});
  injBody.appendChild(rptSel);

  injCard.appendChild(injTitle);
  injCard.appendChild(injBody);
  return injCard;
}

// ── Review tab (read-only summary + missing-field warnings) ──
function jumpToTab(idx) {
  tab = idx;
  render();
}

function reviewRow(label, value, opts) {
  opts = opts || {};
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid #f0e8d8';
  const l = document.createElement('div');
  l.textContent = label;
  l.style.cssText = 'font-size:11px;color:#8b0000;font-weight:700;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0;width:38%';
  const v = document.createElement('div');
  const isMissing = !value || !String(value).trim();
  v.textContent = isMissing ? (opts.missingText || '— not set') : value;
  v.style.cssText = 'font-size:14px;text-align:right;flex:1;color:' + (isMissing && opts.warn ? '#b8860b' : '#1a1a1a') + ';font-weight:' + (isMissing && opts.warn ? '700' : '400');
  row.appendChild(l);
  row.appendChild(v);
  if (opts.jumpTab !== undefined) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => jumpToTab(opts.jumpTab));
  }
  return row;
}

function reviewSection(title, jumpTab, ...rows) {
  const card = document.createElement('div');
  card.className = 'card';
  const t = document.createElement('div');
  t.className = 'card-title';
  t.style.cssText = 'display:flex;justify-content:space-between;align-items:center;cursor:pointer';
  const tLabel = document.createElement('span');
  tLabel.textContent = title;
  const tJump = document.createElement('span');
  tJump.textContent = 'Edit →';
  tJump.style.cssText = 'font-size:11px;color:#1a4a8a;font-weight:600';
  t.appendChild(tLabel);
  t.appendChild(tJump);
  t.addEventListener('click', () => jumpToTab(jumpTab));
  const body = document.createElement('div');
  body.className = 'card-body';
  rows.forEach(r => body.appendChild(r));
  card.appendChild(t);
  card.appendChild(body);
  return card;
}

function tabReview() {
  const wrap = document.createElement('div');
  const TAB_IDX = { dispatch:0, command:1, times:2, incident:3, apparatus:4, personnel:5, mvc:6, ems:7, law:8, narrative:9 };

  // ── Warnings banner — only shown if something important is missing ──
  const warnings = [];
  if (!F.runNum) warnings.push({ text: 'No Incident Number set', jump: TAB_IDX.dispatch });
  if (!F.date) warnings.push({ text: 'No Date set', jump: TAB_IDX.dispatch });
  if (!F.ic) warnings.push({ text: 'No Incident Commander selected', jump: TAB_IDX.command });
  if (!F.address) warnings.push({ text: 'No Address set', jump: TAB_IDX.dispatch });
  if (!F.nerisType) warnings.push({ text: 'No NERIS Incident Type selected', jump: TAB_IDX.incident });
  if (!Object.keys(F.apparatus||{}).length) warnings.push({ text: 'No apparatus selected', jump: TAB_IDX.apparatus });
  if (!Object.keys(F.personnel||{}).length) warnings.push({ text: 'No personnel selected', jump: TAB_IDX.personnel });
  if (!F.disp) warnings.push({ text: 'No Dispatched time set', jump: TAB_IDX.times });
  if (!F.inQ) warnings.push({ text: 'No In Quarters time set', jump: TAB_IDX.times });
  if (!F.narrative) warnings.push({ text: 'Narrative not generated yet', jump: TAB_IDX.narrative });
  if (!F.reportBy) warnings.push({ text: 'No Report By selected (required to save)', jump: TABS.length - 1 });

  if (warnings.length) {
    const warnBox = document.createElement('div');
    warnBox.style.cssText = 'background:#fff8e1;border:1.5px solid #e0c86a;border-radius:10px;padding:12px 14px;margin-bottom:14px';
    const warnTitle = document.createElement('div');
    warnTitle.textContent = '⚠ ' + warnings.length + ' item' + (warnings.length===1?'':'s') + ' to check before filing';
    warnTitle.style.cssText = 'font-size:13px;font-weight:700;color:#7a5c00;margin-bottom:6px';
    warnBox.appendChild(warnTitle);
    warnings.forEach(w => {
      const wRow = document.createElement('div');
      wRow.textContent = '• ' + w.text;
      wRow.style.cssText = 'font-size:12.5px;color:#7a5c00;padding:2px 0;cursor:pointer;text-decoration:underline';
      wRow.addEventListener('click', () => jumpToTab(w.jump));
      warnBox.appendChild(wRow);
    });
    wrap.appendChild(warnBox);
  } else {
    const okBox = document.createElement('div');
    okBox.style.cssText = 'background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:700;color:#2d6a2d';
    okBox.textContent = '✓ Looks complete — nothing obviously missing';
    wrap.appendChild(okBox);
  }

  // ── Incident summary ──
  const icP = PERSONNEL.find(p => p.badge === F.ic);
  const icDisplay = icP ? (F.icRank ? F.icRank + ' ' + icP.name : icP.name) + ' #' + icP.badge : '';
  wrap.appendChild(reviewSection('Incident', TAB_IDX.dispatch,
    reviewRow('Incident #', F.runNum, {warn:true}),
    reviewRow('Date', F.date, {warn:true}),
    reviewRow('Address', F.address, {warn:true}),
  ));

  wrap.appendChild(reviewSection('Command', TAB_IDX.command,
    reviewRow('Incident Commander', icDisplay, {warn:true}),
  ));

  wrap.appendChild(reviewSection('Times', TAB_IDX.times,
    reviewRow('Dispatched', F.disp, {warn:true}),
    reviewRow('Cleared', F.clear),
    reviewRow('In Quarters', F.inQ, {warn:true}),
  ));

  const nerisTypeEff = effVal(F.nerisType, F.nerisTypeOther);
  wrap.appendChild(reviewSection('Incident Type', TAB_IDX.incident,
    reviewRow('NERIS Type', nerisTypeEff ? (nerisCatLabel(F.nerisCat) + ': ' + nerisTypeEff) : '', {warn:true}),
    reviewRow('Disposition', F.disposition),
    reviewRow('Actions Taken', (F.actionsTaken||[]).length ? F.actionsTaken.length + ' selected' : ''),
  ));

  const appList = Object.keys(F.apparatus||{});
  wrap.appendChild(reviewSection('Apparatus', TAB_IDX.apparatus,
    reviewRow('Units Responded', appList.length ? appList.join(', ') : '', {warn:true}),
  ));

  const selPersCount = Object.keys(F.personnel||{}).length;
  wrap.appendChild(reviewSection('Personnel', TAB_IDX.personnel,
    reviewRow('Total Personnel', selPersCount ? String(selPersCount) : '', {warn:true}),
    reviewRow('Personnel Injured', F.injName ? (PERSONNEL.find(p=>p.badge===F.injName)||{name:F.injName}).name : 'None'),
  ));

  const carsUsed = (F.cars||[]).filter(c => c.model || c.plate || c.color);
  if (carsUsed.length || F.mvcVehicles || F.mvcExtrication) {
    wrap.appendChild(reviewSection('MVC', TAB_IDX.mvc,
      reviewRow('Vehicles Involved', F.mvcVehicles || (carsUsed.length ? String(carsUsed.length) : '')),
      reviewRow('Extrication Required', F.mvcExtrication),
    ));
  }

  const ambUsed = (F.amb||[]).filter(a => a.svc);
  if (ambUsed.length || F.numPatients) {
    wrap.appendChild(reviewSection('EMS', TAB_IDX.ems,
      reviewRow('Number of Patients', F.numPatients),
      reviewRow('Ambulances', ambUsed.length ? ambUsed.map(ambName).join(', ') : ''),
    ));
  }

  const lawUsed = (F.law||[]).filter(l => l && l.trim());
  if (lawUsed.length) {
    wrap.appendChild(reviewSection('Law Enforcement', TAB_IDX.law,
      reviewRow('Agencies on Scene', lawUsed.map(l => l.split('||')[0]).join(', ')),
    ));
  }

  const mutArr = (Array.isArray(F.mutual)?F.mutual:[F.mutual]).filter(Boolean);
  if (mutArr.length) {
    wrap.appendChild(reviewSection('Mutual Aid', TAB_IDX.dispatch,
      reviewRow('Direction', F.mutualDir),
      reviewRow('Agencies', mutArr.join(', ')),
    ));
  }

  // ── Narrative preview ──
  const narrCard = document.createElement('div');
  narrCard.className = 'card';
  const narrTitle = document.createElement('div');
  narrTitle.className = 'card-title';
  narrTitle.style.cssText = 'display:flex;justify-content:space-between;align-items:center;cursor:pointer';
  const narrLabel = document.createElement('span');
  narrLabel.textContent = 'Narrative';
  const narrJump = document.createElement('span');
  narrJump.textContent = 'Edit →';
  narrJump.style.cssText = 'font-size:11px;color:#1a4a8a;font-weight:600';
  narrTitle.appendChild(narrLabel);
  narrTitle.appendChild(narrJump);
  narrTitle.addEventListener('click', () => jumpToTab(TAB_IDX.narrative));
  const narrBody = document.createElement('div');
  narrBody.className = 'card-body';
  narrBody.style.cssText = 'font-size:13.5px;line-height:1.6;color:#333';
  narrBody.textContent = F.narrative || '(No narrative generated yet — tap to go write one.)';
  narrCard.appendChild(narrTitle);
  narrCard.appendChild(narrBody);
  wrap.appendChild(narrCard);

  return wrap;
}

function tabPreview() {
  const wrap = document.createElement('div');

  // ── Report By card (roster dropdown) ─────────────────────
  const rbCard = document.createElement('div');
  rbCard.className = 'card';
  const rbTitle = document.createElement('div');
  rbTitle.className = 'card-title';
  rbTitle.textContent = 'Report By';
  const rbBody = document.createElement('div');
  rbBody.className = 'card-body';
  const rbOpts = [["","— Select from Roster —"], ...PERSONNEL.map(p=>[p.badge, p.name + ' (Badge ' + p.badge + ')'])];
  const rbSel = sel(F.reportBy||'', rbOpts, v => { F.reportBy = v; markOnScene(v); saveForm(); });
  rbBody.appendChild(rbSel);
  rbCard.appendChild(rbTitle);
  rbCard.appendChild(rbBody);
  wrap.appendChild(rbCard);

  // ── Save button (requires Report By) ─────────────────────
  const saveStatus = document.createElement('div');
  saveStatus.style.cssText = 'font-size:12.5px;margin:0 0 10px;line-height:1.4;min-height:0';

  const btnSave = document.createElement('button');
  btnSave.className = 'btn-print';
  btnSave.textContent = '💾 Save Report';
  btnSave.style.background = '#1a4a8a';
  btnSave.addEventListener('click', () => {
    if (!F.reportBy) {
      saveStatus.style.color = '#8b0000';
      saveStatus.textContent = '⚠ Select who is filing this report (Report By) before saving.';
      rbSel.focus();
      rbSel.style.borderColor = '#8b0000';
      return;
    }
    rbSel.style.borderColor = '';
    archiveCurrent();
    saveStatus.style.color = '#2d6a2d';
    saveStatus.textContent = '✓ Report saved.';
  });
  wrap.appendChild(btnSave);
  wrap.appendChild(saveStatus);

  const btn = document.createElement('button');
  btn.className = 'btn-print';
  btn.textContent = '📄 Generate & Download PDF';
  btn.addEventListener('click', generatePDF);
  wrap.appendChild(btn);

  const btnShare = document.createElement('button');
  btnShare.className = 'btn-print';
  btnShare.textContent = '✉️ Generate PDF & Send via Email';
  btnShare.style.background = '#1a4a8a';
  btnShare.style.marginTop = '0';
  btnShare.addEventListener('click', generateAndShare);
  wrap.appendChild(btnShare);

  const btn2 = document.createElement('button');
  btn2.className = 'btn-print';
  btn2.textContent = '🖨 Blank Form (Print & Fill by Hand)';
  btn2.style.background = '#555';
  btn2.style.marginTop = '0';
  btn2.addEventListener('click', generateBlankPDF);
  wrap.appendChild(btn2);

  // ── Manage Personnel button ──────────────────────────────
  const btnRoster = document.createElement('button');
  btnRoster.className = 'btn-print';
  btnRoster.textContent = '👥 Manage Personnel';
  btnRoster.style.background = '#2d6a2d';
  btnRoster.style.marginTop = '14px';
  btnRoster.addEventListener('click', () => {
    window.open('manage-personnel.html', '_blank');
  });
  wrap.appendChild(btnRoster);

  // ── Report History card (shared across all members via the cloud) ──
  const histCard = document.createElement('div');
  histCard.className = 'card';
  const histTitle = document.createElement('div');
  histTitle.className = 'card-title';
  histTitle.textContent = 'Recent Reports (last 5)';
  const histBody = document.createElement('div');
  histBody.className = 'card-body';

  const histLoading = document.createElement('div');
  histLoading.style.cssText = 'font-size:13px;color:#888;padding:4px 0';
  histLoading.textContent = 'Loading shared report history…';
  histBody.appendChild(histLoading);

  histCard.appendChild(histTitle);
  histCard.appendChild(histBody);
  wrap.appendChild(histCard);

  function renderHistList(list, fromCloud) {
    histBody.innerHTML = '';
    if (!list.length) {
      const none = document.createElement('div');
      none.style.cssText = 'font-size:13px;color:#888;padding:4px 0';
      none.textContent = 'No saved reports yet. Reports are saved here automatically when you generate a PDF or start a new report.';
      histBody.appendChild(none);
      return;
    }
    list.forEach(r => {
      const isCurrent = r._id === F._id || r.id === F._id;
      const rid = r._id || r.id;
      const runNum = r.runNum || r.run_num || '';
      const date = r.date || '';
      const icName = r._icName || r.ic_name || (PERSONNEL.find(p=>p.badge===r.ic)||{name:''}).name;
      const savedTs = r._saved || r.saved_at;

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0e8d8';

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0';
      const line1 = document.createElement('div');
      line1.style.cssText = 'font-size:14px;font-weight:700;color:#1a1a1a';
      line1.textContent = (runNum || '(no incident #)') + (isCurrent ? '  • current' : '');
      const line2 = document.createElement('div');
      line2.style.cssText = 'font-size:11px;color:#888';
      const savedDate = savedTs ? new Date(savedTs).toLocaleString() : '';
      line2.textContent = [date||'no date', icName?('IC '+icName):'', savedDate].filter(Boolean).join('  ·  ');
      info.appendChild(line1);
      info.appendChild(line2);
      row.appendChild(info);

      const openBtn = document.createElement('button');
      openBtn.textContent = 'Open';
      openBtn.style.cssText = 'background:#8b0000;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;font-family:Georgia,serif;flex-shrink:0';
      openBtn.addEventListener('click', () => {
        if (fromCloud && !getHistory().find(x => x._id === rid)) loadFromCloudReport(rid);
        else loadFromHistory(rid);
      });
      row.appendChild(openBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.style.cssText = 'background:none;border:1px solid #c8a97a;color:#8b0000;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;font-family:Georgia,serif;flex-shrink:0';
      delBtn.addEventListener('click', () => deleteFromHistory(rid));
      row.appendChild(delBtn);

      histBody.appendChild(row);
    });
  }

  // Try the shared cloud list first; fall back to this device's local
  // history if the Worker can't be reached (offline, etc.). Only the 5
  // most recent are shown here — use "View Full History" for everything.
  fetch(REPORTS_API_URL)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(list => {
      if (!Array.isArray(list)) throw new Error('bad response');
      renderHistList(list.slice(0, 5), true);
    })
    .catch(() => {
      histLoading.textContent = 'Could not reach the shared history — showing reports saved on this device only.';
      renderHistList(getHistory().slice(0, 5), false);
    });

  const btnFullHist = document.createElement('button');
  btnFullHist.className = 'btn-print';
  btnFullHist.textContent = '🔍 View Full History';
  btnFullHist.style.background = '#555';
  btnFullHist.style.marginTop = '10px';
  btnFullHist.addEventListener('click', () => {
    window.open('report-history.html', '_blank');
  });
  wrap.appendChild(btnFullHist);

  return wrap;
}

