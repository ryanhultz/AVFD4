// ══════════════════════════════════════════════════════════
// PDF-AND-APP.JS — PDF generation + app bootstrap
// buildPrintHTML/buildBlankFormHTML (the two PDF layouts),
// generatePDF/generateBlankPDF (trigger download), and the
// render loop (renderTab, renderNav, render) that boots the app
// and redraws the current tab on every state change.
// Depends on: everything above — loaded last.
// ══════════════════════════════════════════════════════════

// ══════════════════════════════
// PDF GENERATION
// ══════════════════════════════
function chkHtml(on) {
  return `<span class="chkbox${on?' on':''}">${on?'X':''}</span>`;
}
// Formats an ambulance/EMS service name for display: title-cases all-caps
// entries ("THROOP" → "Throop") and appends "Ambulance" unless the name
// already implies EMS/air transport (e.g. "LifeNet", "Mercy Flight
// Central"). Used everywhere an ambulance service name is shown — the
// narrative, the PDF, and the Review tab — so they always agree.
function ambName(a) {
  var n = a.svc === 'Other' ? (a.custom || 'Other') : a.svc;
  if (n === n.toUpperCase()) {
    n = n.toLowerCase().replace(/\b[a-z]/g, function(ch){ return ch.toUpperCase(); });
  }
  if (!/\b(ambulance|ems|medic|rescue squad|air ?med|lifenet|helicopter|mercy flight|flight)\b/i.test(n)) {
    n += ' Ambulance';
  }
  return n;
}

function timeDiffStr(t1, t2) {
  if (!t1 || !t2) return '';
  const parse = t => { const p=t.split(':'); return parseInt(p[0]||0)*60+parseInt(p[1]||0); };
  let d = parse(t2) - parse(t1);
  if (d < 0) d += 1440;
  return d > 0 ? `+${d} min` : '';
}

// ── Shared print styles ──────────────────────────────────
const PRINT_STYLES = ``;  // keep var for blank form compat, real styles inline now

function nerisCatLabel(code){
  var f=NERIS_CATEGORIES.find(function(x){return x.code===code;});
  return f?f.label:"";
}

