import { useState, useRef } from "react";

const PERSONNEL = [
  { name: "Anthony, Robert", badge: "8", qual: "int" },
  { name: "Bacon, Jason", badge: "80", qual: "int" },
  { name: "Batis, Jeffery", badge: "137", qual: "" },
  { name: "Bench, Tyler", badge: "116", qual: "int" },
  { name: "Bodoh, Lori", badge: "88", qual: "emt/int" },
  { name: "Burns, Jim", badge: "109", qual: "int" },
  { name: "Burtless, John", badge: "16", qual: "" },
  { name: "Butler, Mitchell", badge: "124", qual: "int" },
  { name: "Ely, Fred", badge: "135", qual: "" },
  { name: "Farrance, James", badge: "128", qual: "int" },
  { name: "Foster, Barrie-Lyn", badge: "46", qual: "emt/int" },
  { name: "Foster, Craig", badge: "21", qual: "int" },
  { name: "Foster, Kevin", badge: "23", qual: "emt/int" },
  { name: "Froio, Samuel", badge: "135", qual: "" },
  { name: "Fronce, Ryan", badge: "131", qual: "int" },
  { name: "George, Michael", badge: "110", qual: "int" },
  { name: "Hultz, Kyle", badge: "43", qual: "int" },
  { name: "Hultz, Ryan", badge: "41", qual: "int" },
  { name: "Jackson, Luke", badge: "132", qual: "int" },
  { name: "Jackson, Matt", badge: "108", qual: "" },
  { name: "Jakaub, Stan", badge: "117", qual: "int" },
  { name: "Lamaster, John Jr.", badge: "49", qual: "int" },
  { name: "Marriott, Michael", badge: "111", qual: "int" },
  { name: "McNabb, Tim", badge: "121", qual: "emt/int" },
  { name: "Parker, David", badge: "102", qual: "emt/int" },
  { name: "Perkins, David", badge: "53", qual: "emt/int" },
  { name: "Rodriguez, Luis", badge: "125", qual: "emt/int" },
  { name: "Salato, Vincent", badge: "126", qual: "int" },
  { name: "Shaw, Andrew", badge: "133", qual: "int" },
  { name: "Shaw, John", badge: "123", qual: "int" },
  { name: "Thurston, Brad", badge: "131", qual: "emt" },
  { name: "Thurston, Christine", badge: "119", qual: "emt" },
  { name: "Thurston, Ken Sr.", badge: "66", qual: "int" },
  { name: "Thurston, Kevin", badge: "129", qual: "int" },
  { name: "Thurston, Richard", badge: "114", qual: "int" },
  { name: "Thurston, Rob Jr.", badge: "100", qual: "emt/int" },
  { name: "Walborn, George Jr.", badge: "91", qual: "int" },
  { name: "Walczyk, Tom", badge: "70", qual: "int" },
  { name: "Wells, Jason", badge: "120", qual: "int" },
];

const AMB_SERVICES = ["AMR", "THROOP", "FLEMING", "Cayuga", "Other"];

const DISPATCH_TYPES = [
  { code: "311", label: "Medical assist" },
  { code: "321", label: "EMS call" },
  { code: "322", label: "MVA" },
  { code: "324", label: "MVA no injuries" },
  { code: "350", label: "RIT call" },
  { code: "411", label: "Liquid spill" },
  { code: "813", label: "Wind/Storm" },
  { code: "611", label: "Canceled en route" },
  { code: "444", label: "Power line down" },
  { code: "561", label: "Unauthorized burning" },
  { code: "700", label: "False alarm" },
  { code: "STR", label: "Structure fire:" },
  { code: "VEH", label: "Vehicle fire:" },
  { code: "OUT", label: "Outdoor fire:" },
  { code: "ELE", label: "Electrical problem:" },
  { code: "OTH", label: "Other:" },
];

