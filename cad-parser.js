// ══════════════════════════════════════════════════════════
// CAD-PARSER.JS — Dispatch email auto-fill
// Recognizes the Cayuga County CAD email format(s) and extracts
// incident #, address, times, NERIS category, responding units,
// ambulances, and mutual aid — used by the "Auto-Fill from Text"
// button and the new-report paste modal.
// Depends on: data.js (NERIS_CATEGORIES), state-and-ui.js (saveForm)
// ══════════════════════════════════════════════════════════

// ── Dispatch email parser ────────────────────────────────
// Tuned for the Cayuga County CAD email format (labeled header fields +
// "Unit RunTimes" table). Falls back to looser patterns for other formats.
// Returns {field: value} for whatever it recognizes — nothing is guessed.

// Aurelius CAD unit codes → apparatus names in this app.
// Aurelius units are prefixed AUR in the CAD feed.
const CAD_UNIT_MAP = {
  "AURCHF": "Chief's Vehicle",
  "AUREN1": "Engine 1",
  "AURRIT": "Engine 1",   // Rapid Intervention Team rides with Engine 1, not separate apparatus
  "AUREN2": "Engine 2",
  "AURRE1": "Rescue 1",
  "AURRS1": "Rescue 1",   // matches the confirmed "RS" naming pattern (see AURRS2)
  "AURRE2": "Rescue 2",
  "AURRP1": "Rescue 2",
  "AURRS2": "Rescue 2",   // confirmed from real CAD data (26AU-0256)
  "AURQU1": "Quint 1",
  "AURQT1": "Quint 1",   // confirmed from real CAD data (26AU-0255)
  "AURSQ1": "Squad 1",
  "AURSQ2": "Squad 2",
  "AURSQ3": "Squad 3",
  "AURTA1": "Tanker 1",
  "AURTK1": "Tanker 1",
};

// CAD unit-code prefixes → ambulance services (matches the EMS tab's
// AMB_SERVICES dropdown). A unit code with an "A" immediately after the
// department prefix denotes an ambulance (e.g. "ACA3" = Auburn City
// Ambulance 3, "THRA1B" = Throop Ambulance). Checked BEFORE the fire
// mutual-aid department map, since an ambulance unit should populate the
// EMS tab — never the Mutual Aid card or be treated as a fire apparatus.
const CAD_AMB_MAP = {
  "ACA": "AUBURN CITY",   // e.g. ACA3
  "THRA": "THROOP",       // e.g. THRA1B
  "FLMA": "FLEMING",      // e.g. FLMA1B
  "CAYA": "CAYUGA",
  "SCYA": "SOUTH CAYUGA", // confirmed from real CAD data (26AU-0247), e.g. SCYA1A
};

// CAD unit-code prefixes → mutual-aid departments (only those in the
// mutual-aid dropdown). Used to detect Given/Received aid. County, EMS,
// and law units (4TNA1A, 547, CCAR1, CFI31, CCREH, EM…) are intentionally
// omitted.
const CAD_DEPT_MAP = {
  "FLM": "Fleming Fire",
  "OWA": "Owasco Fire",
  "SEN": "Seneca Falls Fire",
  "THR": "Throop Fire",
  "AUB": "Auburn Fire",
  "CAY": "Cayuga Fire",
  "UNS": "Union Springs Fire",
  "USP": "Union Springs Fire",  // confirmed alternate CAD prefix for Union Springs
  "PBY": "Port Byron Fire",
  "WDS": "Weedsport Fire",
  "MON": "Montezuma Fire",
  "ARO": "Aurora Fire",
  "SPO": "Scipio Fire",         // confirmed from real CAD data (26AU-0239)
  "PPR": "Poplar Ridge Fire",   // confirmed from real CAD data (26AU-0239)
  // "LGH" seen in real CAD data but the department name is unknown —
  // intentionally left unmapped rather than guessed. Add it here if
  // confirmed later.
};

// If Scipio/Poplar Ridge/etc. aren't already in the app's Mutual Aid
// dropdown list, they'll still be recorded correctly here — but the
// MUTUAL_AGENCIES list on the Dispatch tab should be updated to include
// them so members can select them manually too.