function buildPrintHTML() {
  function parseMin(t){if(!t)return null;var p=t.split(':'),h=parseInt(p[0]||0),m=parseInt(p[1]||0);return isNaN(h)||isNaN(m)?null:h*60+m;}
  function fmtDur(m){if(m===null||m<0)return"—";var h=Math.floor(m/60),mn=m%60;return h>0?h+"h "+mn+"m":mn+" min";}
  function td(t1,t2){return timeDiffStr(t1,t2)||"";}

  var selPers   = PERSONNEL.filter(function(p){return F.personnel[p.badge];});
  var autoEmt   = selPers.filter(function(p){return p.qual&&p.qual.includes("emt");}).length;
  var autoInt   = selPers.filter(function(p){return p.qual&&p.qual.includes("int");}).length;
  var totalPers = parseInt(F.totalCt)||selPers.length;
  var icPerson  = PERSONNEL.find(function(p){return p.badge===F.ic;});
  var icName    = icPerson?icPerson.name+" #"+icPerson.badge:(F.ic||"—");
  if (F.icRank && icName !== "—") icName = F.icRank + " " + icName;
  var sigPerson = PERSONNEL.find(function(p){return p.badge===F.reportBy;});
  var sigName   = sigPerson?sigPerson.name+" #"+sigPerson.badge:"";
  var filledCars= F.cars.filter(function(c){return c.model||c.plate||c.color;});
  var usedAmbs  = F.amb.filter(function(a){return a.svc;});
  var usedLaw   = F.law.filter(function(l){return l&&l.trim();}).map(function(l){var p=l.split("||");return p[0]+(p[1]?" — "+p[1]:"");});
  var usedRef   = (F.refusedPcr||[]).filter(function(p){return p.trim();});
  var mutList   = (Array.isArray(F.mutual)?F.mutual:[F.mutual]).filter(Boolean);
  var activeApp = APPARATUS.filter(function(a){return F.apparatus[a];});
  var tDisp=parseMin(F.disp),tInQ=parseMin(F.inQ),callMins=null;
  if(tDisp!==null&&tInQ!==null){callMins=tInQ-tDisp;if(callMins<0)callMins+=1440;}
  var persHours=callMins!==null&&totalPers>0?((callMins*totalPers)/60).toFixed(1):null;

  function shdr(t){
    return'<tr><td colspan="99" style="background:#333;color:#fff;font-size:6pt;font-weight:bold;'
    +'text-transform:uppercase;letter-spacing:.1em;padding:3px 7px">'+t+'</td></tr>';
  }
  function lcell(w,label,value){
    return'<td style="width:'+w+';padding:3px 7px;border:1px solid #ccc;vertical-align:top">'
    +'<div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#666;margin-bottom:1px">'+label+'</div>'
    +'<div style="font-size:8pt;font-weight:bold;line-height:1.3">'+value+'</div></td>';
  }

  // Apparatus rows
  var appRows="";
  if(activeApp.length){
    activeApp.forEach(function(a){
      var dB=(F.apparatusDriver||{})[a],dP=dB?PERSONNEL.find(function(p){return p.badge===dB;}):null;
      appRows+='<tr>'
        +'<td style="padding:2px 6px;border:1px solid #ddd;font-size:7.5pt;font-weight:bold;width:40%;background:#f9f9f9">'+a+'</td>'
        +'<td style="padding:2px 6px;border:1px solid #ddd;font-size:7.5pt">'+(dP?dP.name+" #"+dP.badge:"")+'</td>'
        +'</tr>';
    });
  } else {
    appRows='<tr><td colspan="2" style="padding:2px 6px;border:1px solid #ddd;font-size:7pt;color:#aaa">None</td></tr>';
  }

  // Personnel rows — 3 columns for the dedicated page
  var persRows="";
  if(selPers.length){
    var t3=Math.ceil(selPers.length/3);
    for(var r=0;r<t3;r++){
      var a=selPers[r],b=selPers[r+t3],c=selPers[r+t3*2];
      function pc(x){return x?'<td style="padding:3px 8px;border:1px solid #ddd;font-size:8.5pt;width:33.33%">'+x.name+' <span style="font-size:7pt;color:#555">#'+x.badge+(x.qual?" · "+x.qual.toUpperCase():"")+'</span></td>':'<td style="border:1px solid #ddd;width:33.33%"></td>';}
      persRows+='<tr>'+pc(a)+pc(b)+pc(c)+'</tr>';
    }
  } else {
    persRows='<tr><td colspan="3" style="padding:3px 8px;border:1px solid #ddd;font-size:8pt;color:#aaa">None selected</td></tr>';
  }

  // ── Build output ─────────────────────────────────────────
  var H='';
  H+='<style>'
  +'#afr-pdf{font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#111;width:7.5in;}'
  +'#afr-pdf table{border-collapse:collapse;width:100%}'
  +'#afr-pdf th{text-align:left}'
  +'.afr-page1{min-height:9.6in}'
  +'.afr-page2{page-break-before:always;break-before:page}'
  +'</style>';

  H+='<div id="afr-pdf">';
  H+='<div class="afr-page1">';

  // ══ PAGE 1 ══════════════════════════════════════════════
  // HEADER BAR
  H+='<table style="background:#222;margin-bottom:5px"><tr>'
    +'<td style="padding:8px 12px;color:#fff">'
    +'<div style="font-size:15pt;font-weight:bold;letter-spacing:.03em;line-height:1">AURELIUS FIRE &amp; RESCUE</div>'
    +'<div style="font-size:7pt;color:#aaa;margin-top:2px">Incident Run Report</div></td>'
    +'<td style="padding:8px 12px;color:#fff;text-align:right;vertical-align:middle">'
    +'<div style="font-size:14pt;font-weight:bold">'+(F.runNum||"—")+'</div>'
    +'<div style="font-size:8pt;color:#aaa">'+(F.date||"—")+'</div></td>'
    +'</tr></table>';

  // INCIDENT INFO
  H+='<table style="margin-bottom:4px;border:1px solid #ccc"><tbody>';
  H+=shdr('Incident Information');
  var nerisTypeEffP = effVal(F.nerisType, F.nerisTypeOther);
  var nerisLbl = nerisTypeEffP ? (nerisCatLabel(F.nerisCat)+": "+nerisTypeEffP) : "—";
  if (F.nerisCode) nerisLbl += '<div style="font-size:5.5pt;color:#777;font-family:monospace;word-break:break-all">'+F.nerisCode+'</div>';
  H+='<tr>'+lcell("28%","Incident Commander",icName)+lcell("28%","Incident Type (NERIS)",nerisLbl)
    +lcell("44%","Address",F.address||"—")+'</tr>';
  H+='<tr>'+lcell("33%","Response Mode",F.responseMode||"—")
    +lcell("29%","Location / Use",effVal(F.locationUse,F.locationUseOther)||"—")+lcell("38%","Conditions on Arrival",effVal(F.arrivalCond,F.arrivalCondOther)||"—")+'</tr>';
  if(F.dispActual) H+='<tr><td colspan="4" style="padding:2px 7px;border:1px solid #ddd;font-size:7pt;color:#444"><b>Dispatch:</b> '+F.dispActual+'</td></tr>';
  H+='</tbody></table>';

  // RESPONSE TIMES
  // First unit on scene = earliest apparatus arrival
  var firstArrMin = null;
  (function(){
    var arr = F.apparatusArrived || {};
    for (var k in arr) {
      if (!F.apparatus[k]) continue;
      var m = parseMin(arr[k]);
      if (m === null) continue;
      if (firstArrMin === null || m < firstArrMin) firstArrMin = m;
    }
  })();
  var firstArrStr = "—";
  if (firstArrMin !== null) firstArrStr = String(Math.floor(firstArrMin/60)).padStart(2,'0')+':'+String(firstArrMin%60).padStart(2,'0');
  var respMins = null;
  if (tDisp !== null && firstArrMin !== null) { respMins = firstArrMin - tDisp; if (respMins < 0) respMins += 1440; }

  H+='<table style="margin-bottom:4px;border:1px solid #ccc"><tbody>';
  H+=shdr('Response Times');
  H+='<tr>';
  [["Dispatched",F.disp,""],["First Unit On Scene",firstArrStr,respMins!==null?"+"+fmtDur(respMins):""],
   ["Cleared",F.clear,""],["In Quarters",F.inQ,td(F.clear,F.inQ)]].forEach(function(t){
    H+='<td style="width:25%;text-align:center;padding:3px 4px;border:1px solid #ddd">'
      +'<div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#666">'+t[0]+'</div>'
      +'<div style="font-size:13pt;font-weight:bold;line-height:1.1">'+(t[1]||"—")+'</div>'
      +'<div style="font-size:6pt;color:#555">'+t[2]+'&nbsp;</div></td>';
  });
  H+='</tr>';
  H+='<tr style="background:#f8f8f8">';
  [["Response Time",respMins!==null?fmtDur(respMins):"—"],["Total Call Time",callMins!==null?fmtDur(callMins):"—"],
   ["Personnel",String(totalPers)],["Personnel Hours",persHours?persHours+" hrs":"—"],
   ["EMTs",String(F.emtCt||autoEmt)],["Interior FF",String(F.intCt||autoInt)]].forEach(function(s){
    H+='<td style="text-align:center;padding:3px 4px;border:1px solid #ddd">'
      +'<div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#666">'+s[0]+'</div>'
      +'<div style="font-size:9.5pt;font-weight:bold;line-height:1.1">'+s[1]+'</div></td>';
  });
  H+='</tr></tbody></table>';

  // APPARATUS (full width now — personnel moved to page 2)
  H+='<table style="margin-bottom:4px;border:1px solid #ccc"><tbody>';
  H+=shdr('Apparatus Responding');
  H+='</tbody></table>';
  H+='<table style="margin-bottom:4px"><tr valign="top">';
  // split apparatus into 2 columns to save vertical space
  var appArr=activeApp.slice();
  var appHalf=Math.ceil(appArr.length/2);
  function appCol(list){
    if(!list.length) return '<table><tr><td style="padding:2px 6px;border:1px solid #ddd;font-size:7pt;color:#aaa">—</td></tr></table>';
    var s='<table>';
    s+='<tr style="background:#f8f8f8"><th style="padding:1px 4px;border:1px solid #ddd;font-size:5.5pt;text-transform:uppercase;width:28%">Unit</th>'
      +'<th style="padding:1px 4px;border:1px solid #ddd;font-size:5.5pt;text-transform:uppercase">Driver</th>'
      +'<th style="padding:1px 4px;border:1px solid #ddd;font-size:5.5pt;text-transform:uppercase;width:16%">Enrt</th>'
      +'<th style="padding:1px 4px;border:1px solid #ddd;font-size:5.5pt;text-transform:uppercase;width:16%">Arr</th></tr>';
    list.forEach(function(a){
      var dB=(F.apparatusDriver||{})[a],dP=dB?PERSONNEL.find(function(p){return p.badge===dB;}):null;
      var en=(F.apparatusEnroute||{})[a]||"—";
      var ar=(F.apparatusArrived||{})[a]||"—";
      s+='<tr><td style="padding:2px 6px;border:1px solid #ddd;font-size:7.5pt;font-weight:bold;background:#f9f9f9">'+a+'</td>'
        +'<td style="padding:2px 6px;border:1px solid #ddd;font-size:7.5pt">'+(dP?dP.name+" #"+dP.badge:"")+'</td>'
        +'<td style="padding:2px 4px;border:1px solid #ddd;font-size:7pt;text-align:center">'+en+'</td>'
        +'<td style="padding:2px 4px;border:1px solid #ddd;font-size:7pt;text-align:center">'+ar+'</td></tr>';
    });
    return s+'</table>';
  }
  if(activeApp.length){
    H+='<td style="width:50%;padding-right:4px">'+appCol(appArr.slice(0,appHalf))+'</td>';
    H+='<td style="padding-left:4px">'+appCol(appArr.slice(appHalf))+'</td>';
  } else {
    H+='<td><table><tr><td style="padding:2px 6px;border:1px solid #ddd;font-size:7pt;color:#aaa">None responding</td></tr></table></td>';
  }
  H+='</tr></table>';

  // VEHICLES
  if(filledCars.length){
    H+='<table style="margin-bottom:4px;border:1px solid #ccc"><tbody>';
    H+=shdr('Vehicles Involved');
    H+='<tr style="background:#f8f8f8">'
      +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:22px">#</th>'
      +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt">Year / Make / Model</th>'
      +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:18%">Plate</th>'
      +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:14%">Color</th></tr>';
    filledCars.forEach(function(c,i){
      H+='<tr><td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt;font-weight:bold;text-align:center">'+(i+1)+'</td>'
        +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt">'+(c.model||"—")+'</td>'
        +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt">'+(c.plate||"—")+'</td>'
        +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt">'+(c.color||"—")+'</td></tr>';
    });
    H+='</tbody></table>';
  }

  // MVC DETAILS (collision-specific, when any are filled in)
  if(F.mvcVehicles||F.mvcExtrication||(F.mvcHazards&&F.mvcHazards.length)){
    var mvcBits=[];
    if(F.mvcVehicles) mvcBits.push('<b>Vehicles:</b> '+F.mvcVehicles);
    if(F.mvcExtrication) mvcBits.push('<b>Extrication:</b> '+F.mvcExtrication+(F.mvcExtrication==='YES'&&F.mvcEntrapped?' ('+F.mvcEntrapped+' entrapped)':''));
    if(F.mvcHazards&&F.mvcHazards.length) mvcBits.push('<b>Hazards:</b> '+F.mvcHazards.join(', '));
    H+='<div style="font-size:7.5pt;padding:2px 7px;margin-bottom:4px;border-left:3px solid #555"><b>MVC:</b> &nbsp;'+mvcBits.join(' &nbsp;|&nbsp; ')+'</div>';
  }
  if(usedLaw.length||usedAmbs.length){
    H+='<table style="margin-bottom:4px"><tr valign="top">';
    if(usedLaw.length){
      H+='<td style="width:50%;padding-right:4px"><table style="border:1px solid #ccc"><tbody>'+shdr('Law Enforcement');
      usedLaw.forEach(function(l,i){
        H+='<tr><td style="padding:2px 6px;border:1px solid #ddd;font-size:7.5pt"><span style="font-weight:bold;color:#444;margin-right:5px">'+(i+1)+'.</span>'+l+'</td></tr>';
      });
      H+='</tbody></table></td>';
    }
    if(usedAmbs.length){
      H+='<td style="'+(usedLaw.length?"padding-left:4px":"")+'"><table style="border:1px solid #ccc"><tbody>'+shdr('EMS / Ambulances'+(F.numPatients?'  —  '+F.numPatients+' patient'+(F.numPatients==='1'?'':'s'):''))
        +'<tr style="background:#f8f8f8"><th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:22px">#</th>'
        +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt">Service</th>'
        +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:22%">PCR #</th>'
        +'<th style="padding:2px 5px;border:1px solid #ddd;font-size:6pt;width:34%">Transported To</th></tr>';
      usedAmbs.forEach(function(a,i){
        var hosp = a.hospital === 'Other' ? (a.hospitalOther||'') : (a.hospital||'');
        if (hosp && hosp !== 'Standby — No Transport') hosp = hosp.split(' — ')[0];
        H+='<tr><td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt;font-weight:bold;text-align:center">'+(i+1)+'</td>'
          +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt">'+(ambName(a)||"—")+'</td>'
          +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7.5pt">'+(a.pcr||"—")+'</td>'
          +'<td style="padding:2px 5px;border:1px solid #ddd;font-size:7pt">'+(hosp||"—")+'</td></tr>';
      });
      H+='</tbody></table>';
      if(usedRef.length) H+='<div style="font-size:7pt;padding:2px 5px;color:#555"><b>Refused PCR:</b> '+usedRef.join(", ")+'</div>';
      H+='</td>';
    }
    H+='</tr></table>';
  }

  // PATIENT COUNT (when set but no ambulance row showed it)
  if(F.numPatients && F.numPatients!=='0' && !usedAmbs.length){
    H+='<div style="font-size:7.5pt;padding:2px 7px;margin-bottom:4px;border-left:3px solid #555">'
      +'<b>Patients:</b> '+F.numPatients+'</div>';
  }

  // REFUSED TRANSPORT PCR (fallback line — only if the EMS/Ambulances
  // table above didn't already show it, i.e. no ambulance was used)
  if(usedRef.length && !usedAmbs.length){
    H+='<div style="font-size:7.5pt;padding:2px 7px;margin-bottom:4px;border-left:3px solid #555">'
      +'<b>Refused Transport PCR:</b> '+usedRef.join(", ")+'</div>';
  }

  // MUTUAL AID
  if(mutList.length){
    H+='<div style="font-size:7.5pt;padding:2px 7px;margin-bottom:4px;border-left:3px solid #555">'
      +'<b>Mutual Aid'+(F.mutualDir?" ("+F.mutualDir+")":"")+":</b> "+mutList.join(" · ")+'</div>';
  }

  // NARRATIVE (if present)
  if(F.narrative){
    H+='<table style="width:100%;border:1px solid #ccc;margin-bottom:4px"><tbody>'
      +shdr('Narrative')
      +'<tr><td style="padding:5px 7px;font-size:7.5pt;line-height:1.45;white-space:pre-wrap;vertical-align:top">'+F.narrative+'</td></tr>'
      +'</tbody></table>';
  }

  // REMARKS — only if present (legacy field; narrative now covers this)
  if(F.remarks){
    H+='<table style="width:100%;border:1px solid #ccc;margin-bottom:4px"><tbody>'
      +shdr('Remarks')
      +'<tr><td style="padding:5px 7px;font-size:7.5pt;line-height:1.4;white-space:pre-wrap;vertical-align:top">'+F.remarks+'</td></tr>'
      +'</tbody></table>';
  }

  // INJURED
  if(F.injName){
    var injP=PERSONNEL.find(function(p){return p.badge===F.injName;});
    H+='<div style="font-size:7.5pt;padding:3px 7px;margin-bottom:4px;border:1px solid #ccc;border-left:3px solid #555">'
      +'<b>Personnel Injured:</b> '+(injP?injP.name:F.injName)+' #'+F.injName
      +' &nbsp;&nbsp; <b>Report Filed:</b> '+(F.rptFiled||"—")+'</div>';
  }

  // SIGNATURE BAR (footer on page 1)
  H+='<table style="background:#222;margin-top:4px"><tr>'
    +'<td style="padding:5px 12px;color:#aaa;font-size:6.5pt">Aurelius Fire &amp; Rescue &nbsp;|&nbsp; Incident #'+(F.runNum||"")+' &nbsp;|&nbsp; IC: '+icName+'</td>'
    +'<td style="padding:5px 12px;color:#fff;font-size:7pt;text-align:right;vertical-align:middle">'
    +'Report by: '+(sigName||"__________________________")
    +'</td></tr></table>';

  // ══ PAGE 2 — PERSONNEL ON SCENE ════════════════════════
  H+='</div>'; // close .afr-page1
  H+='<div class="afr-page2">';
  H+='<table style="background:#222;margin-bottom:5px;width:100%"><tr>'
    +'<td style="padding:8px 12px;color:#fff">'
    +'<div style="font-size:15pt;font-weight:bold;letter-spacing:.03em;line-height:1">AURELIUS FIRE &amp; RESCUE</div>'
    +'<div style="font-size:7pt;color:#aaa;margin-top:2px">Personnel on Scene</div></td>'
    +'<td style="padding:8px 12px;color:#fff;text-align:right;vertical-align:middle">'
    +'<div style="font-size:14pt;font-weight:bold">'+(F.runNum||"—")+'</div>'
    +'<div style="font-size:8pt;color:#aaa">'+(F.date||"—")+'</div></td>'
    +'</tr></table>';
  H+='<table style="margin-bottom:4px;border:1px solid #ccc;width:100%"><tbody>';
  H+=shdr('Personnel on Scene — '+selPers.length+' members  ·  EMTs: '+(F.emtCt||autoEmt)+'  ·  Interior FF: '+(F.intCt||autoInt));
  H+=persRows;
  H+='</tbody></table>';
  H+='</div>'; // .afr-page2

  H+='</div>'; // #afr-pdf
  return H;
}