const LOCATIONS = [
  { code: "121", label: "Gym" },
  { code: "131", label: "Church" },
  { code: "161", label: "Restaurant" },
  { code: "162", label: "Bar" },
  { code: "816", label: "Farm" },
  { code: "891", label: "Warehouse" },
  { code: "962", label: "Residential street" },
  { code: "965", label: "Vehicle parking area" },
  { code: "519", label: "Grocery Store" },
  { code: "559", label: "HD, Dicks, Petco" },
  { code: "581", label: "Mall, Kohls" },
  { code: "700", label: "Manufacturing" },
  { code: "210", label: "School" },
  { code: "321", label: "ARC/IRA" },
  { code: "419", label: "1-2 Family Dwelling" },
  { code: "512", label: "Convenience Store" },
];

const APPARATUS = ["Rescue 2", "Engine 1", "Engine 2", "Rescue 1", "Chief's Vehicle", "Quint 1", "Squad 1", "Squad 2", "Squad 3", "Tanker 1"];
const TABS = ["Incident", "Times", "Dispatch", "Apparatus", "Personnel", "MVA", "EMS", "Remarks", "Preview"];

const emptyForm = {
  date: "", runNum: "15-", ic: "", enteredBy: "", badge: "", entryDate: "",
  disp: "", enroute: "", arrived: "", clear: "", inQ: "",
  dispType: "", dispDetail: "", locCode: "", address: "",
  apparatus: {},
  personnel: {},
  emtCt: "", intCt: "", totalCt: "",
  injName: "", injNum: "", rptFiled: "",
  amb: [{svc:"",custom:"",als:""},{svc:"",custom:"",als:""},{svc:"",custom:"",als:""}],
  pcr: "",
  law: ["", "", ""],
  cars: [{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""}],
  mutual: "", remarks: "", reportBy: "", pg: "1", pgOf: "1",
};

/* UI Components */
const R = "#8b0000";
const sel = { width: "100%", boxSizing: "border-box", background: "#fff8f0", border: "1.5px solid #c8a97a", borderRadius: 6, padding: "9px 10px", fontSize: 15, color: "#1a1a1a", fontFamily: "inherit", outline: "none" };
const Lbl = ({c}) => <div style={{fontSize:11,fontWeight:700,color:R,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{c}</div>;
const Inp = ({value,onChange,placeholder,type="text",style={}}) => <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...sel,...style}}/>;
const Card = ({children,title}) => <div style={{background:"#fff",borderRadius:10,border:"1.5px solid #e0c9a6",marginBottom:14,overflow:"hidden"}}>{title && <div style={{background:R,color:"#fff",padding:"7px 13px",fontSize:12,fontWeight:700,letterSpacing:"0.07em"}}>{title}</div>}<div style={{padding:"13px 13px 10px"}}>{children}</div></div>;
const Toggle = ({checked,onChange,label,sub}) => <div onClick={()=>onChange(!checked)} style={{display:"flex",alignItems:"center",gap:10,background:checked?R:"#f5ede0",border:`1.5px solid ${checked?R:"#c8a97a"}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",userSelect:"none"}}><div style={{width:18,height:18,borderRadius:4,background:checked?"#fff":"#c8a97a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{checked && <span style={{color:R,fontSize:13,fontWeight:900}}>✓</span>}</div><div><div style={{fontSize:14,fontWeight:600,color:checked?"#fff":"#1a1a1a"}}>{label}</div>{sub && <div style={{fontSize:11,color:checked?"#ffcccc":"#888"}}>{sub}</div>}</div></div>;
const TI = ({value,onChange,label}) => <div style={{flex:1}}><Lbl c={label}/><Inp type="time" value={value} onChange={onChange}/></div>;

function AmbRow({value,onChange}) {
  return <div><Lbl c="Service"/><select value={value.svc} onChange={e=>onChange({...value,svc:e.target.value,custom:""})} style={{...sel,marginBottom:8}}><option value="">— Select —</option>{AMB_SERVICES.map(s=><option key={s} value={s}>{s}</option>)}</select>{value.svc==="Other" && <><Lbl c="Enter Name"/><Inp value={value.custom} onChange={v=>onChange({...value,custom:v})} placeholder="Service name" style={{marginBottom:8}}/></>}<Lbl c="ALS?"/><select value={value.als} onChange={e=>onChange({...value,als:e.target.value})} style={sel}><option value="">—</option><option value="YES">YES</option><option value="NO">NO</option></select></div>;
}

function ambName(a) {
  return a.svc === "Other" ? (a.custom || "Other") : a.svc;
}

/* PDF Generator */
function generatePDF(f) {
  // Use html2pdf library via CDN (loaded dynamically)
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  document.head.appendChild(script);
  
  script.onload = () => {
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 0.35,
      filename: `AureliusRunReport_${f.runNum.replace(/-/g, "")}_${f.date}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };
}