function parseDispatchText(text) {
  const out = {};
  if (!text || !text.trim()) return out;
  const t = text.replace(/\r/g, '');

  function fld(name) {
    var re = new RegExp('^\\s*' + name + '\\s*:\\s*(.+)$', 'im');
    var m = t.match(re);
    return m ? m[1].trim() : '';
  }

  // ── Incident # — prefer the Aurelius one (26AU-####) from the list ──
  // Handles both "Incident #: 26AU-0263,..." (colon) and
  // "INCIDENT # N26-09476,26AC-4802,26AU-0265,..." (no colon) formats.
  var incLine = fld('Incident #');
  if (!incLine) {
    var mIncNoColon = t.match(/^\s*Incident\s*#\s+([A-Za-z0-9][A-Za-z0-9,\-]*)\s*$/im);
    if (mIncNoColon) incLine = mIncNoColon[1].trim();
  }
  if (incLine) {
    var au = incLine.match(/\b(\d{2}AU-\d+)\b/i);
    out.runNum = au ? au[1] : incLine.split(',')[0].trim();
  }
  if (!out.runNum) {
    var mNum = t.match(/(?:incident|call|run|event|cfs|inc)\s*(?:number|no\.?|#)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,20})/i);
    if (mNum) out.runNum = mNum[1].trim();
  }

  // ── Address (+ township/city) ──
  var addr = fld('Address');
  // Strip trailing same-line fields like "Zone: TRP1" (2+ spaces then a label)
  if (addr) addr = addr.split(/\s{2,}\S+:\s|\s{2,}Zone\b/i)[0].trim();
  var twp  = fld('Township') || fld('City');
  if (addr) out.address = twp ? (addr + ', ' + twp) : addr;
  if (!out.address) {
    var mAddr = t.match(/(?:location|addr|incident\s+location)\s*[:#]\s*(.+)/i);
    if (mAddr) out.address = mAddr[1].split(/\s{2,}|\|/)[0].trim().replace(/[,;]\s*$/, '');
  }

  // ── Date + dispatch time from "Date/Time Reported: 18:39:42 07/13/26"
  // or "REPORTED: 18:31:25 07/20/26" ──
  var rep = fld('Date\\/Time Reported') || fld('REPORTED');
  if (rep) {
    var mR = rep.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (mR) {
      out.disp = String(mR[1]).padStart(2,'0') + ':' + mR[2];
      var yy = mR[5].length === 2 ? '20' + mR[5] : mR[5];
      out.date = yy + '-' + String(mR[3]).padStart(2,'0') + '-' + String(mR[4]).padStart(2,'0');
    }
  }
  if (!out.date) {
    var mISO = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    var mUS  = t.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2}|\d{2})\b/);
    if (mISO) out.date = mISO[1]+'-'+mISO[2]+'-'+mISO[3];
    else if (mUS) {
      var y2 = mUS[3].length === 2 ? '20'+mUS[3] : mUS[3];
      out.date = y2+'-'+String(mUS[1]).padStart(2,'0')+'-'+String(mUS[2]).padStart(2,'0');
    }
  }
  if (!out.disp) {
    var mT = t.match(/(?:dispatch(?:ed)?|alarm|toned|received|reported)\s*(?:time)?\s*[:#]?\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (mT) {
      var h = parseInt(mT[1],10), mn = parseInt(mT[2],10), ap = (mT[3]||'').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      if (h <= 23 && mn <= 59) out.disp = String(h).padStart(2,'0')+':'+String(mn).padStart(2,'0');
    }
  }

  // ── Dispatch narrative text: Nature + description + comments ──
  var nature = fld('Nature');
  // Strip trailing same-line fields like "Type: f" (2+ spaces then a label)
  if (nature) nature = nature.split(/\s{2,}\S+:\s/)[0].trim();
  var natDesc = fld('Nature Description');
  // Some formats use "Type:" instead of "Nature:" (ignore the CAD's terse "Type: f")
  if (!nature) { var ty = fld('Type'); if (ty && ty.length > 2) nature = ty; }
  var bits = [];
  if (nature) bits.push(nature);
  if (natDesc) bits.push(natDesc);
  var mCom = t.match(/\n[ \t]*Comments:[ \t]*([\s\S]*?)(?:\n[ \t]*={5,}|\n[ \t]*Unit RunTimes:|\n[ \t]*Contact:|$)/);
  if (mCom) {
    var comTxt = mCom[1]
      // drop "13/07/26 18:39:57 Seamans C:" operator/timestamp lines
      .replace(/\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+[^\n]*?:\s*/g, '')
      .split('\n').map(function(l){return l.trim();}).filter(Boolean).join(' / ');
    if (comTxt) bits.push(comTxt);
  }
  if (bits.length) out._dispText = bits.join(' — ');

  // ── NERIS category from Nature (falls back to whole-text keywords) ──
  var natLow = (nature + ' ' + natDesc).toLowerCase();
  // If there was no Nature field, scan the whole text instead
  var scan = natLow.trim() ? natLow : t.toLowerCase();
  if (/fire-?\s*structure|structure fire|building fire|house fire|working fire/.test(scan)) out._cat = 'FIRE';
  else if (/fire-?\s*vehicle|vehicle fire|car fire|truck fire/.test(scan)) out._cat = 'FIRE';
  else if (/fire-?\s*(brush|grass|wildland|outside|rubbish)|brush fire|grass fire/.test(scan)) out._cat = 'FIRE';
  else if (/fire-?\s*chimney|chimney fire/.test(scan)) out._cat = 'FIRE';
  else if (/entrap|extricat|pin-?in|pinned/.test(scan)) out._cat = 'RESCUE';
  else if (/\bmva\w*|\bmvc\b|motor vehicle|car accident/.test(scan)) out._cat = 'MEDICAL';
  else if (/cardiac|chest pain|stroke|breathing|unresponsive|unconscious|seizure|overdose|\bems\b|medical|sick person|\bfall\b|injur|hemorrhage|laceration|bleeding|allerg|sting/.test(scan)) out._cat = 'MEDICAL';
  else if (/gas leak|odor of gas|fuel spill|hazmat|carbon monoxide|wires down|power line|electrical hazard/.test(scan)) out._cat = 'HAZSIT';
  else if (/cit\.?\s*assist|citizen assist|lift assist|service call|lockout|locked out/.test(scan)) out._cat = 'PUBSERV';
  else if (/alarm/.test(scan)) out._cat = 'PUBSERV';
  else if (/cancel|false alarm|good intent/.test(scan)) out._cat = 'NOEMERG';

  // ── Units: prefer the "Unit RunTimes" table (has timestamps); fall back
  // to a flat "Responding Units:" list (just unit codes, no times) ──
  var units = {};
  var otherDepts = {};   // mutual-aid departments seen (real apparatus only)
  var deptUnitSeen = {}; // tracks whether each dept sent only a chief unit
  var ambSeen = {};      // ambulance services seen (by AMB_SERVICES name)
  var aureliusResponded = false;

  // Classifies one unit code: Aurelius apparatus / ambulance / mutual-aid
  // fire department. `hhmm`/`status` are null when there's no timestamp
  // (the flat Responding Units list case).
  function classifyUnit(code, status, hhmm) {
    code = code.toUpperCase();
    var app = CAD_UNIT_MAP[code];
    if (app) {
      aureliusResponded = true;
      if (!units[app]) units[app] = {};
      if (hhmm) {
        if (status === 'ENRT' && !units[app].enroute) units[app].enroute = hhmm;
        if (status === 'ARRVD' && !units[app].arrived) units[app].arrived = hhmm;
        if (status === 'COMP' && !units[app].complete) units[app].complete = hhmm;
      }
      if (status === 'DISP' || !status) units[app].dispatched = true;
      return;
    }
    // Ambulance unit (e.g. ACA3, THRA1B) — goes to the EMS tab, never
    // treated as fire apparatus or fire mutual aid.
    var ambSvc = null;
    for (var apfx in CAD_AMB_MAP) {
      if (code.indexOf(apfx) === 0) { ambSvc = CAD_AMB_MAP[apfx]; break; }
    }
    if (ambSvc) { ambSeen[ambSvc] = true; return; }

    // Not an Aurelius unit — is it a mutual-aid fire department we know?
    if (code.indexOf('AUR') === 0) return; // our own, unmapped variant
    for (var pfx in CAD_DEPT_MAP) {
      if (code.indexOf(pfx) === 0) {
        var deptName = CAD_DEPT_MAP[pfx];
        // A chief-only unit (code ends "CHF") doesn't count as sending
        // real fire apparatus — track it separately so a department that
        // ONLY sends its chief (with or without an ambulance) isn't
        // flagged as fire mutual aid.
        var isChiefUnit = /CHF$/.test(code);
        if (!deptUnitSeen[deptName]) deptUnitSeen[deptName] = { chiefOnly: true };
        if (!isChiefUnit) deptUnitSeen[deptName].chiefOnly = false;
        break;
      }
    }
  }

  var reUnit = /^\s*([A-Z0-9]{3,8})\s+(DISP|ENRT|ARRVD|COMP|OK)\s+(\d{2}):(\d{2}):\d{2}\s/gm;
  var m2, sawRunTimesTable = false;
  while ((m2 = reUnit.exec(t)) !== null) {
    sawRunTimesTable = true;
    classifyUnit(m2[1], m2[2], m2[3] + ':' + m2[4]);
  }

  if (!sawRunTimesTable) {
    // No per-unit timestamp table — try a flat "Responding Units:" list,
    // e.g. "Responding Units: 2E50,2E13,AUREN1,ACA2,THREN1,THRCHF,THRA1B"
    var mResp = t.match(/^[ \t]*Responding Units:[ \t]*(.+)$/im);
    if (mResp) {
      mResp[1].split(',').forEach(function(code){
        code = code.trim();
        if (code) classifyUnit(code, null, null);
      });
    }
  }

  for (var dn in deptUnitSeen) {
    if (!deptUnitSeen[dn].chiefOnly) otherDepts[dn] = true;
  }
  if (Object.keys(ambSeen).length) out._ambulances = Object.keys(ambSeen);

  // Cleared time = the LAST (latest) unit-complete time across all our
  // units on this call — the call isn't clear until the final unit is done.
  (function(){
    var latestMin = null, latestStr = null;
    for (var appName in units) {
      var comp = units[appName].complete;
      if (!comp) continue;
      var p = comp.split(':');
      var mins = parseInt(p[0],10)*60 + parseInt(p[1],10);
      if (latestMin === null || mins > latestMin) { latestMin = mins; latestStr = comp; }
    }
    if (latestStr) out.clear = latestStr;
  })();
  if (Object.keys(units).length) out._units = units;

  // ── Mutual aid direction (Given / Received) ──
  // Township tells us whose district the call was in.
  var deptList = Object.keys(otherDepts);
  if (aureliusResponded) {
    var townorm = (twp || '').toLowerCase();
    var inOurDistrict = !townorm || townorm.indexOf('aurelius') >= 0 || townorm.indexOf('cayuga') >= 0;
    if (!inOurDistrict) {
      // Call was in another township and our units went → we GAVE aid.
      // Only the primary agency (the department whose district it is) is
      // recorded — not every other department that also responded.
      out._mutualDir = 'Given';
      var primary = null;
      // Match the township to a department in our list (e.g. "Fleming" → "Fleming Fire")
      for (var d = 0; d < deptList.length; d++) {
        if (deptList[d].toLowerCase().indexOf(townorm.trim()) === 0) { primary = deptList[d]; break; }
      }
      // Fall back: match township against any known department name
      if (!primary) {
        for (var pfx2 in CAD_DEPT_MAP) {
          var nm = CAD_DEPT_MAP[pfx2];
          if (nm.toLowerCase().indexOf(townorm.trim()) === 0) { primary = nm; break; }
        }
      }
      // If we still can't identify which department's district this is
      // (e.g. the township doesn't map to any known department), don't
      // guess — leave the agency blank for a human to fill in rather than
      // picking an arbitrary responding department.
      if (primary) out._mutualAgencies = [primary];
    } else if (deptList.length) {
      // Call in our own district with other departments present → we RECEIVED
      // aid from all of them.
      out._mutualDir = 'Received';
      out._mutualAgencies = deptList;
    }
  }

  return out;
}

// Applies a parsed dispatch to the current form F, filling only blank fields.
// Returns { filled: [labels], dispText: cleanText|null, anyFound: bool }.
function applyDispatchParse(rawText) {
  const got = parseDispatchText(rawText);
  const filled = [];
  if (got.runNum && !F.runNum) { F.runNum = got.runNum; filled.push('Incident # ' + got.runNum); }
  if (got.date && !F.date)     { F.date = got.date;     filled.push('Date ' + got.date); }
  if (got.disp && !F.disp)     { F.disp = got.disp;     filled.push('Dispatch time ' + got.disp); }
  if (got.clear && !F.clear)   { F.clear = got.clear;   filled.push('Cleared ' + got.clear); }
  if (got.address && !F.address) { F.address = got.address; filled.push('Address ' + got.address); }
  if (got._cat && !F.nerisCat) {
    F.nerisCat = got._cat;
    var cObj = NERIS_CATEGORIES.find(x => x.code === got._cat);
    filled.push('Category ' + (cObj ? cObj.label : got._cat));
  }
  if (got._units) {
    if (!F.apparatus) F.apparatus = {};
    if (!F.apparatusEnroute) F.apparatusEnroute = {};
    if (!F.apparatusArrived) F.apparatusArrived = {};
    var unitNames = [];
    Object.keys(got._units).forEach(function(app){
      var u = got._units[app];
      if (!F.apparatus[app]) { F.apparatus[app] = true; unitNames.push(app); }
      if (u.enroute && !F.apparatusEnroute[app]) F.apparatusEnroute[app] = u.enroute;
      if (u.arrived && !F.apparatusArrived[app]) F.apparatusArrived[app] = u.arrived;
    });
    if (unitNames.length) filled.push('Units ' + unitNames.join(', ') + ' (with times)');
  }
  if (got._ambulances && got._ambulances.length) {
    if (!Array.isArray(F.amb)) F.amb = [];
    while (F.amb.length < 3) F.amb.push({svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""});
    var addedAmb = [];
    got._ambulances.forEach(function(svc){
      // skip if this service is already entered in any slot
      var already = F.amb.some(function(a){ return a.svc === svc; });
      if (already) return;
      var slot = F.amb.findIndex(function(a){ return !a.svc; });
      if (slot === -1) return; // all 3 slots full
      F.amb[slot].svc = svc;
      addedAmb.push(svc);
    });
    if (addedAmb.length) filled.push('Ambulance ' + addedAmb.join(', '));
  }
  if (got._mutualDir && got._mutualAgencies && got._mutualAgencies.length) {
    if (!Array.isArray(F.mutual)) F.mutual = F.mutual ? [F.mutual] : [];
    var addedAgencies = [];
    if (!F.mutualDir) F.mutualDir = got._mutualDir;
    got._mutualAgencies.forEach(function(ag){
      if (F.mutual.indexOf(ag) < 0) { F.mutual.push(ag); addedAgencies.push(ag); }
    });
    if (addedAgencies.length) filled.push('Mutual Aid ' + got._mutualDir + ': ' + addedAgencies.join(', '));
  } else if (got._mutualDir && !F.mutualDir) {
    // We know aid was given/received but couldn't identify which agency
    // (e.g. the call's township doesn't match a known department) — set
    // the direction so a human just has to pick the agency, not
    // discover the whole thing from scratch.
    F.mutualDir = got._mutualDir;
    filled.push('Mutual Aid ' + got._mutualDir + ' — select the agency on the Dispatch tab');
  }
  var dispText = null;
  if (filled.length && got._dispText) { F.dispActual = got._dispText; dispText = got._dispText; }
  if (filled.length) { saveForm(); updateHeader(); }
  const anyFound = !!(got.runNum || got.date || got.disp || got.address || got._cat || got._units || got._ambulances);
  return { filled: filled, dispText: dispText, anyFound: anyFound };
}