function buildBlankFormHTML() {
  // 40-slot roster: use real roster for first N entries, blank lines for rest
  var rosterLeft = '', rosterRight = '';
  for(var i=0;i<20;i++){
    var p=PERSONNEL[i];
    var chk='<span style="display:inline-block;width:12px;height:12px;border:1.5px solid #555;border-radius:2px;vertical-align:middle;margin-right:6px"></span>';
    rosterLeft+='<tr><td style="width:22px;text-align:center;padding:3px 4px;border:1px solid #ccc;font-size:7.5pt;font-weight:700">'+(i+1)+'</td><td style="padding:3px 8px;border:1px solid #ccc;font-size:8pt">'+chk+(p?p.name+' <span style="color:#666;font-size:7.5pt">#'+p.badge+(p.qual?' — '+p.qual:'')+'</span>':'')+'</td></tr>';
  }
  for(var i=20;i<40;i++){
    var p=PERSONNEL[i];
    var chk='<span style="display:inline-block;width:12px;height:12px;border:1.5px solid #555;border-radius:2px;vertical-align:middle;margin-right:6px"></span>';
    rosterRight+='<tr><td style="width:22px;text-align:center;padding:3px 4px;border:1px solid #ccc;font-size:7.5pt;font-weight:700">'+(i+1)+'</td><td style="padding:3px 8px;border:1px solid #ccc;font-size:8pt">'+chk+(p?p.name+' <span style="color:#666;font-size:7.5pt">#'+p.badge+(p.qual?' — '+p.qual:'')+'</span>':'')+'</td></tr>';
  }

  var appGrid='<thead><tr>'
    +'<th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:26px">✓</th>'
    +'<th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;text-align:left;width:22%">Unit</th>'
    +'<th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;text-align:left">Driver / Badge</th>'
    +'<th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:16%">Enroute</th>'
    +'<th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:16%">Arrived</th>'
    +'</tr></thead><tbody>';
  for(var i=0;i<APPARATUS.length;i++){
    appGrid+='<tr>'
      +'<td style="border:1px solid #ccc;padding:4px;text-align:center"><span style="display:inline-block;width:11px;height:11px;border:1.5px solid #555;border-radius:2px"></span></td>'
      +'<td style="border:1px solid #ccc;padding:4px 6px;font-size:8pt;font-weight:700">'+APPARATUS[i]+'</td>'
      +'<td style="border:1px solid #ccc;padding:4px 6px">&nbsp;</td>'
      +'<td style="border:1px solid #ccc;padding:4px 6px">&nbsp;</td>'
      +'<td style="border:1px solid #ccc;padding:4px 6px">&nbsp;</td>'
      +'</tr>';
  }
  appGrid+='</tbody>';

  var S='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#000;background:white}@page{size:letter portrait;margin:0.35in 0.4in}table{border-collapse:collapse;width:100%}.pg{page-break-after:always}.pg:last-child{page-break-after:avoid}.sec{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;border-bottom:1.5px solid #000;padding-bottom:2px;margin:10px 0 5px;page-break-after:avoid}.blk{page-break-inside:avoid}.fl{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;display:block;margin-top:5px;margin-bottom:2px}.ln{border-bottom:1px solid #888;display:block;min-height:20px}';

  function hdr(sub){
    return '<table style="border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:10px"><tr><td style="font-size:14pt;font-weight:700">AURELIUS FIRE AND RESCUE</td><td style="text-align:right;font-size:9pt;font-weight:700">Incident #: ___________&nbsp;&nbsp;Date: ____________</td></tr><tr><td style="font-size:7.5pt;color:#444">'+sub+'</td><td></td></tr></table>';
  }

  var html='<!DOCTYPE html><html><head><meta charset="utf-8"><style>'+S+'</style></head><body>';

  // PAGE 1
  html+='<div class="pg">';
  html+=hdr('Incident Run Report — Page 1 of 3');
  html+='<div class="blk"><div class="sec">Incident Information</div>';
  html+='<table style="margin-bottom:8px"><tr>';
  html+='<td style="width:28%;padding-right:10px"><span class="fl">Incident Commander</span><span class="ln"></span></td>';
  html+='<td style="width:17%;padding-right:10px"><span class="fl">Rank</span><span class="ln"></span></td>';
  html+='<td style="width:20%;padding-right:10px"><span class="fl">Location</span><span class="ln"></span></td>';
  html+='<td><span class="fl">Address</span><span class="ln"></span></td></tr></table></div>';

  html+='<div class="blk"><div class="sec">Dispatch</div>';
  html+='<span class="fl">Actual Dispatch Text</span><span class="ln" style="margin-bottom:6px"></span>';
  html+='<table style="margin-bottom:8px"><tr>';
  html+='<td style="width:33%;padding-right:10px"><span class="fl">Dispatch Type</span><span class="ln"></span></td>';
  html+='<td style="width:33%;padding-right:10px"><span class="fl">Mutual Aid — Given or Received</span><span class="ln"></span></td>';
  html+='<td><span class="fl">Mutual Aid Agency</span><span class="ln"></span></td></tr></table></div>';

  html+='<div class="blk"><div class="sec">Response Times</div><table style="margin-bottom:8px"><tr>';
  ['Dispatched','Cleared','In Quarters'].forEach(function(t){
    html+='<td style="width:33%;text-align:center;border:1px solid #ccc;padding:5px 4px"><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase">'+t+'</div><div style="border-bottom:1px solid #888;min-height:22px;margin-top:5px"></div></td>';
  });
  html+='</tr></table>';
  html+='<div style="font-size:6.5pt;color:#555;margin-bottom:6px">Enroute and arrival times are recorded per unit in the Apparatus section below.</div>';
  html+='<table style="margin-bottom:8px"><tr>';
  ['TOTAL CALL TIME','TOTAL PERSONNEL','PERSONNEL HOURS','EMTs','INTERIOR FF'].forEach(function(l){
    html+='<td style="border:1px solid #ccc;padding:4px 8px;width:20%"><span style="font-size:6pt;font-weight:700;display:block">'+l+'</span><span style="font-size:9pt">&nbsp;</span></td>';
  });
  html+='</tr></table></div>';

  html+='<div class="blk"><div class="sec">Apparatus Responding — check unit, write driver name/badge and unit times</div>';
  html+='<table style="margin-bottom:8px">'+appGrid+'</table></div>';

  html+='<div class="blk"><div class="sec">Vehicles Involved</div>';
  html+='<table style="margin-bottom:8px"><thead><tr><th style="padding:3px 6px;border:1px solid #ccc;text-align:left;font-size:6.5pt;background:#eee;width:22px">#</th><th style="padding:3px 6px;border:1px solid #ccc;text-align:left;font-size:6.5pt;background:#eee">Year / Make / Model</th><th style="padding:3px 6px;border:1px solid #ccc;text-align:left;font-size:6.5pt;background:#eee;width:18%">Plate #</th><th style="padding:3px 6px;border:1px solid #ccc;text-align:left;font-size:6.5pt;background:#eee;width:15%">Color</th></tr></thead><tbody>';
  for(var n=1;n<=6;n++) html+='<tr><td style="padding:4px 6px;border:1px solid #ccc;font-weight:700;text-align:center">'+n+'</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td></tr>';
  html+='</tbody></table></div>';

  html+='<div class="blk"><div class="sec">Law Enforcement</div>';
  for(var n=1;n<=3;n++) html+='<table style="margin-bottom:6px"><tr><td style="width:22px;padding:3px 4px;font-weight:700">'+n+'.</td><td style="padding:3px 6px;border-bottom:1px solid #888;width:45%">&nbsp;</td><td style="width:60px;padding:3px 6px;font-size:7.5pt;color:#666">Agency</td><td style="padding:3px 6px;border-bottom:1px solid #888">&nbsp;</td><td style="width:80px;padding:3px 6px;font-size:7.5pt;color:#666">Officer/Badge</td></tr></table>';
  html+='</div>';

  html+='<div class="blk"><div class="sec">EMS / Ambulances</div>';
  html+='<table style="margin-bottom:4px"><thead><tr><th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:22px">#</th><th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee">Service</th><th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:22%">PCR #</th><th style="padding:3px 6px;border:1px solid #ccc;font-size:6.5pt;background:#eee;width:32%">Transported To</th></tr></thead><tbody>';
  for(var n=1;n<=3;n++) html+='<tr><td style="padding:4px 6px;border:1px solid #ccc;font-weight:700;text-align:center">'+n+'</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td><td style="padding:4px 6px;border:1px solid #ccc">&nbsp;</td></tr>';
  html+='</tbody></table>';
  html+='<div style="font-size:8.5pt;margin-bottom:8px"><strong>Refused Transport PCR:</strong> <span style="display:inline-block;border-bottom:1px solid #888;width:220px;margin-left:8px;vertical-align:bottom"></span></div></div>';

  html+='<div style="font-size:7pt;text-align:right;color:#555;border-top:1px solid #ccc;padding-top:4px">Aurelius Fire &amp; Rescue &nbsp;|&nbsp; Page 1 of 3</div>';
  html+='</div>';

  // PAGE 2
  html+='<div class="pg">';
  html+=hdr('Incident Run Report — Page 2 of 3');
  html+='<div class="blk"><div class="sec">Remarks — Cause of Incident, Extent of Damage, Insurance Carrier</div><div style="border:1px solid #ccc;min-height:100px;margin-bottom:10px"></div></div>';
  html+='<div class="blk"><div class="sec">Additional Notes / Mutual Aid</div><div style="border:1px solid #ccc;min-height:70px;margin-bottom:10px"></div></div>';
  html+='<div class="blk"><div class="sec">Personnel Injured</div><table style="margin-bottom:10px"><tr>';
  html+='<td style="width:40%;padding-right:10px"><span class="fl">Name</span><span class="ln"></span></td>';
  html+='<td style="width:20%;padding-right:10px"><span class="fl">Badge #</span><span class="ln"></span></td>';
  html+='<td><span class="fl">Report Filed</span><div style="margin-top:5px;font-size:8.5pt"><span style="display:inline-block;width:11px;height:11px;border:1.5px solid #555;border-radius:2px;vertical-align:middle;margin-right:4px"></span>YES &nbsp;&nbsp; <span style="display:inline-block;width:11px;height:11px;border:1.5px solid #555;border-radius:2px;vertical-align:middle;margin-right:4px"></span>NO</div></td>';
  html+='</tr></table></div>';
  html+='<div class="blk"><div class="sec">Report Signature</div><table style="margin-bottom:10px"><tr>';
  html+='<td style="width:40%;padding-right:10px"><span class="fl">Report By (print name)</span><span class="ln"></span></td>';
  html+='<td style="width:20%;padding-right:10px"><span class="fl">Badge #</span><span class="ln"></span></td>';
  html+='<td><span class="fl">Signature</span><span class="ln" style="min-height:36px"></span></td>';
  html+='</tr></table></div>';
  html+='<div style="font-size:7pt;text-align:right;color:#555;border-top:1px solid #ccc;padding-top:4px">Aurelius Fire &amp; Rescue &nbsp;|&nbsp; Page 2 of 3</div>';
  html+='</div>';

  // PAGE 3 — Roster
  html+='<div class="pg">';
  html+=hdr('Personnel on Scene — Page 3 of 3');
  html+='<div style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:6px">Personnel on Scene — Check all responding members (40 slots)</div>';
  html+='<div style="font-size:8.5pt;margin-bottom:8px">EMTs: _________ &nbsp;&nbsp; Interior FF: _________ &nbsp;&nbsp; Total: _________</div>';
  html+='<table><tr valign="top">';
  html+='<td style="width:50%;padding-right:4px"><table>'+rosterLeft+'</table></td>';
  html+='<td style="padding-left:4px"><table>'+rosterRight+'</table></td>';
  html+='</tr></table>';
  html+='<div style="font-size:7pt;text-align:right;color:#555;border-top:1px solid #ccc;padding-top:4px;margin-top:10px">Aurelius Fire &amp; Rescue &nbsp;|&nbsp; Page 3 of 3</div>';
  html+='</div>';

  html+='</body></html>';
  return html;
}