/* PDF Template */
function PDFContent({f}) {
  const selPers = PERSONNEL.filter(p => f.personnel[p.badge]);
  const dispEntry = DISPATCH_TYPES.find(d => d.code === f.dispType);
  const locEntry = LOCATIONS.find(l => l.code === f.locCode);

  return (
    <div id="pdf-content" style={{ width: "8.5in", background: "white", padding: 0, fontFamily: "Arial, sans-serif", fontSize: "9pt", color: "#000", lineHeight: 1.2 }}>
      {/* ─── PAGE 1 ─── */}
      <div style={{ pageBreakAfter: "always", padding: "0.35in" }}>
        <div style={{ textAlign: "center", fontSize: "16pt", fontWeight: "bold", borderBottom: "2px solid #000", paddingBottom: "4pt", marginBottom: "12pt" }}>AURELIUS FIRE AND RESCUE</div>

        {/* Date/Run#/IC */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "28%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>DATE:</span> {f.date}</td>
              <td style={{ width: "28%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>RUN REPORT #</span> {f.runNum}</td>
              <td style={{ border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>INCIDENT COMMANDER:</span> {f.ic}</td>
            </tr>
          </tbody>
        </table>

        {/* Entered by */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "35%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>Entered by:</span> {f.enteredBy}</td>
              <td style={{ width: "25%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>Badge #:</span> {f.badge}</td>
              <td style={{ border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold",fontSize:"7pt"}}>On:</span> {f.entryDate} <span style={{fontSize:"6pt"}}>Computer entry only</span></td>
            </tr>
          </tbody>
        </table>

        {/* Times */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              {[["DISPATCHED", f.disp], ["ENROUTE", f.enroute], ["ARRIVED", f.arrived], ["CLEAR SCENE", f.clear], ["IN QUARTERS", f.inQ]].map(([l, v]) => (
                <td key={l} style={{ width: "20%", border: "1px solid #000", padding: "2pt", textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: "7pt" }}>{l}</div>
                  <div style={{ fontSize: "10pt", fontWeight: "bold" }}>{v}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Apparatus */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>APPARATUS RESPONDING — Riders</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              {APPARATUS.slice(0, 5).map((a, i) => (
                <td key={a} style={{ width: "20%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                  <span style={{ fontWeight: "bold" }}>{a.toUpperCase()}</span>
                  <div style={{ borderBottom: "1px solid #000", minHeight: "12pt" }}></div>
                </td>
              ))}
            </tr>
            <tr>
              {APPARATUS.slice(5).map((a) => (
                <td key={a} style={{ width: "20%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                  <span style={{ fontWeight: "bold" }}>{a.toUpperCase()}</span>
                  <div style={{ borderBottom: "1px solid #000", minHeight: "12pt" }}></div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Dispatch Type */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>DISPATCHED AS</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            {DISPATCH_TYPES.map((d, i) => {
              if (i % 2 === 0) {
                const d2 = DISPATCH_TYPES[i + 1];
                return (
                  <tr key={d.code}>
                    <td style={{ width: "50%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                      <input type="checkbox" checked={f.dispType === d.code} readOnly style={{marginRight:"4pt"}}/>
                      {d.label}
                    </td>
                    {d2 && (
                      <td style={{ width: "50%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                        <input type="checkbox" checked={f.dispType === d2.code} readOnly style={{marginRight:"4pt"}}/>
                        {d2.label}
                      </td>
                    )}
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>

        {/* Location */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>LOCATION TYPE</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            {Array.from({ length: Math.ceil(LOCATIONS.length / 4) }).map((_, row) => (
              <tr key={row}>
                {LOCATIONS.slice(row * 4, row * 4 + 4).map(l => (
                  <td key={l.code} style={{ width: "25%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                    <input type="checkbox" checked={f.locCode === l.code} readOnly style={{marginRight:"3pt"}}/>
                    {l.code} {l.label}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Address */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "2pt", fontSize: "8pt" }}><span style={{fontWeight:"bold"}}>ADDRESS:</span> {f.address}</td>
            </tr>
          </tbody>
        </table>

        {/* Personnel */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>PERSONNEL ON SCENE</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            {Array.from({ length: Math.ceil(PERSONNEL.length / 2) }).map((_, row) => (
              <tr key={row}>
                {PERSONNEL.slice(row * 2, row * 2 + 2).map(p => (
                  <td key={p.badge} style={{ width: "50%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                    <input type="checkbox" checked={!!f.personnel[p.badge]} readOnly style={{marginRight:"3pt"}}/>
                    {p.name} <span style={{color:"#555"}}>{p.badge}{p.qual ? " " + p.qual : ""}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Counts */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "25%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>EMT's:</span> {f.emtCt}</td>
              <td style={{ width: "25%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>Interior FF:</span> {f.intCt}</td>
              <td style={{ width: "25%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>Total:</span> {f.totalCt || selPers.length}</td>
              <td style={{ width: "25%", border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>Page:</span> {f.pg} of {f.pgOf}</td>
            </tr>
          </tbody>
        </table>

        {/* Injured */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}>
                <span style={{fontWeight:"bold"}}>PERSONNEL INJURED — Name:</span> {f.injName}
                <span style={{marginLeft:"12pt",fontWeight:"bold"}}>Number:</span> {f.injNum}
                <span style={{marginLeft:"12pt",fontWeight:"bold"}}>Report Filed:</span> {f.rptFiled || "YES___ NO___"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Remarks */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>REMARKS — CAUSE OF INCIDENT, EXTENT OF DAMAGE, INSURANCE CARRIER</div>
        <div style={{ border: "1px solid #000", padding: "4pt", minHeight: "60pt", fontSize: "8pt", whiteSpace: "pre-wrap", marginBottom: "4pt" }}>{f.remarks}</div>

        {/* MVA */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>MVA</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            {f.cars.map((c, i) => (
              <tr key={i} style={{ fontSize: "7pt" }}>
                <td style={{ width: "10%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold"}}>CAR #{i+1}</span></td>
                <td style={{ width: "40%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold"}}>MODEL:</span> {c.model}</td>
                <td style={{ width: "25%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold"}}>PLATE#:</span> {c.plate}</td>
                <td style={{ width: "25%", border: "1px solid #000", padding: "2pt" }}><span style={{fontWeight:"bold"}}>COLOR:</span> {c.color}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mutual Aid */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>MUTUAL AID GIVEN OR RECEIVED:</span> {f.mutual}</td>
            </tr>
          </tbody>
        </table>

        {/* Ambulance */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>AMBULANCE USED</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr style={{ fontSize: "7pt" }}>
              {f.amb.map((a, i) => (
                <td key={i} style={{ width: "33.33%", border: "1px solid #000", padding: "2pt" }}>
                  <span style={{fontWeight:"bold"}}>{i+1}:</span> {ambName(a)} <span style={{fontWeight:"bold",marginLeft:"6pt"}}>ALS:</span> {a.als}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* PCR */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "2pt", fontSize: "7pt" }}><span style={{fontWeight:"bold"}}>PCR NUMBERS:</span> {f.pcr}</td>
            </tr>
          </tbody>
        </table>

        {/* Law Enforcement */}
        <div style={{ fontSize: "7pt", fontWeight: "bold", background: "#e0e0e0", border: "1px solid #000", padding: "2pt", marginBottom: "2pt" }}>LAW ENFORCEMENT</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            <tr style={{ fontSize: "7pt" }}>
              {f.law.map((l, i) => (
                <td key={i} style={{ width: "33.33%", border: "1px solid #000", padding: "2pt" }}>
                  <span style={{fontWeight:"bold"}}>{i+1}:</span> {l}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #000", paddingTop: "4pt", fontSize: "7pt", display: "flex", justifyContent: "space-between" }}>
          <span><span style={{fontWeight:"bold"}}>REPORT BY SIGN:</span> {f.reportBy}</span>
          <span><span style={{fontWeight:"bold"}}>PAGE:</span> {f.pg} OF {f.pgOf}</span>
        </div>
      </div>

      {/* ─── PAGE 2 ─── */}
      <div style={{ padding: "0.35in" }}>
        <div style={{ textAlign: "center", fontSize: "14pt", fontWeight: "bold", marginBottom: "12pt" }}>Aurelius Fire and Rescue</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4pt" }}>
          <tbody>
            {Array.from({ length: Math.ceil(PERSONNEL.length / 2) }).map((_, row) => (
              <tr key={row}>
                {PERSONNEL.slice(row * 2, row * 2 + 2).map(p => (
                  <td key={p.badge} style={{ width: "50%", border: "1px solid #000", padding: "3pt", fontSize: "8pt" }}>
                    <input type="checkbox" checked={!!f.personnel[p.badge]} readOnly style={{marginRight:"3pt"}}/>
                    <span style={{fontWeight:f.personnel[p.badge]?"bold":"normal"}}>{p.name}</span> <span style={{color:"#555",fontSize:"7pt"}}>{p.badge}{p.qual ? " " + p.qual : ""}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #000", paddingTop: "6pt", fontSize: "7pt" }}>
          <span style={{fontWeight:"bold"}}>Report by:</span> {f.reportBy}
        </div>
      </div>
    </div>
  );
}

/* Main App */
export default function App() {
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState(() => {
    try {
      const s = localStorage.getItem("afr_form");
      if (s) {
        const p = JSON.parse(s);
        if (p.amb && p.amb[0] && p.amb[0].unit !== undefined) p.amb = p.amb.map(a => ({svc:a.unit||"",custom:"",als:a.als||""}));
        return {...emptyForm, ...p};
      }
    } catch {}
    return {...emptyForm};
  });

  const upd = (k, v) => { const n = {...f, [k]: v}; setF(n); try{localStorage.setItem("afr_form", JSON.stringify(n));}catch{} };
  const updN = (k, sub, v) => upd(k, {...f[k], [sub]: v});
  const updA = (k, i, field, v) => { const a = [...f[k]]; a[i] = {...a[i], [field]: v}; upd(k, a); };
  const updAmb = (i, v) => { const a = [...f.amb]; a[i] = v; upd("amb", a); };

  const save = () => { try{localStorage.setItem("afr_form", JSON.stringify(f));setSaved(true);setTimeout(()=>setSaved(false),2000);}catch{} };
  const clear = () => { if(window.confirm("Clear all data?")){ setF({...emptyForm}); try{localStorage.removeItem("afr_form");}catch{} } };
  const print = () => generatePDF(f);

  const selCount = PERSONNEL.filter(p => f.personnel[p.badge]).length;

  const renderTab = () => {
    switch(tab) {
      case 0: return <div><Card title="Incident Info"><Lbl c="Date"/><Inp type="date" value={f.date} onChange={v=>upd("date",v)} style={{marginBottom:10}}/><Lbl c="Run Report #"/><Inp value={f.runNum} onChange={v=>upd("runNum",v)} placeholder="15-0602" style={{marginBottom:10}}/><Lbl c="Incident Commander"/><Inp value={f.ic} onChange={v=>upd("ic",v)} placeholder="Name" style={{marginBottom:10}}/><Lbl c="Entered By"/><Inp value={f.enteredBy} onChange={v=>upd("enteredBy",v)} placeholder="Name" style={{marginBottom:10}}/><div style={{display:"flex",gap:10}}><div style={{flex:1}}><Lbl c="Badge #"/><Inp value={f.badge} onChange={v=>upd("badge",v)}/></div><div style={{flex:1}}><Lbl c="Entry Date"/><Inp type="date" value={f.entryDate} onChange={v=>upd("entryDate",v)}/></div></div></Card><Card title="Location / Address"><Lbl c="Location Type"/><select value={f.locCode} onChange={e=>upd("locCode",e.target.value)} style={{...sel,marginBottom:10}}><option value="">— Select —</option>{LOCATIONS.map(l=><option key={l.code} value={l.code}>{l.code} – {l.label}</option>)}</select><Lbl c="Street Address"/><Inp value={f.address} onChange={v=>upd("address",v)} placeholder="Address"/></Card></div>;
      case 1: return <Card title="Times"><div style={{display:"flex",gap:10,marginBottom:12}}><TI label="Dispatched" value={f.disp} onChange={v=>upd("disp",v)}/><TI label="Enroute" value={f.enroute} onChange={v=>upd("enroute",v)}/></div><div style={{display:"flex",gap:10,marginBottom:12}}><TI label="Arrived" value={f.arrived} onChange={v=>upd("arrived",v)}/><TI label="Clear Scene" value={f.clear} onChange={v=>upd("clear",v)}/></div><div style={{display:"flex",gap:10}}><TI label="In Quarters" value={f.inQ} onChange={v=>upd("inQ",v)}/><div style={{flex:1}}/></div></Card>;
      case 2: return <Card title="Dispatched As"><div style={{display:"flex",flexDirection:"column",gap:8}}>{DISPATCH_TYPES.map(d=><Toggle key={d.code} checked={f.dispType===d.code} onChange={()=>upd("dispType",f.dispType===d.code?"":d.code)} label={d.label} sub={d.code}/>)}</div>{["STR","VEH","OUT","ELE","OTH"].includes(f.dispType) && <div style={{marginTop:10}}><Lbl c="Details"/><Inp value={f.dispDetail} onChange={v=>upd("dispDetail",v)} placeholder="Describe…"/></div>}</Card>;
      case 3: return <Card title="Apparatus Responding"><div style={{display:"flex",flexDirection:"column",gap:8}}>{APPARATUS.map(a=><Toggle key={a} checked={!!f.apparatus[a]} onChange={v=>updN("apparatus",a,v)} label={a}/>)}</div></Card>;
      case 4: return <div><Card title={`Personnel — ${selCount} selected`}><div style={{display:"flex",flexDirection:"column",gap:7}}>{PERSONNEL.map(p=><Toggle key={p.badge} checked={!!f.personnel[p.badge]} onChange={v=>updN("personnel",p.badge,v)} label={p.name} sub={`Badge ${p.badge}${p.qual?" · "+p.qual.toUpperCase():""}`}/>)}</div></Card><Card title="Counts"><div style={{display:"flex",gap:10,marginBottom:10}}><div style={{flex:1}}><Lbl c="EMTs"/><Inp type="number" value={f.emtCt} onChange={v=>upd("emtCt",v)} placeholder="0"/></div><div style={{flex:1}}><Lbl c="Interior FF"/><Inp type="number" value={f.intCt} onChange={v=>upd("intCt",v)} placeholder="0"/></div><div style={{flex:1}}><Lbl c="Total"/><Inp type="number" value={f.totalCt} onChange={v=>upd("totalCt",v)} placeholder={String(selCount)}/></div></div><Lbl c="Personnel Injured — Name"/><Inp value={f.injName} onChange={v=>upd("injName",v)} placeholder="Name" style={{marginBottom:8}}/><div style={{display:"flex",gap:10}}><div style={{flex:1}}><Lbl c="Number"/><Inp value={f.injNum} onChange={v=>upd("injNum",v)}/></div><div style={{flex:1}}><Lbl c="Report Filed"/><select value={f.rptFiled} onChange={e=>upd("rptFiled",e.target.value)} style={sel}><option value="">—</option><option value="YES">YES</option><option value="NO">NO</option></select></div></div></Card></div>;
      case 5: return <div>{[0,1,2].map(i=><Card key={i} title={`Car #${i+1}`}><Lbl c="Model"/><Inp value={f.cars[i].model} onChange={v=>updA("cars",i,"model",v)} placeholder="Year Make Model" style={{marginBottom:8}}/><div style={{display:"flex",gap:10}}><div style={{flex:1}}><Lbl c="Plate #"/><Inp value={f.cars[i].plate} onChange={v=>updA("cars",i,"plate",v)}/></div><div style={{flex:1}}><Lbl c="Color"/><Inp value={f.cars[i].color} onChange={v=>updA("cars",i,"color",v)}/></div></div></Card>)}<Card title="Law Enforcement">{[0,1,2].map(i=><div key={i} style={{marginBottom:8}}><Lbl c={`Officer ${i+1}`}/><Inp value={f.law[i]} onChange={v=>{const l=[...f.law];l[i]=v;upd("law",l);}}/></div>)}</Card></div>;
      case 6: return <div>{[0,1,2].map(i=><Card key={i} title={`Ambulance ${i+1}`}><AmbRow value={f.amb[i]} onChange={v=>updAmb(i,v)}/></Card>)}<Card title="PCR Numbers"><Inp value={f.pcr} onChange={v=>upd("pcr",v)} placeholder="PCR #s"/></Card></div>;
      case 7: return <div><Card title="Remarks"><Lbl c="Cause of Incident, Damage, Insurance Carrier, etc."/><textarea value={f.remarks} onChange={e=>upd("remarks",e.target.value)} rows={5} placeholder="Enter remarks…" style={{width:"100%",boxSizing:"border-box",background:"#fff8f0",border:"1.5px solid #c8a97a",borderRadius:6,padding:"9px 10px",fontSize:15,color:"#1a1a1a",fontFamily:"inherit",resize:"vertical"}}/></Card><Card title="Mutual Aid"><Inp value={f.mutual} onChange={v=>upd("mutual",v)} placeholder="Given or received from…"/></Card><Card title="Report Signature"><div style={{display:"flex",gap:10}}><div style={{flex:2}}><Lbl c="Report By"/><Inp value={f.reportBy} onChange={v=>upd("reportBy",v)}/></div><div style={{flex:1}}><Lbl c="Page"/><Inp value={f.pg} onChange={v=>upd("pg",v)}/></div><div style={{flex:1}}><Lbl c="Of"/><Inp value={f.pgOf} onChange={v=>upd("pgOf",v)}/></div></div></Card></div>;
      case 8: return <div><Card title="Ready to Print"><p style={{fontSize:13,color:"#555",marginBottom:12}}>Tap <b>Generate PDF</b> below. The PDF will match the original form layout exactly.</p></Card><button onClick={print} style={{width:"100%",background:R,color:"#fff",border:"none",borderRadius:10,padding:"15px 0",fontSize:17,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📄 Generate PDF</button></div>;
      default: return null;
    }
  };

  return (
    <>
      <div style={{ display: "none" }}>
        <PDFContent f={f}/>
      </div>
      <div style={{background:"#f5ede0",minHeight:"100vh",fontFamily:"Georgia,serif"}}>
        <div style={{background:"linear-gradient(135deg,#8b0000 0%,#5a0000 100%)",color:"#fff",padding:"13px 16px 0",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 12px rgba(0,0,0,0.35)"}}>
          <div style={{fontSize:10,letterSpacing:"0.15em",opacity:0.7,textTransform:"uppercase"}}>Run Report</div>
          <div style={{fontSize:18,fontWeight:700}}>Aurelius Fire & Rescue</div>
          <div style={{fontSize:11,opacity:0.65,marginBottom:7}}>#{f.runNum||"—"} · {f.date||"No date"}</div>
          <div style={{display:"flex",overflowX:"auto",marginLeft:-16,marginRight:-16}}>
            {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{background:"none",border:"none",cursor:"pointer",padding:"7px 11px",fontSize:11,fontWeight:600,color:tab===i?"#fff":"rgba(255,255,255,0.5)",borderBottom:tab===i?"3px solid #ffcc00":"3px solid transparent",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{t}</button>)}
          </div>
        </div>
        <div style={{padding:14,maxWidth:640,margin:"0 auto"}}>
          <div style={{marginTop:14}}>{renderTab()}</div>
          <div style={{display:"flex",gap:10,marginTop:8,marginBottom:20}}>
            {tab>0 && <button onClick={()=>setTab(t=>t-1)} style={{flex:1,background:"#fff",color:R,border:"2px solid "+R,borderRadius:10,padding:"12px 0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>}
            <button onClick={save} style={{flex:1,background:saved?"#2d6a2d":"#555",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background 0.2s"}}>{saved?"✓ Saved":"💾 Save"}</button>
            {tab<TABS.length-1 && <button onClick={()=>setTab(t=>t+1)} style={{flex:1,background:R,color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Next →</button>}
          </div>
          <button onClick={clear} style={{width:"100%",background:"none",color:"#aaa",border:"1px solid #ddd",borderRadius:8,padding:"8px 0",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:30}}>Clear all form data</button>
        </div>
      </div>
    </>
  );
}