function generatePDF() {
  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }
  archiveCurrent(); // save a copy to history
  const container = document.getElementById('print-form');
  container.innerHTML = buildPrintHTML();
  container.style.display = 'block';
  const fn = `AureliusRunReport_${(F.runNum||'').replace(/[^a-z0-9]/gi,'_')}_${(F.date||'').replace(/-/g,'')}.pdf`;
  html2pdf().set({
    margin: 0.3,
    filename: fn,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  }).from(container).save().then(() => { container.style.display = 'none'; });
}

function generateBlankPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }
  const container = document.getElementById('print-form');
  container.innerHTML = buildBlankFormHTML();
  container.style.display = 'block';
  html2pdf().set({
    margin: 0,
    filename: 'AureliusRunReport_BLANK.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  }).from(container).save().then(() => { container.style.display = 'none'; });
}

async function generateAndShare() {
  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }
  archiveCurrent(); // save a copy to history

  const fn = `AureliusRunReport_${(F.runNum||'').replace(/[^a-z0-9]/gi,'_')}_${(F.date||'').replace(/-/g,'')}.pdf`;
  const statusEl = document.getElementById('share-status');
  if (statusEl) { statusEl.textContent = '⏳ Generating PDF…'; statusEl.style.display = 'block'; }

  const container = document.getElementById('print-form');
  container.innerHTML = buildPrintHTML();
  container.style.display = 'block';

  await new Promise(r => setTimeout(r, 200));

  try {
    const pdfBlob = await html2pdf().set({
      margin: 0.3,
      filename: fn,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(container).outputPdf('blob');

    container.style.display = 'none';

    const pdfFile = new File([pdfBlob], fn, { type: 'application/pdf' });

    // Try Web Share API (iOS 15+ / Android Chrome) — supports file attachments
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      if (statusEl) statusEl.style.display = 'none';
      await navigator.share({
        title: `Incident ${F.runNum||''} — ${F.date||''}`,
        text: `Aurelius Fire & Rescue Incident Report ${F.runNum||''} dated ${F.date||''}`,
        files: [pdfFile]
      });
    }
    // Fallback: try navigator.share without files (older devices), then open mail
    else if (navigator.share) {
      // Download the file first so user has it, then open share
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url; a.download = fn; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (statusEl) { statusEl.textContent = 'PDF downloaded. Opening email…'; }
      setTimeout(() => {
        window.location.href = `mailto:?subject=${encodeURIComponent('Incident '+F.runNum+' — '+F.date)}&body=${encodeURIComponent('Aurelius Fire & Rescue Incident Report attached.\n\nIncident #: '+F.runNum+'\nDate: '+F.date+'\nIC: '+((PERSONNEL.find(p=>p.badge===F.ic)||{name:F.ic||''}).name))}`;
        if (statusEl) statusEl.style.display = 'none';
      }, 800);
    }
    // Last fallback: just download the PDF
    else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url; a.download = fn; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (statusEl) { statusEl.textContent = '✓ PDF downloaded — attach it manually in your email app.'; }
      setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 4000);
    }
  } catch(e) {
    container.style.display = 'none';
    if (e.name !== 'AbortError') { // AbortError = user cancelled share sheet, not an error
      console.error('Share error:', e);
      if (statusEl) { statusEl.textContent = 'Could not share. Try Download instead.'; }
      setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 3000);
    } else {
      if (statusEl) statusEl.style.display = 'none';
    }
  }
}
// ══════════════════════════════
// RENDER
// ══════════════════════════════
function updateHeader() {
  document.getElementById('header-sub').textContent = (viewMode === 'home')
    ? 'Report Queue'
    : `#${F.runNum||'—'} · ${F.date||'No date set'}`;
}

function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = '';
  TABS.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i===tab?' active':'');
    btn.textContent = t;
    btn.addEventListener('click', () => { tab=i; markInProgress(); render(); });
    bar.appendChild(btn);
  });
}

function renderTab() {
  const tc = document.getElementById('tab-content');
  tc.innerHTML = '';
  const builders = [tabIncident,tabCommand,tabTimes,tabDispatch,tabApparatus,tabPersonnel,tabMVA,tabEMS,tabLaw,tabRemarks,tabReview,tabPreview];
  try {
    tc.appendChild(builders[tab]());
  } catch(e) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'background:#fff0f0;border:2px solid #c00;border-radius:8px;padding:16px;margin:14px;font-family:monospace;font-size:13px;color:#c00;white-space:pre-wrap';
    errDiv.textContent = 'TAB ERROR [' + TABS[tab] + ']:\n' + e.message + '\n\n' + (e.stack||'').split('\n').slice(0,6).join('\n');
    tc.appendChild(errDiv);
    console.error('renderTab error on tab', TABS[tab], e);
  }
}

function renderNav() {
  const nav = document.getElementById('nav-row');
  nav.innerHTML = '';
  if (tab > 0) {
    const back = document.createElement('button');
    back.className = 'btn-back';
    back.textContent = '← Back';
    back.addEventListener('click', () => { tab--; markInProgress(); render(); });
    nav.appendChild(back);
  }
  if (tab < TABS.length-1) {
    const next = document.createElement('button');
    next.className = 'btn-next';
    next.textContent = 'Next →';
    next.addEventListener('click', () => { tab++; markInProgress(); render(); });
    nav.appendChild(next);
  }
}

function render() {
  const clearBtn = document.getElementById('clearform-btn');
  if (viewMode === 'home') {
    if (clearBtn) clearBtn.style.display = 'none';
    renderHomeScreen();
    return;
  }
  if (clearBtn) clearBtn.style.display = '';
  updateHeader();
  renderTabBar();
  renderTab();
  renderNav();
}

// ── Home screen: Unstarted / In Progress / Complete queue ──
// viewMode is a simple global switch between the splash/queue screen and
// the normal tab-based report editor. Starts on 'home' so the app opens
// to the queue instead of dropping straight into a report.
var viewMode = 'home';

function showHomeScreen() {
  viewMode = 'home';
  render();
}

function openReportFromQueue(id, status) {
  viewMode = 'editor'; // set BEFORE the load so loadFromCloudReport's own render() shows the editor, not home
  loadFromCloudReport(id).then(() => {
    // Check the report's own loaded status rather than trusting the
    // status passed in from the queue list — more robust if the list
    // was stale or the report changed between listing and opening.
    markInProgress();
  });
}

function renderHomeScreen() {
  document.getElementById('tab-bar').innerHTML = '';
  document.getElementById('nav-row').innerHTML = '';
  updateHeader();
  const tc = document.getElementById('tab-content');
  tc.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:4px 0 24px';

  const intro = document.createElement('div');
  intro.style.cssText = 'font-size:13px;color:#888;margin-bottom:16px;line-height:1.4';
  intro.textContent = 'Reports waiting to be started, in progress, and recently completed — shared across all devices.';
  wrap.appendChild(intro);

  const startBtn = document.createElement('button');
  startBtn.className = 'btn-print';
  startBtn.textContent = '➕ Start New Report';
  startBtn.style.marginBottom = '18px';
  startBtn.addEventListener('click', () => newReport());
  wrap.appendChild(startBtn);

  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = 'font-size:13px;color:#888;padding:10px 0';
  loadingMsg.textContent = 'Loading reports…';
  wrap.appendChild(loadingMsg);

  tc.appendChild(wrap);

  fetch(REPORTS_API_URL)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(list => {
      if (!Array.isArray(list)) throw new Error('bad response');
      loadingMsg.remove();
      const buckets = { unstarted: [], in_progress: [], complete: [] };
      list.forEach(r => {
        const st = buckets[r.status] ? r.status : 'complete'; // old rows default to complete
        buckets[st].push(r);
      });
      wrap.appendChild(homeSection('🆕 Unstarted', buckets.unstarted, 'unstarted',
        'Reports pasted from dispatch but not opened yet.'));
      wrap.appendChild(homeSection('🚧 In Progress', buckets.in_progress, 'in_progress',
        'Someone has started filling this out.'));
      wrap.appendChild(homeSection('✅ Complete (recent)', buckets.complete.slice(0, 8), 'complete',
        'Filed reports. Tap "View Full History" on Finalize to search everything.'));
    })
    .catch(() => {
      loadingMsg.style.color = '#8b0000';
      loadingMsg.textContent = 'Could not reach the shared report list (offline?). You can still start a new report.';
    });
}

function homeSection(title, items, status, help) {
  const card = document.createElement('div');
  card.className = 'card';
  const t = document.createElement('div');
  t.className = 'card-title';
  t.textContent = title + '  (' + items.length + ')';
  const body = document.createElement('div');
  body.className = 'card-body';

  const helpEl = document.createElement('div');
  helpEl.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px;line-height:1.4';
  helpEl.textContent = help;
  body.appendChild(helpEl);

  if (!items.length) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:13px;color:#aaa;padding:6px 0';
    none.textContent = 'Nothing here right now.';
    body.appendChild(none);
  } else {
    items.forEach(r => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0e8d8;cursor:pointer';
      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0';
      const line1 = document.createElement('div');
      line1.style.cssText = 'font-size:14px;font-weight:700;color:#1a1a1a';
      line1.textContent = r.run_num || '(no incident #)';
      const line2 = document.createElement('div');
      line2.style.cssText = 'font-size:11px;color:#888';
      line2.textContent = [r.date, r.address, r.ic_name ? ('IC ' + r.ic_name) : ''].filter(Boolean).join('  ·  ');
      info.appendChild(line1);
      info.appendChild(line2);
      row.appendChild(info);
      const openBtn = document.createElement('button');
      openBtn.textContent = 'Open';
      openBtn.style.cssText = 'background:#8b0000;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;font-family:Georgia,serif;flex-shrink:0';
      openBtn.addEventListener('click', () => openReportFromQueue(r.id, status));
      row.appendChild(openBtn);
      body.appendChild(row);
    });
  }

  card.appendChild(t);
  card.appendChild(body);
  return card;
}

// ── Reload personnel roster on demand ──────────────────
async function reloadPersonnel(e) {
  const btn = (e && e.target) ? e.target : null;
  const orig = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳ Loading roster…'; btn.disabled = true; }
  try {
    await loadPersonnel();
    if (btn) { btn.textContent = '✓ Roster Updated!'; }
    renderTab(); // refresh in case Personnel tab is open
    if (btn) setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2000);
  } catch(err) {
    if (btn) {
      btn.textContent = '✗ Failed';
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2500);
    }
  }
}

// Boot immediately with built-in roster — don't wait for fetch
try {
  PERSONNEL = [...PERSONNEL_FALLBACK];
  F = loadForm();
  render();
} catch(bootErr) {
  var eb = document.createElement('div');
  eb.style.cssText = 'background:#fff0f0;border:2px solid #c00;border-radius:8px;padding:16px;margin:14px;font-family:monospace;font-size:13px;color:#c00;white-space:pre-wrap';
  eb.textContent = 'BOOT ERROR:\n' + bootErr.message + '\n\n' + (bootErr.stack||'').split('\n').slice(0,8).join('\n');
  (document.getElementById('tab-content') || document.body).appendChild(eb);
  console.error('Boot error:', bootErr);
}

// Then try to load the live roster from the Cloudflare Worker in the background
loadPersonnel().then(() => {
  // Silently re-render current tab to pick up updated roster (only if
  // we're actually showing the tab editor — the home screen doesn't use
  // PERSONNEL directly, so there's nothing to refresh there)
  if (viewMode === 'editor') {
    renderTab();
    var hs = document.getElementById('header-sub');
    if (hs) hs.textContent = '#' + (F.runNum||'—') + ' · ' + (F.date||'No date set');
  }
});
