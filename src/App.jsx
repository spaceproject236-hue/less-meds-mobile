import { useState, useEffect, useRef } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg: "#080f1a", surface: "#0d1829", surfaceAlt: "#111f33",
    border: "#1e3a5f", borderLight: "#162d4a",
    text: "#e8f4fd", textSub: "#7eb3d4", textMuted: "#3d6a8a",
    accent: "#06b6d4", accentDim: "#0e4a5c", accentGlow: "rgba(6,182,212,0.15)",
    success: "#10b981", successDim: "#064e3b",
    warning: "#f59e0b", warningDim: "#451a03",
    danger: "#ef4444", dangerDim: "#450a0a",
    navBg: "#060d18", pillBg: "#0e2a40",
  },
  light: {
    bg: "#f0f6ff", surface: "#ffffff", surfaceAlt: "#f8faff",
    border: "#c7ddf5", borderLight: "#daeaf8",
    text: "#0a1929", textSub: "#3a6a9a", textMuted: "#8aabcc",
    accent: "#0369a1", accentDim: "#dbeafe", accentGlow: "rgba(3,105,161,0.10)",
    success: "#059669", successDim: "#d1fae5",
    warning: "#d97706", warningDim: "#fef3c7",
    danger: "#dc2626", dangerDim: "#fee2e2",
    navBg: "#ffffff", pillBg: "#e0f0ff",
  },
};

const font = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

// ─── Risk Algorithm ───────────────────────────────────────────────────────────
const HIGH_RISK_DRUGS = ["warfarin","digoxin","amiodarone","methotrexate","lithium","opioid","oxycodone","hydrocodone","morphine","fentanyl"];
const INTERACTION_PAIRS = [["warfarin","aspirin"],["warfarin","ibuprofen"],["metformin","contrast"],["lisinopril","potassium"],["digoxin","amiodarone"],["lithium","ibuprofen"]];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function computeScore(meds) {
  let score = 0; const flags = [];
  const names = meds.map(m => m.name.toLowerCase());
  if (meds.length >= 10) { score += 30; flags.push({ label: "High Polypharmacy", detail: `${meds.length} medications`, type: "danger" }); }
  else if (meds.length >= 5) { score += 15; flags.push({ label: "Polypharmacy", detail: `${meds.length} medications`, type: "warning" }); }
  let ix = 0;
  INTERACTION_PAIRS.forEach(([a, b]) => {
    if (names.some(n => n.includes(a)) && names.some(n => n.includes(b))) { ix++; flags.push({ label: "Drug Interaction", detail: `${cap(a)} + ${cap(b)}`, type: "danger" }); }
  });
  score += Math.min(ix * 10, 30);
  HIGH_RISK_DRUGS.forEach(d => { if (names.some(n => n.includes(d))) { score += 7; flags.push({ label: "High-Risk Medication", detail: cap(d), type: "warning" }); } });
  return { score: Math.min(score, 100), flags };
}

const riskLevel = s => s <= 40 ? { label: "Low Risk", color: "success", emoji: "🟢" } : s <= 70 ? { label: "Moderate Risk", color: "warning", emoji: "🟡" } : { label: "High Risk", color: "danger", emoji: "🔴" };

// ─── Data ─────────────────────────────────────────────────────────────────────
const VIDEOS = [
  { id:"v1", title:"The Hidden Danger of Too Many Pills", subtitle:"TEDx Talk • 18 min", desc:"Dr. Canterbury reveals how polypharmacy silently undermines quality of life in elderly patients.", tag:"Featured", tagColor:"accent", thumb:"🎤", year:"2023" },
  { id:"v2", title:"Deprescribing: The Art of Letting Go", subtitle:"Grand Rounds • 42 min", desc:"Evidence-based frameworks for safely reducing medication burden in patients over 65.", tag:"Clinical", tagColor:"success", thumb:"🏥", year:"2024" },
  { id:"v3", title:"Talking to Your Doctor About Fewer Meds", subtitle:"Caregiver Guide • 12 min", desc:"Practical conversation starters for family caregivers advocating for deprescribing.", tag:"Caregivers", tagColor:"warning", thumb:"💬", year:"2024" },
  { id:"v4", title:"Polypharmacy & Dementia Risk", subtitle:"Research Seminar • 28 min", desc:"Emerging research linking high medication burden to accelerated cognitive decline.", tag:"Research", tagColor:"accent", thumb:"🧠", year:"2023" },
  { id:"v5", title:"Falls, Fractures & the Medication Connection", subtitle:"Patient Safety • 22 min", desc:"How certain medication combinations dramatically increase fall risk.", tag:"Safety", tagColor:"danger", thumb:"⚠️", year:"2024" },
  { id:"v6", title:"When Less Is More: A Geriatrician's Approach", subtitle:"Interview Series • 35 min", desc:"Dr. Canterbury in conversation with leading geriatricians on building deprescribing into routine care.", tag:"Interview", tagColor:"success", thumb:"🎙️", year:"2025" },
];
const CONDITIONS = ["Diabetes","Hypertension","Heart Disease","COPD","Arthritis","Osteoporosis","Depression / Anxiety","Dementia","Kidney Disease","Thyroid Disorder","Atrial Fibrillation","Parkinson's","Cancer","Stroke / TIA"];
const RELATIONSHIPS = ["Spouse / Partner","Adult Child","Parent","Sibling","Grandchild","Professional Caregiver","Other"];

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({ children, t }) {
  return <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, fontFamily: font }}>{children}</div>;
}
function Btn({ children, onClick, variant = "primary", disabled, t, fullWidth = true, style: extra = {} }) {
  const base = { border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: font, fontWeight: 600, fontSize: 14, padding: "13px 16px", transition: "all 0.15s", width: fullWidth ? "100%" : "auto", ...extra };
  const look = variant === "primary"
    ? { background: disabled ? t.surfaceAlt : `linear-gradient(135deg, ${t.accent}, #0891b2)`, color: disabled ? t.textMuted : "#fff", boxShadow: disabled ? "none" : `0 6px 20px ${t.accentGlow}` }
    : variant === "outline"
    ? { background: "none", border: `1px solid ${t.accent}`, color: t.accent }
    : { background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...look }}>{children}</button>;
}
const inputStyle = t => ({ width: "100%", boxSizing: "border-box", background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", color: t.text, fontSize: 13, fontFamily: font, outline: "none" });
const LabeledField = ({ label, t, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 5, fontFamily: font }}>{label}</label>
    {children}
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LessMedsFree() {
  const [theme, setTheme] = useState("dark");
  const t = themes[theme];
  const [screen, setScreen] = useState("home");
  const [planType, setPlanType] = useState(null);
  const [meds, setMeds] = useState([]);
  const [result, setResult] = useState(null);
  const [pricingTab, setPricingTab] = useState("monthly");
  const [activeVideo, setActiveVideo] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [assessmentReady, setAssessmentReady] = useState(false);
  const [assessmentBadge, setAssessmentBadge] = useState(false);

  const hasAssessmentTab = patientInfo && planType === "onetime";
  const baseNav = [{ id:"home", icon:"⬡", label:"Home" }, { id:"checker", icon:"⊕", label:"Checker" }, { id:"resources", icon:"▶", label:"Resources" }];
  const navItems = hasAssessmentTab ? [...baseNav, { id:"assessment", icon:"📋", label:"Assessment" }] : baseNav;

  useEffect(() => {
    if (screen === "submitted" && !assessmentReady) {
      const timer = setTimeout(() => { setAssessmentReady(true); setAssessmentBadge(true); }, 8000);
      return () => clearTimeout(timer);
    }
  }, [screen, assessmentReady]);

  const frameColor = theme === "dark" ? "#1a1a2e" : "#e8e8ec";
  const frameBorder = theme === "dark" ? "#333" : "#bbb";
  const hideNav = ["paywall","patientInfo","fullApp","physicianCode"].includes(screen);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:font }}>
        <div style={{ width:375, height:780, borderRadius:44, background:frameColor, boxShadow:`0 0 0 10px ${frameColor}, 0 0 0 11px ${frameBorder}, 0 40px 80px rgba(0,0,0,0.8)`, overflow:"hidden", position:"relative", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ flex:1, background:t.bg, color:t.text, display:"flex", flexDirection:"column", overflow:"hidden", borderRadius:34, transition:"background 0.3s, color 0.3s" }}>

            {/* Status Bar */}
            {screen !== "fullApp" && <div style={{ height:44, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, borderRadius:"34px 34px 0 0", transition:"background 0.3s", position:"relative" }}>
              <span style={{ fontSize:12, fontWeight:600, color:t.text, fontFamily:font }}>9:41</span>
              <div style={{ width:120, height:28, background:theme==="dark"?"#111":"#ddd", borderRadius:14, position:"absolute", left:"50%", transform:"translateX(-50%)", transition:"background 0.3s" }} />
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                <span style={{ fontSize:9, color:t.textSub }}>●●●</span>
                <span style={{ fontSize:9, color:t.textSub }}>▲</span>
                <span style={{ fontSize:9, color:t.textSub }}>⬛</span>
              </div>
            </div>}

            {/* Header */}
            {screen !== "fullApp" && <header style={{ padding:"10px 18px", borderBottom:`1px solid ${t.border}`, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg, ${t.accent}, #0891b2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>💊</div>
                <div>
                  <div style={{ fontFamily:serif, fontSize:16, fontWeight:400, letterSpacing:-0.3, lineHeight:1 }}>Less<span style={{ color:t.accent }}>Meds</span></div>
                  <div style={{ fontSize:8, color:t.textMuted, letterSpacing:1, textTransform:"uppercase", lineHeight:1.2 }}>{screen==="fullApp"?"Care Dashboard":"Polypharmacy Risk Tool"}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                {assessmentBadge && screen!=="assessment" && (
                  <button onClick={() => { setScreen("assessment"); setAssessmentBadge(false); }} style={{ background:t.successDim, border:`1px solid ${t.success}`, borderRadius:8, padding:"4px 8px", color:t.success, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:font, animation:"pulse 1.5s infinite" }}>📋 Ready!</button>
                )}
                <button onClick={() => setTheme(th => th==="dark"?"light":"dark")} style={{ background:t.pillBg, border:`1px solid ${t.border}`, borderRadius:8, padding:"5px 10px", color:t.textSub, fontSize:11, cursor:"pointer", fontFamily:font }}>
                  {theme==="dark"?"☀️":"🌙"}
                </button>
              </div>
            </header>}

            {/* Content */}
            <div style={{ flex:1, overflowY:screen==="fullApp"?"hidden":"auto", overflowX:"hidden", paddingBottom:screen==="fullApp"?0:8, scrollbarWidth:"none", display:"flex", flexDirection:"column" }}>
              {screen==="home" && <HomeScreen t={t} onStart={() => setScreen("checker")} onResources={() => setScreen("resources")} onCode={() => setScreen("physicianCode")} />}
              {screen==="physicianCode" && <PhysicianCodeScreen t={t} onBack={() => setScreen("home")} onVerified={data => {
                setPlanType("monthly");
                setPatientInfo({ firstName:data.patientFirstName, age:data.age, conditions:data.conditions, caregiverName:data.caregiverName||"Caregiver", relationship:data.relationship||"", email:data.email||"", meds:data.meds, ehrImported:true, physician:data.physician, clinic:data.clinic });
                setResult({ score:data.score, flags:[], medCount:data.meds.length });
                setMeds(data.meds.map(m => ({ id:m.id, name:m.name, dose:m.dose, freq:m.freq })));
                setScreen("fullApp");
              }} />}
              {screen==="checker" && <CheckerScreen t={t} meds={meds} setMeds={setMeds} onResult={r => { setResult(r); setScreen("results"); }} />}
              {screen==="results" && result && <ResultsScreen t={t} result={result} meds={meds} pricingTab={pricingTab} setPricingTab={setPricingTab} onBack={() => setScreen("checker")} onResources={() => setScreen("resources")} onPurchase={plan => { setPlanType(plan); setScreen("paywall"); }} />}
              {screen==="resources" && <ResourcesScreen t={t} activeVideo={activeVideo} setActiveVideo={setActiveVideo} />}
              {screen==="paywall" && <PaywallScreen t={t} planType={planType} onBack={() => setScreen("results")} onComplete={() => setScreen("patientInfo")} />}
              {screen==="patientInfo" && <PatientInfoScreen t={t} planType={planType} prefillMeds={meds} onSubmit={info => { setPatientInfo(info); setScreen(planType==="monthly"?"fullApp":"submitted"); }} onBack={() => setScreen("paywall")} />}
              {screen==="submitted" && <SubmittedScreen t={t} patientInfo={patientInfo} assessmentReady={assessmentReady} onViewAssessment={() => { setScreen("assessment"); setAssessmentBadge(false); }} />}
              {screen==="assessment" && <AssessmentScreen t={t} patientInfo={patientInfo} result={result} meds={meds} assessmentReady={assessmentReady} />}
              {screen==="fullApp" && <FullAppScreen patientInfo={patientInfo} result={result} prefillMeds={meds} onLogout={() => { setPlanType(null); setPatientInfo(null); setResult(null); setMeds([]); setScreen("home"); }} />}
            </div>

            {/* Bottom Nav */}
            {!hideNav && (
              <nav style={{ height:64, background:t.navBg, borderTop:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", flexShrink:0 }}>
                {navItems.map(item => {
                  const active = screen===item.id || (item.id==="checker" && screen==="results") || (item.id==="assessment" && screen==="submitted");
                  const hasAlert = item.id==="assessment" && assessmentReady && screen!=="assessment";
                  return (
                    <button key={item.id} onClick={() => { setScreen(item.id); if(item.id==="assessment") setAssessmentBadge(false); }}
                      style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 14px", color:active?t.accent:t.textMuted, fontFamily:font, transition:"color 0.2s", position:"relative" }}>
                      <span style={{ fontSize:18 }}>{item.icon}</span>
                      <span style={{ fontSize:10, fontWeight:active?600:400, letterSpacing:0.4 }}>{item.label}</span>
                      {active && <span style={{ width:4, height:4, borderRadius:2, background:t.accent }} />}
                      {hasAlert && <span style={{ position:"absolute", top:6, right:8, width:8, height:8, borderRadius:"50%", background:t.success, border:`2px solid ${t.navBg}` }} />}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Home indicator */}
            {screen !== "fullApp" && <div style={{ height:20, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, borderRadius:"0 0 34px 34px" }}>
              <div style={{ width:120, height:4, background:t.border, borderRadius:2 }} />
            </div>}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{display:none}
      `}</style>
    </>
  );
}

// ─── EHR MOCK DATA (physician code lookup) ───────────────────────────────────
const EHR_CODES = {
  "DRPATEL01": {
    patientFirstName: "Eleanor",
    patientLastName: "Whitmore",
    dob: "1947-03-12",
    age: 78,
    physician: "Dr. Rajesh Patel, MD",
    clinic: "Riverside Geriatric Associates",
    score: 82,
    conditions: ["Hypertension","Atrial Fibrillation","Osteoporosis","Depression/Anxiety","Kidney Disease"],
    meds: [
      { id:"e1", name:"Warfarin", dose:"5mg", freq:"Once daily", time:"8:00 AM", taken:false, color:"#ef4444", flag:"⚠️ INR monitoring required" },
      { id:"e2", name:"Metformin", dose:"1000mg", freq:"Twice daily", time:"8:00 AM", taken:true, color:"#3b82f6", flag:null },
      { id:"e3", name:"Lisinopril", dose:"10mg", freq:"Once daily", time:"8:00 AM", taken:false, color:"#8b5cf6", flag:"⚠️ Monitor potassium & renal function" },
      { id:"e4", name:"Aspirin", dose:"81mg", freq:"Once daily", time:"12:00 PM", taken:false, color:"#f59e0b", flag:"🔴 Interaction: Warfarin + Aspirin" },
      { id:"e5", name:"Atorvastatin", dose:"40mg", freq:"Once daily", time:"8:00 PM", taken:false, color:"#06b6d4", flag:null },
      { id:"e6", name:"Alendronate", dose:"70mg", freq:"Weekly", time:"Monday AM", taken:false, color:"#ec4899", flag:null },
      { id:"e7", name:"Potassium Chloride", dose:"20mEq", freq:"Once daily", time:"8:00 AM", taken:false, color:"#22c55e", flag:"⚠️ Monitor with Lisinopril" },
    ],
    alerts: [
      { id:"a1", type:"critical", msg:"Warfarin + Aspirin interaction flagged", time:"2 hrs ago" },
      { id:"a2", type:"warning", msg:"Renal function — review Metformin dose", time:"Today" },
      { id:"a3", type:"info", msg:"Medication review scheduled Feb 25", time:"Yesterday" },
    ],
    messages: [
      { id:"m1", from:"Dr. Patel", text:"Eleanor's Warfarin dose was adjusted last week. Please ensure she takes it at the same time daily and watch for unusual bruising.", time:"9:14 AM", outgoing:false },
      { id:"m2", from:"Pharm. Chen", text:"I've reviewed the medication list. The Aspirin and Warfarin combination needs discussion at the next visit — I'll flag this for Dr. Patel.", time:"11:05 AM", outgoing:false },
    ],
    caregiverName: "",
    relationship: "",
    email: "",
  },
  "DRCHEN22": {
    patientFirstName: "Harold",
    patientLastName: "Simmons",
    dob: "1942-07-04",
    age: 83,
    physician: "Dr. Susan Chen, MD",
    clinic: "Oakwood Family Medicine",
    score: 71,
    conditions: ["Diabetes","Heart Disease","COPD","Arthritis","Thyroid Disorder"],
    meds: [
      { id:"e1", name:"Insulin Glargine", dose:"20 units", freq:"Once daily", time:"8:00 PM", taken:false, color:"#3b82f6", flag:"⚠️ Hypoglycemia risk — monitor glucose" },
      { id:"e2", name:"Metoprolol", dose:"50mg", freq:"Twice daily", time:"8:00 AM", taken:true, color:"#8b5cf6", flag:null },
      { id:"e3", name:"Albuterol", dose:"90mcg", freq:"As needed", time:"As needed", taken:false, color:"#06b6d4", flag:null },
      { id:"e4", name:"Levothyroxine", dose:"75mcg", freq:"Once daily", time:"7:00 AM", taken:true, color:"#f59e0b", flag:"⚠️ Take 30 min before food" },
      { id:"e5", name:"Meloxicam", dose:"15mg", freq:"Once daily", time:"12:00 PM", taken:false, color:"#ef4444", flag:"🔴 NSAIDs — caution with heart disease" },
      { id:"e6", name:"Omeprazole", dose:"20mg", freq:"Once daily", time:"8:00 AM", taken:true, color:"#22c55e", flag:null },
    ],
    alerts: [
      { id:"a1", type:"warning", msg:"Glucose trending high this week", time:"Today" },
      { id:"a2", type:"critical", msg:"NSAIDs flagged — heart disease contraindication", time:"3 hrs ago" },
    ],
    messages: [
      { id:"m1", from:"Dr. Chen", text:"Harold's A1C came back at 8.2. Please make sure he's taking his Insulin at the same time each evening and eating consistently.", time:"10:30 AM", outgoing:false },
    ],
    caregiverName: "",
    relationship: "",
    email: "",
  },
};

// ─── PHYSICIAN CODE SCREEN ────────────────────────────────────────────────────
function PhysicianCodeScreen({ t, onBack, onVerified }) {
  const [step, setStep] = useState("code"); // code | verify | loading
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [ehrData, setEhrData] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const iS = inputStyle(t);

  function submitCode() {
    const found = EHR_CODES[code.trim().toUpperCase()];
    if (!found) { setCodeError("Code not found. Please check with your physician's office."); return; }
    setEhrData(found);
    setCodeError("");
    setStep("verify");
  }

  function submitVerify() {
    if (!firstName.trim() || !lastName.trim() || !dob) { setVerifyError("Please fill in all fields."); return; }
    const dobMatch = ehrData.dob === dob;
    const firstMatch = firstName.trim().toLowerCase() === ehrData.patientFirstName.toLowerCase();
    const lastMatch = lastName.trim().toLowerCase() === ehrData.patientLastName.toLowerCase();
    if (!dobMatch || !firstMatch || !lastMatch) { setVerifyError("Information does not match our records. Please check with your physician's office."); return; }
    setVerifyError("");
    setStep("loading");
    setTimeout(() => {
      onVerified(ehrData);
    }, 2800);
  }

  return (
    <div style={{ padding:"22px 18px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.accent, fontSize:13, cursor:"pointer", fontFamily:font, padding:0, marginBottom:16, display:"flex", alignItems:"center", gap:5 }}>← Back</button>

      {step === "code" && (
        <>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ width:60, height:60, borderRadius:16, background:t.accentDim, border:`2px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 12px" }}>🏥</div>
            <h2 style={{ fontFamily:serif, fontSize:22, fontWeight:400, margin:"0 0 6px" }}>Physician Access Code</h2>
            <p style={{ color:t.textSub, fontSize:13, lineHeight:1.6, margin:0 }}>Your physician's office provided a code to securely import your loved one's health records.</p>
          </div>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:16, marginBottom:16 }}>
            <LabeledField label="Enter Your Code" t={t}>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
                onKeyDown={e => e.key === "Enter" && submitCode()}
                placeholder="e.g. DRSMITH01"
                style={{ ...iS, textTransform:"uppercase", letterSpacing:2, fontSize:16, fontWeight:600, textAlign:"center" }}
                autoComplete="off"
              />
            </LabeledField>
            {codeError && <div style={{ color:t.danger, fontSize:12, marginTop:6 }}>{codeError}</div>}
          </div>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:11, padding:"11px 13px", marginBottom:18, display:"flex", gap:9, alignItems:"flex-start" }}>
            <span style={{ fontSize:16 }}>🔒</span>
            <div style={{ fontSize:11, color:t.textSub, lineHeight:1.5 }}>This code connects your account to your physician's EHR system. Patient data is transmitted using HIPAA-compliant encryption. Your loved one's records will never be stored on this device unencrypted.</div>
          </div>
          <Btn t={t} disabled={code.trim().length < 4} onClick={submitCode}>Verify Code →</Btn>
          <p style={{ color:t.textMuted, fontSize:11, textAlign:"center", marginTop:8 }}>Don't have a code? <span style={{ color:t.accent, cursor:"pointer" }} onClick={onBack}>Start the free check instead</span></p>
        </>
      )}

      {step === "verify" && ehrData && (
        <>
          <div style={{ background:t.successDim || t.surface, border:`1px solid ${t.success}44`, borderRadius:11, padding:"11px 13px", marginBottom:18, display:"flex", gap:9, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>✅</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:t.success }}>Code verified</div>
              <div style={{ fontSize:11, color:t.textSub, marginTop:1 }}>{ehrData.physician} · {ehrData.clinic}</div>
            </div>
          </div>
          <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 6px" }}>Verify Patient Identity</h2>
          <p style={{ color:t.textSub, fontSize:13, lineHeight:1.6, margin:"0 0 16px" }}>To protect patient privacy, please confirm the following information. This is required under HIPAA before records can be released.</p>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:16, marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:2 }}>
              <LabeledField label="Patient First Name" t={t}>
                <input value={firstName} onChange={e => { setFirstName(e.target.value); setVerifyError(""); }} placeholder="e.g. Eleanor" style={iS} />
              </LabeledField>
              <LabeledField label="Patient Last Name" t={t}>
                <input value={lastName} onChange={e => { setLastName(e.target.value); setVerifyError(""); }} placeholder="e.g. Whitmore" style={iS} />
              </LabeledField>
            </div>
            <LabeledField label="Date of Birth" t={t}>
              <input value={dob} onChange={e => { setDob(e.target.value); setVerifyError(""); }} type="date" style={iS} />
            </LabeledField>
            {verifyError && <div style={{ color:t.danger, fontSize:12, marginTop:6, lineHeight:1.5 }}>{verifyError}</div>}
          </div>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:11, padding:"10px 12px", marginBottom:16, display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ fontSize:14 }}>🛡️</span>
            <div style={{ fontSize:11, color:t.textMuted, lineHeight:1.5 }}>HIPAA § 164.514(b) — De-identification standard. Name and date of birth are used solely to verify authorization. They are not stored or transmitted after verification.</div>
          </div>
          <Btn t={t} disabled={!firstName.trim() || !lastName.trim() || !dob} onClick={submitVerify}>Confirm & Import Records →</Btn>
        </>
      )}

      {step === "loading" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:t.accentDim, border:`2px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>🏥</div>
          <div style={{ fontFamily:serif, fontSize:20, fontWeight:400, textAlign:"center" }}>Importing Records</div>
          <p style={{ color:t.textSub, fontSize:13, textAlign:"center", lineHeight:1.6, margin:0 }}>Securely retrieving health records from {ehrData?.clinic}…</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%", marginTop:8 }}>
            {["Authenticating EHR connection…","Retrieving medication list…","Importing lab values & scores…","Applying clinical flags…"].map((step, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 13px", background:t.surface, border:`1px solid ${t.border}`, borderRadius:9 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${t.accent}`, borderTopColor:"transparent", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
                <span style={{ fontSize:12, color:t.textSub }}>{step}</span>
              </div>
            ))}
          </div>
          <p style={{ color:t.textMuted, fontSize:11, textAlign:"center", marginTop:4 }}>🔒 256-bit SSL · HIPAA-compliant transfer</p>
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ t, onStart, onResources, onCode }) {
  const stats = [{ value:"40%", label:"of 65+ take 5+ meds daily" },{ value:"2×", label:"higher fall risk" },{ value:"30%", label:"hospital admissions drug-related" }];
  return (
    <div style={{ paddingBottom:24 }}>
      <div style={{ padding:"26px 20px 22px", background:`linear-gradient(160deg, ${t.surfaceAlt} 0%, ${t.bg} 100%)`, borderBottom:`1px solid ${t.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:t.accentGlow, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", background:t.accentDim, borderRadius:20, padding:"4px 12px", marginBottom:12 }}>
            <span style={{ fontSize:10, color:t.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Free Risk Assessment</span>
          </div>
          <h1 style={{ fontFamily:serif, fontSize:26, fontWeight:400, lineHeight:1.2, margin:"0 0 10px", letterSpacing:-0.5 }}>
            Is your loved one on<br /><em style={{ color:t.accent }}>too many medications?</em>
          </h1>
          <p style={{ color:t.textSub, fontSize:13, lineHeight:1.6, margin:"0 0 18px" }}>Polypharmacy is one of the most under-recognized risks for seniors. Check the risk in under 2 minutes.</p>
          <Btn t={t} onClick={onStart}>Start Free Medication Check →</Btn>
          <p style={{ color:t.textMuted, fontSize:11, textAlign:"center", marginTop:6 }}>No sign-up required • No PHI collected</p>
          <div style={{ marginTop:14, padding:"12px 14px", background:`${t.accent}11`, border:`1px solid ${t.accent}33`, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:20 }}>🏥</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:t.text }}>Have a code from your physician?</div>
                <div style={{ fontSize:11, color:t.textSub, marginTop:1 }}>Import your loved one's records securely.</div>
              </div>
            </div>
            <button onClick={onCode} style={{ background:`linear-gradient(135deg, ${t.accent}, #0891b2)`, border:"none", borderRadius:9, padding:"8px 13px", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:font, whiteSpace:"nowrap", flexShrink:0 }}>Enter Code →</button>
          </div>
        </div>
      </div>
      <div style={{ padding:"18px 18px 0", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:11, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:19, fontWeight:700, color:t.accent, fontFamily:serif }}>{s.value}</div>
            <div style={{ fontSize:9, color:t.textSub, marginTop:3, lineHeight:1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ margin:"16px 18px 0", background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px", display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{ width:46, height:46, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg, ${t.accent}33, ${t.accentDim})`, border:`2px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👨‍⚕️</div>
        <div>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>Dr. DeLon Canterbury</div>
          <div style={{ color:t.accent, fontSize:10, fontWeight:500, marginBottom:5 }}>Geriatrician & Deprescribing Expert</div>
          <p style={{ color:t.textSub, fontSize:12, lineHeight:1.5, margin:"0 0 9px" }}>"The question isn't just what to take — it's what to stop."</p>
          <button onClick={onResources} style={{ background:"none", border:`1px solid ${t.accent}`, borderRadius:7, padding:"5px 11px", color:t.accent, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:font }}>Watch his talks →</button>
        </div>
      </div>
      <div style={{ margin:"18px 18px 0" }}>
        <SectionLabel t={t}>How It Works</SectionLabel>
        {[{ title:"Enter medications", desc:"Name, dose, frequency only — no PHI.", icon:"💊" },{ title:"Get a risk score", desc:"Checks polypharmacy, drug interactions, and high-risk combinations.", icon:"📊" },{ title:"Take action", desc:"Connect with a pharmacist for an official clinical review.", icon:"🩺" }].map(item => (
          <div key={item.title} style={{ display:"flex", gap:11, marginBottom:13, alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:t.surfaceAlt, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{item.icon}</div>
            <div><div style={{ fontWeight:600, fontSize:13, marginBottom:1 }}>{item.title}</div><div style={{ color:t.textSub, fontSize:12, lineHeight:1.5 }}>{item.desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Medication Autocomplete List ─────────────────────────────────────────────
const MED_LIST = [
  "Acetaminophen","Albuterol","Alendronate","Allopurinol","Alprazolam","Amlodipine","Amoxicillin",
  "Atenolol","Atorvastatin","Azithromycin","Benazepril","Bisoprolol","Carvedilol","Cephalexin",
  "Ciprofloxacin","Citalopram","Clonazepam","Clopidogrel","Cyclobenzaprine","Digoxin",
  "Diltiazem","Doxycycline","Duloxetine","Escitalopram","Esomeprazole","Finasteride","Fluoxetine",
  "Furosemide","Gabapentin","Glipizide","Hydrochlorothiazide","Hydrocodone","Hydroxychloroquine",
  "Ibuprofen","Insulin Glargine","Isosorbide","Lansoprazole","Levothyroxine","Lisinopril",
  "Loratadine","Lorazepam","Losartan","Lovastatin","Meloxicam","Metformin","Metoprolol",
  "Montelukast","Morphine","Naproxen","Omeprazole","Ondansetron","Oxycodone","Pantoprazole",
  "Potassium Chloride","Pravastatin","Prednisone","Propranolol","Rosuvastatin","Sertraline",
  "Simvastatin","Spironolactone","Tamsulosin","Tramadol","Trazodone","Venlafaxine",
  "Verapamil","Warfarin","Zolpidem","Aspirin","Amiodarone","Lithium","Methotrexate",
];

// ─── CHECKER ──────────────────────────────────────────────────────────────────
function CheckerScreen({ t, meds, setMeds, onResult }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("Once daily");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef();
  const freqs = ["Once daily","Twice daily","Three times daily","Four times daily","Every other day","Weekly","As needed"];
  const iS = inputStyle(t);

  const suggestions = name.trim().length >= 1
    ? MED_LIST.filter(m => m.toLowerCase().includes(name.toLowerCase()) && m.toLowerCase() !== name.toLowerCase()).slice(0, 6)
    : [];

  const addMed = (medName) => {
    const finalName = medName || name;
    if (!finalName.trim()) { setError("Please enter a medication name."); return; }
    setMeds(p => [...p, { id:Date.now(), name:finalName.trim(), dose:dose.trim()||"—", freq }]);
    setName(""); setDose(""); setError(""); setShowSuggestions(false); setHighlightIdx(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") addMed();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i-1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); highlightIdx >= 0 ? addMed(suggestions[highlightIdx]) : addMed(); }
    else if (e.key === "Escape") { setShowSuggestions(false); setHighlightIdx(-1); }
  };

  return (
    <div style={{ padding:"20px 18px" }}>
      <h2 style={{ fontFamily:serif, fontSize:22, fontWeight:400, margin:"0 0 3px" }}>Medication Checker</h2>
      <p style={{ color:t.textSub, fontSize:13, margin:"0 0 18px" }}>No names or identifying information needed.</p>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"14px", marginBottom:14 }}>
        <LabeledField label="Medication Name *" t={t}>
          <div style={{ position:"relative" }}>
            <input
              ref={inputRef}
              value={name}
              onChange={e => { setName(e.target.value); setError(""); setShowSuggestions(true); setHighlightIdx(-1); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Metformin, Lisinopril..."
              style={iS}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
                background:t.surface, border:`1px solid ${t.accent}66`,
                borderRadius:10, overflow:"hidden",
                boxShadow:`0 8px 24px rgba(0,0,0,0.25)`,
                animation:"fadeIn 0.1s ease",
              }}>
                {suggestions.map((s, i) => {
                  const matchStart = s.toLowerCase().indexOf(name.toLowerCase());
                  const before = s.slice(0, matchStart);
                  const match = s.slice(matchStart, matchStart + name.length);
                  const after = s.slice(matchStart + name.length);
                  return (
                    <div
                      key={s}
                      onMouseDown={() => addMed(s)}
                      style={{
                        padding:"9px 13px", cursor:"pointer", fontSize:13,
                        background: i === highlightIdx ? t.accentDim : "transparent",
                        borderBottom: i < suggestions.length-1 ? `1px solid ${t.border}` : "none",
                        display:"flex", alignItems:"center", gap:8,
                        transition:"background 0.1s",
                      }}
                    >
                      <span style={{ fontSize:12 }}>💊</span>
                      <span style={{ color:t.textSub }}>
                        {before}
                        <strong style={{ color:t.accent }}>{match}</strong>
                        {after}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </LabeledField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:4 }}>
          <LabeledField label="Dose" t={t}><input value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 500mg" style={iS} /></LabeledField>
          <LabeledField label="Frequency" t={t}><select value={freq} onChange={e => setFreq(e.target.value)} style={{ ...iS, appearance:"none", cursor:"pointer" }}>{freqs.map(f => <option key={f}>{f}</option>)}</select></LabeledField>
        </div>
        {error && <div style={{ color:t.danger, fontSize:12, marginBottom:8 }}>{error}</div>}
        <Btn t={t} variant="outline" onClick={() => addMed()}>+ Add Medication</Btn>
      </div>
      {meds.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <SectionLabel t={t}>Added ({meds.length})</SectionLabel>
          {meds.map((m,i) => (
            <div key={m.id} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:9, padding:"9px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, animation:"fadeIn 0.2s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:t.pillBg, color:t.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{i+1}</div>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div><div style={{ color:t.textSub, fontSize:11 }}>{m.dose} · {m.freq}</div></div>
              </div>
              <button onClick={() => setMeds(p => p.filter(x => x.id!==m.id))} style={{ background:"none", border:"none", color:t.textMuted, cursor:"pointer", fontSize:16, padding:4 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {meds.length >= 5 && <div style={{ background:t.warningDim, border:`1px solid ${t.warning}44`, borderRadius:9, padding:"9px 12px", marginBottom:12, display:"flex", gap:7, alignItems:"center" }}><span>⚠️</span><span style={{ color:t.warning, fontSize:12 }}>{meds.length} medications — polypharmacy threshold exceeded.</span></div>}
      <Btn t={t} disabled={meds.length===0} onClick={() => { const r = computeScore(meds); onResult({ ...r, medCount:meds.length }); }}>
        {meds.length===0 ? "Add medications to check" : `Analyze ${meds.length} Medication${meds.length!==1?"s":""} →`}
      </Btn>
      <p style={{ color:t.textMuted, fontSize:11, textAlign:"center", marginTop:7, lineHeight:1.5 }}>For informational purposes only.</p>
    </div>
  );
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────
function ResultsScreen({ t, result, meds, pricingTab, setPricingTab, onBack, onResources, onPurchase }) {
  const risk = riskLevel(result.score); const fg = t[risk.color]; const bg = t[risk.color+"Dim"];
  const [ds, setDs] = useState(0);
  useEffect(() => { let s=0; const id=setInterval(()=>{ s+=2; if(s>=result.score){setDs(result.score);clearInterval(id);}else setDs(s); },16); return()=>clearInterval(id); },[result.score]);
  const circ = 2*Math.PI*42;
  return (
    <div style={{ padding:"20px 18px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textSub, cursor:"pointer", fontSize:12, padding:0, marginBottom:14, fontFamily:font }}>← Edit medications</button>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"20px 16px", textAlign:"center", marginBottom:14, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${fg}, transparent)` }} />
        <svg width="96" height="96" viewBox="0 0 100 100" style={{ marginBottom:8 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke={t.border} strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={fg} strokeWidth="8" strokeDasharray={`${(ds/100)*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="45" textAnchor="middle" fill={t.text} fontSize="20" fontWeight="700" fontFamily="DM Sans">{ds}</text>
          <text x="50" y="60" textAnchor="middle" fill={t.textMuted} fontSize="9" fontFamily="DM Sans">/ 100</text>
        </svg>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:bg, borderRadius:20, padding:"5px 13px", marginBottom:7 }}>
          <span>{risk.emoji}</span><span style={{ color:fg, fontWeight:700, fontSize:13 }}>{risk.label}</span>
        </div>
        <div style={{ color:t.textSub, fontSize:12 }}>Based on <strong style={{ color:t.text }}>{result.medCount} medication{result.medCount!==1?"s":""}</strong></div>
      </div>
      {result.flags.length>0 && (
        <div style={{ marginBottom:13 }}>
          <SectionLabel t={t}>Risk Factors Detected</SectionLabel>
          {result.flags.map((f,i) => (
            <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderLeft:`3px solid ${t[f.type]}`, borderRadius:9, padding:"9px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:500 }}>{f.label}</span>
              <span style={{ background:t[f.type+"Dim"], color:t[f.type], borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:600 }}>{f.detail}</span>
            </div>
          ))}
        </div>
      )}
      {result.flags.length===0 && <div style={{ background:t.successDim, border:`1px solid ${t.success}44`, borderRadius:11, padding:"11px 13px", marginBottom:13, display:"flex", gap:8 }}><span>✅</span><div><div style={{ fontWeight:600, color:t.success, fontSize:13 }}>No major risk factors found</div><div style={{ color:t.textSub, fontSize:11, marginTop:2 }}>A clinical review can provide further peace of mind.</div></div></div>}
      {/* Pricing */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"18px 15px", marginBottom:13 }}>
        <div style={{ textAlign:"center", marginBottom:14 }}>
          <div style={{ fontFamily:serif, fontSize:19, fontWeight:400, marginBottom:3 }}>Get an Official Clinical Review</div>
          <p style={{ color:t.textSub, fontSize:12, lineHeight:1.5, margin:0 }}>A licensed pharmacist reviews every medication and coordinates with your physician.</p>
        </div>
        <div style={{ display:"flex", background:t.surfaceAlt, borderRadius:10, padding:3, marginBottom:14 }}>
          {[["monthly","Monthly"],["onetime","One-Time"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setPricingTab(k)} style={{ flex:1, border:"none", borderRadius:8, padding:"8px 0", background:pricingTab===k?t.accent:"transparent", color:pricingTab===k?"#fff":t.textSub, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:font, transition:"all 0.2s", position:"relative" }}>
              {lbl}{k==="monthly" && <span style={{ position:"absolute", top:-7, right:5, background:t.success, color:"#fff", fontSize:7, fontWeight:700, padding:"2px 4px", borderRadius:4, letterSpacing:0.4, textTransform:"uppercase" }}>Best</span>}
            </button>
          ))}
        </div>
        {pricingTab==="monthly" ? (
          <>
            <div style={{ textAlign:"center", marginBottom:11 }}><span style={{ fontFamily:serif, fontSize:34, fontWeight:400 }}>$29</span><span style={{ color:t.textSub, fontSize:13 }}>/month</span><div style={{ color:t.textMuted, fontSize:11, marginTop:1 }}>Cancel anytime</div></div>
            {["Full medication safety review","Ongoing monitoring & adjustments","Direct pharmacist messaging","Caregiver app access","Monthly score updates"].map(item => <div key={item} style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5, fontSize:12 }}><span style={{ color:t.success }}>✓</span><span style={{ color:t.textSub }}>{item}</span></div>)}
            <div style={{ marginTop:13 }}><Btn t={t} onClick={() => onPurchase("monthly")}>Start Monthly Plan →</Btn></div>
          </>
        ) : (
          <>
            <div style={{ textAlign:"center", marginBottom:11 }}><span style={{ fontFamily:serif, fontSize:34, fontWeight:400 }}>$79</span><span style={{ color:t.textSub, fontSize:13 }}> one-time</span><div style={{ color:t.textMuted, fontSize:11, marginTop:1 }}>Single comprehensive review</div></div>
            {["Full medication review & report","Interaction & risk analysis","Physician-ready recommendations","Email delivery of assessment"].map(item => <div key={item} style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5, fontSize:12 }}><span style={{ color:t.success }}>✓</span><span style={{ color:t.textSub }}>{item}</span></div>)}
            <div style={{ marginTop:13 }}><Btn t={t} onClick={() => onPurchase("onetime")}>Request One-Time Review →</Btn></div>
            <button onClick={() => setPricingTab("monthly")} style={{ width:"100%", background:"none", border:"none", color:t.accent, fontSize:11, marginTop:7, cursor:"pointer", fontFamily:font }}>Switch to monthly for ongoing monitoring ↓</button>
          </>
        )}
      </div>
      <div onClick={onResources} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:11, padding:"13px", cursor:"pointer", display:"flex", gap:11, alignItems:"center" }}>
        <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background:t.accentDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>▶</div>
        <div><div style={{ fontWeight:600, fontSize:13 }}>Learn from Dr. Canterbury</div><div style={{ color:t.textSub, fontSize:11, marginTop:1 }}>Videos on polypharmacy & deprescribing</div></div>
        <span style={{ color:t.textMuted, marginLeft:"auto" }}>›</span>
      </div>
    </div>
  );
}

// ─── PAYWALL (Mock Stripe) ────────────────────────────────────────────────────
function PaywallScreen({ t, planType, onBack, onComplete }) {
  const [cardNum, setCardNum] = useState(""); const [expiry, setExpiry] = useState(""); const [cvc, setCvc] = useState(""); const [name, setName] = useState(""); const [zip, setZip] = useState("");
  const [processing, setProcessing] = useState(false); const [done, setDone] = useState(false);
  const isMonthly = planType==="monthly";
  const fmtCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp = v => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?d.slice(0,2)+"/"+d.slice(2):d; };
  const ready = true; // Payment button always enabled for prototype
  const handlePay = () => { setProcessing(true); setTimeout(()=>{ setProcessing(false); setDone(true); setTimeout(onComplete,1200); },2200); };
  const iS = inputStyle(t);
  return (
    <div style={{ padding:"20px 18px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textSub, cursor:"pointer", fontSize:12, padding:0, marginBottom:14, fontFamily:font }}>← Back</button>
      {/* Order summary */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"14px 15px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
          <div><div style={{ fontWeight:700, fontSize:13 }}>{isMonthly?"LessMeds Monthly":"LessMeds One-Time Review"}</div><div style={{ color:t.textSub, fontSize:11, marginTop:1 }}>{isMonthly?"Ongoing medication monitoring":"Comprehensive single assessment"}</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontFamily:serif, fontSize:20, fontWeight:400 }}>{isMonthly?"$29":"$79"}</div><div style={{ color:t.textMuted, fontSize:10 }}>{isMonthly?"/month":"one-time"}</div></div>
        </div>
        <div style={{ borderTop:`1px solid ${t.border}`, paddingTop:9, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:t.textSub, fontSize:12 }}>Total due today</span>
          <span style={{ fontWeight:700, fontSize:15 }}>{isMonthly?"$29.00":"$79.00"}</span>
        </div>
      </div>
      {/* Card form */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"14px 15px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Payment Details</span>
          <div style={{ display:"flex", alignItems:"center", gap:4, background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:6, padding:"3px 8px" }}>
            <span style={{ fontSize:9, color:t.textMuted }}>Powered by</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#635BFF" }}>stripe</span>
          </div>
        </div>
        <LabeledField label="Card Number" t={t}>
          <div style={{ position:"relative" }}>
            <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" style={{ ...iS, paddingRight:60 }} maxLength={19} />
            <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:9, color:t.textMuted, fontWeight:700, letterSpacing:0.5 }}>VISA</span>
          </div>
        </LabeledField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <LabeledField label="Expiry" t={t}><input value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} placeholder="MM / YY" style={iS} maxLength={5} /></LabeledField>
          <LabeledField label="CVC" t={t}><input value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" style={iS} maxLength={4} type="password" /></LabeledField>
        </div>
        <LabeledField label="Cardholder Name" t={t}><input value={name} onChange={e => setName(e.target.value)} placeholder="Full name on card" style={iS} /></LabeledField>
        <LabeledField label="ZIP Code" t={t}><input value={zip} onChange={e => setZip(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="12345" style={iS} maxLength={5} /></LabeledField>
      </div>
      {done ? (
        <div style={{ background:t.successDim, border:`1px solid ${t.success}`, borderRadius:12, padding:"14px", textAlign:"center", animation:"slideUp 0.3s ease" }}>
          <div style={{ fontSize:24, marginBottom:4 }}>✅</div>
          <div style={{ color:t.success, fontWeight:700, fontSize:14 }}>Payment Successful!</div>
          <div style={{ color:t.textSub, fontSize:12, marginTop:2 }}>Redirecting you now...</div>
        </div>
      ) : (
        <button onClick={handlePay} disabled={processing||!ready} style={{ width:"100%", border:"none", borderRadius:11, padding:"13px 0", background:processing?t.accentDim:!ready?t.surfaceAlt:`linear-gradient(135deg, ${t.accent}, #0891b2)`, color:!ready?t.textMuted:"#fff", fontSize:14, fontWeight:600, cursor:processing?"wait":!ready?"not-allowed":"pointer", fontFamily:font, boxShadow:ready?`0 6px 20px ${t.accentGlow}`:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {processing ? <><span style={{ display:"inline-block", width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Processing...</> : `Pay ${isMonthly?"$29.00":"$79.00"} →`}
        </button>
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginTop:11 }}>
        <span style={{ fontSize:12 }}>🔒</span><span style={{ color:t.textMuted, fontSize:11 }}>256-bit SSL · HIPAA-compliant</span>
      </div>
    </div>
  );
}

// ─── PATIENT INFO (3-step) ────────────────────────────────────────────────────
function PatientInfoScreen({ t, planType, prefillMeds, onSubmit, onBack }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(""); const [age, setAge] = useState(""); const [conditions, setConditions] = useState([]);
  const [caregiverName, setCaregiverName] = useState(""); const [relationship, setRelationship] = useState(""); const [email, setEmail] = useState("");
  const iS = inputStyle(t);
  const toggleC = c => setConditions(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);
  const canSubmit = caregiverName.trim() && relationship && email.includes("@");
  const steps = ["Patient","Conditions","Your Info"];
  return (
    <div style={{ padding:"20px 18px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:t.textSub, cursor:"pointer", fontSize:12, padding:0, marginBottom:14, fontFamily:font }}>← Back</button>
      {/* Step progress */}
      <div style={{ display:"flex", gap:5, marginBottom:20, alignItems:"center" }}>
        {steps.map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, flex:i<2?"1":"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:step>i+1?t.success:step===i+1?t.accent:t.surfaceAlt, border:`2px solid ${step>i+1?t.success:step===i+1?t.accent:t.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:step>=i+1?"#fff":t.textMuted, transition:"all 0.3s", flexShrink:0 }}>
                {step>i+1?"✓":i+1}
              </div>
              <span style={{ fontSize:10, color:step===i+1?t.text:t.textMuted, fontWeight:step===i+1?600:400, whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i<2 && <div style={{ flex:1, height:2, background:step>i+1?t.success:t.border, borderRadius:1, transition:"background 0.3s" }} />}
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={{ animation:"slideUp 0.2s ease" }}>
          <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 4px" }}>About Your Patient</h2>
          <p style={{ color:t.textSub, fontSize:12, margin:"0 0 18px", lineHeight:1.5 }}>No last name, date of birth, or identifiers collected.</p>
          <LabeledField label="Patient First Name" t={t}><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Margaret" style={iS} /></LabeledField>
          <LabeledField label="Age" t={t}><input value={age} onChange={e => setAge(e.target.value.replace(/\D/g,"").slice(0,3))} placeholder="e.g. 78" style={iS} inputMode="numeric" /></LabeledField>
          {prefillMeds.length>0 && (
            <div style={{ background:t.accentDim, border:`1px solid ${t.accent}44`, borderRadius:10, padding:"11px 13px", marginBottom:18 }}>
              <div style={{ color:t.accent, fontWeight:600, fontSize:12, marginBottom:5 }}>✓ {prefillMeds.length} medications pre-filled from your checker</div>
              {prefillMeds.slice(0,3).map(m => <div key={m.id} style={{ color:t.textSub, fontSize:11, marginBottom:2 }}>• {m.name} — {m.dose} · {m.freq}</div>)}
              {prefillMeds.length>3 && <div style={{ color:t.textMuted, fontSize:11 }}>+{prefillMeds.length-3} more</div>}
            </div>
          )}
          <Btn t={t} disabled={!firstName.trim()||!age} onClick={() => setStep(2)}>Next: Add Conditions →</Btn>
        </div>
      )}

      {step===2 && (
        <div style={{ animation:"slideUp 0.2s ease" }}>
          <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 4px" }}>Primary Conditions</h2>
          <p style={{ color:t.textSub, fontSize:12, margin:"0 0 14px", lineHeight:1.5 }}>Select all that apply — helps the pharmacist prioritize their review.</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => toggleC(c)} style={{ background:conditions.includes(c)?t.accentDim:t.surfaceAlt, border:`1px solid ${conditions.includes(c)?t.accent:t.border}`, borderRadius:18, padding:"5px 11px", color:conditions.includes(c)?t.accent:t.textSub, fontSize:12, fontWeight:conditions.includes(c)?600:400, cursor:"pointer", fontFamily:font, transition:"all 0.15s" }}>
                {conditions.includes(c)?"✓ ":""}{c}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn t={t} variant="ghost" onClick={() => setStep(1)} style={{ flex:1, padding:"12px 0" }} fullWidth={false}>← Back</Btn>
            <Btn t={t} onClick={() => setStep(3)} style={{ flex:2, padding:"12px 0" }} fullWidth={false}>Next →</Btn>
          </div>
        </div>
      )}

      {step===3 && (
        <div style={{ animation:"slideUp 0.2s ease" }}>
          <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 4px" }}>Your Information</h2>
          <p style={{ color:t.textSub, fontSize:12, margin:"0 0 16px", lineHeight:1.5 }}>Your email is used to deliver results — never shared or sold.</p>
          <LabeledField label="Your Name" t={t}><input value={caregiverName} onChange={e => setCaregiverName(e.target.value)} placeholder="Your full name" style={iS} /></LabeledField>
          <LabeledField label="Relationship to Patient" t={t}>
            <select value={relationship} onChange={e => setRelationship(e.target.value)} style={{ ...iS, appearance:"none", cursor:"pointer" }}>
              <option value="">Select relationship...</option>
              {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Email Address" t={t}><input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={iS} /></LabeledField>
          <div style={{ background:t.accentDim, border:`1px solid ${t.accent}33`, borderRadius:9, padding:"9px 12px", marginBottom:18, display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:13 }}>🔒</span><span style={{ color:t.textSub, fontSize:11 }}>Delivered securely to this address. HIPAA-compliant. BAA available on request.</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn t={t} variant="ghost" onClick={() => setStep(2)} style={{ flex:1, padding:"12px 0" }} fullWidth={false}>← Back</Btn>
            <Btn t={t} disabled={!canSubmit} onClick={() => onSubmit({ firstName, age, conditions, caregiverName, relationship, email, meds:prefillMeds })} style={{ flex:2, padding:"12px 0" }} fullWidth={false}>
              {planType==="monthly"?"Start My Plan →":"Submit for Review →"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBMITTED / PENDING ──────────────────────────────────────────────────────
function SubmittedScreen({ t, patientInfo, assessmentReady, onViewAssessment }) {
  const statusSteps = [
    { label:"Submitted", detail:"Received by LessMeds", done:true },
    { label:"Assigned", detail:"Pharmacist assigned to case", done:true },
    { label:"In Review", detail:"Medication analysis underway", done:assessmentReady },
    { label:"Complete", detail:assessmentReady?`Sent to ${patientInfo?.email}`:"Assessment delivered to your email", done:assessmentReady },
  ];
  return (
    <div style={{ padding:"26px 18px" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ width:68, height:68, borderRadius:"50%", background:t.accentDim, border:`2px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 14px" }}>
          {assessmentReady?"✅":"📋"}
        </div>
        <h2 style={{ fontFamily:serif, fontSize:21, fontWeight:400, margin:"0 0 8px" }}>{assessmentReady?"Your Assessment is Ready!":"Review Submitted!"}</h2>
        <p style={{ color:t.textSub, fontSize:13, lineHeight:1.6, margin:0 }}>
          {assessmentReady ? `Your assessment for ${patientInfo?.firstName} has been emailed to ${patientInfo?.email}. View it in the Assessment tab.` : `Your review for ${patientInfo?.firstName} has been received. A licensed pharmacist will complete it within 24–48 hours.`}
        </p>
      </div>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px", marginBottom:18 }}>
        <SectionLabel t={t}>Review Status</SectionLabel>
        {statusSteps.map((s,i) => (
          <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:i<3?12:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:s.done?t.successDim:t.surfaceAlt, border:`2px solid ${s.done?t.success:t.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:s.done?t.success:t.textMuted, flexShrink:0, transition:"all 0.5s" }}>{s.done?"✓":i+1}</div>
              {i<3 && <div style={{ width:2, height:12, background:s.done?t.success:t.border, margin:"2px 0", transition:"background 0.5s" }} />}
            </div>
            <div style={{ paddingTop:1 }}>
              <div style={{ fontWeight:600, fontSize:12, color:s.done?t.text:t.textMuted }}>{s.label}</div>
              <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {assessmentReady ? (
        <Btn t={t} onClick={onViewAssessment}>View My Assessment →</Btn>
      ) : (
        <div style={{ background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:11, padding:"13px", display:"flex", gap:9, alignItems:"center" }}>
          <span style={{ display:"inline-block", width:16, height:16, border:`2px solid ${t.border}`, borderTopColor:t.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
          <div><div style={{ fontWeight:600, fontSize:13 }}>Pharmacist review in progress</div><div style={{ color:t.textSub, fontSize:11, marginTop:1 }}>Expected within 24–48 hours. You'll be notified here and by email.</div></div>
        </div>
      )}
      <div style={{ marginTop:14, padding:"11px 13px", background:t.accentDim, border:`1px solid ${t.accent}33`, borderRadius:10 }}>
        <div style={{ color:t.accent, fontWeight:600, fontSize:12, marginBottom:2 }}>📧 Confirmation sent</div>
        <div style={{ color:t.textSub, fontSize:11 }}>Check {patientInfo?.email} for your submission receipt.</div>
      </div>
    </div>
  );
}

// ─── ASSESSMENT ───────────────────────────────────────────────────────────────
function AssessmentScreen({ t, patientInfo, result, meds, assessmentReady }) {
  if (!assessmentReady) {
    return (
      <div style={{ padding:"40px 18px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:14 }}>⏳</div>
        <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 8px" }}>Assessment In Progress</h2>
        <p style={{ color:t.textSub, fontSize:13, lineHeight:1.6 }}>Your pharmacist is reviewing {patientInfo?.firstName}'s medications. You'll receive an email notification when it's ready.</p>
      </div>
    );
  }
  const risk = result ? riskLevel(result.score) : { label:"Moderate Risk", color:"warning", emoji:"🟡" };
  const fg = t[risk.color]; const bg = t[risk.color+"Dim"]; const score = result?.score ?? 58;
  const circ = 2*Math.PI*42;
  const usedMeds = meds.length ? meds : [{ id:1, name:"Metformin" },{ id:2, name:"Lisinopril" },{ id:3, name:"Aspirin 81mg" }];
  const recs = [
    { drug:usedMeds[0]?.name||"Metformin", action:"Continue", priority:"low", note:"Well-tolerated and appropriate for current indication. No changes recommended at this time." },
    { drug:usedMeds[1]?.name||"Lisinopril", action:"Monitor", priority:"medium", note:"Consider electrolyte panel at next visit. Potassium levels should be checked given current combination." },
    { drug:usedMeds[2]?.name||"Aspirin 81mg", action:"Deprescribe", priority:"high", note:"Risk-benefit ratio unfavorable given current anticoagulant. Recommend discontinuation after physician review." },
  ];
  return (
    <div style={{ padding:"20px 18px", paddingBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <h2 style={{ fontFamily:serif, fontSize:20, fontWeight:400, margin:"0 0 2px" }}>Clinical Assessment</h2>
          <div style={{ color:t.textSub, fontSize:12 }}>Patient: <strong style={{ color:t.text }}>{patientInfo?.firstName}</strong> · Age {patientInfo?.age}</div>
        </div>
        <div style={{ background:t.successDim, border:`1px solid ${t.success}`, borderRadius:8, padding:"4px 8px", color:t.success, fontSize:10, fontWeight:700 }}>✓ Complete</div>
      </div>
      {/* Score card */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"14px", marginBottom:14, display:"flex", gap:12, alignItems:"center" }}>
        <svg width="68" height="68" viewBox="0 0 100 100" style={{ flexShrink:0 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke={t.border} strokeWidth="9" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={fg} strokeWidth="9" strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="46" textAnchor="middle" fill={t.text} fontSize="22" fontWeight="700" fontFamily="DM Sans">{score}</text>
          <text x="50" y="62" textAnchor="middle" fill={t.textMuted} fontSize="10" fontFamily="DM Sans">/100</text>
        </svg>
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:bg, borderRadius:16, padding:"4px 10px", marginBottom:5 }}><span>{risk.emoji}</span><span style={{ color:fg, fontWeight:700, fontSize:12 }}>{risk.label}</span></div>
          <div style={{ color:t.textSub, fontSize:12, lineHeight:1.4 }}>Reviewed by <strong style={{ color:t.text }}>Pharm. S. Chen, PharmD</strong></div>
          <div style={{ color:t.textMuted, fontSize:11, marginTop:1 }}>Completed {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      </div>
      {/* Summary */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"13px 14px", marginBottom:14 }}>
        <SectionLabel t={t}>Clinical Summary</SectionLabel>
        <p style={{ color:t.textSub, fontSize:12, lineHeight:1.6, margin:0 }}>
          {patientInfo?.firstName}'s medication regimen shows {risk.label.toLowerCase()} for polypharmacy-related adverse events.{result?.flags?.length>0?` ${result.flags.length} risk factor${result.flags.length!==1?"s":""} were identified, including potential drug interactions.`:" No major drug interactions were identified."} We recommend discussing the deprescribing opportunities below with the prescribing physician.
        </p>
      </div>
      {/* Recs */}
      <SectionLabel t={t}>Pharmacist Recommendations</SectionLabel>
      {recs.map((rec,i) => {
        const pc = rec.priority==="high"?"danger":rec.priority==="medium"?"warning":"success";
        return (
          <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderLeft:`3px solid ${t[pc]}`, borderRadius:10, padding:"11px 13px", marginBottom:9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontWeight:600, fontSize:13 }}>{rec.drug}</span>
              <span style={{ background:t[pc+"Dim"], color:t[pc], borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:700 }}>{rec.action}</span>
            </div>
            <p style={{ color:t.textSub, fontSize:12, lineHeight:1.5, margin:0 }}>{rec.note}</p>
          </div>
        );
      })}
      {/* Pharmacist note */}
      <div style={{ background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:12, padding:"13px", marginTop:4, marginBottom:14 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:t.accentDim, border:`1px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>💊</div>
          <div><div style={{ fontWeight:600, fontSize:12 }}>Pharm. S. Chen, PharmD</div><div style={{ color:t.accent, fontSize:10 }}>Clinical Pharmacist · LessMeds</div></div>
        </div>
        <p style={{ color:t.textSub, fontSize:12, lineHeight:1.5, margin:0 }}>
          "I've reviewed {patientInfo?.firstName}'s full medication list. Please bring this report to your next physician appointment for a shared decision-making discussion about these recommendations."
        </p>
      </div>
      <div style={{ background:t.accentDim, border:`1px solid ${t.accent}33`, borderRadius:10, padding:"11px 13px", display:"flex", gap:7, alignItems:"center" }}>
        <span style={{ fontSize:15 }}>📧</span>
        <div><div style={{ color:t.accent, fontWeight:600, fontSize:12 }}>Full report emailed</div><div style={{ color:t.textSub, fontSize:11, marginTop:1 }}>Sent to {patientInfo?.email} — printable PDF included.</div></div>
      </div>
    </div>
  );
}

// ─── FULL APP (Monthly) ───────────────────────────────────────────────────────
// ─── FULL APP THEMES (original caregiver app) ────────────────────────────────
const FA_THEMES = {
  dark: {
    appBg:"#060b14", headerBg:"#0a1628", cardBg:"#0a1628", cardBg2:"#0f172a", inputBg:"#0f172a",
    border:"#1e293b", textPrimary:"#f1f5f9", textSecondary:"#94a3b8", textMuted:"#64748b",
    accent:"#06b6d4", accentBg:"rgba(6,182,212,0.15)", success:"#22c55e", successBg:"#052e16",
    warning:"#f59e0b", warningBg:"#1c1200", danger:"#ef4444", dangerBg:"#1c0002",
    dangerText:"#fca5a5", warningText:"#fcd34d", successText:"#86efac",
    navBg:"#0a1628", navBorder:"#1e293b", navActive:"#06b6d4", navInactive:"#64748b",
    msgOut:"#06b6d4", msgOutText:"#000000", msgIn:"#1e293b", msgInText:"#f1f5f9",
    pillBg:"#1e293b", pillText:"#94a3b8", statusBar:"#060b14", progressTrack:"#1e293b",
    btnPrimary:"#06b6d4", btnPrimaryText:"#000000",
  },
  light: {
    appBg:"#f0f4f8", headerBg:"#ffffff", cardBg:"#ffffff", cardBg2:"#f8fafc", inputBg:"#f8fafc",
    border:"#e2e8f0", textPrimary:"#0f172a", textSecondary:"#475569", textMuted:"#94a3b8",
    accent:"#0369a1", accentBg:"rgba(3,105,161,0.1)", success:"#16a34a", successBg:"#f0fdf4",
    warning:"#d97706", warningBg:"#fffbeb", danger:"#dc2626", dangerBg:"#fef2f2",
    dangerText:"#dc2626", warningText:"#b45309", successText:"#15803d",
    navBg:"#ffffff", navBorder:"#e2e8f0", navActive:"#0369a1", navInactive:"#94a3b8",
    msgOut:"#0369a1", msgOutText:"#ffffff", msgIn:"#f1f5f9", msgInText:"#0f172a",
    pillBg:"#f1f5f9", pillText:"#475569", statusBar:"#ffffff", progressTrack:"#e2e8f0",
    btnPrimary:"#0369a1", btnPrimaryText:"#ffffff",
  },
};

const FA_MOCK_ALERTS = [
  { id:"a1", type:"critical", msg:"Warfarin + Aspirin interaction flagged", time:"2 hrs ago" },
  { id:"a2", type:"warning", msg:"3 missed doses this week", time:"Today" },
  { id:"a3", type:"info", msg:"Review scheduled for Feb 25", time:"Yesterday" },
];
const FA_MOCK_MESSAGES_INIT = [
  { id:"msg1", from:"Dr. Patel", text:"Please ensure your patient takes Lisinopril with food.", time:"10:22 AM", outgoing:false },
  { id:"msg2", from:"You", text:"Understood. Will give it now.", time:"10:30 AM", outgoing:true },
  { id:"msg3", from:"Pharm. Chen", text:"Watch for swelling or shortness of breath with the Warfarin + Aspirin combination.", time:"11:05 AM", outgoing:false },
];
const FA_SYMPTOM_OPTIONS = ["Dizziness","Nausea","Fatigue","Shortness of breath","Swelling","Confusion","Headache","Chest pain","Rash","Other"];
const FA_APPOINTMENTS = [
  { id:"ap1", title:"Medication Review", doctor:"Dr. Patel", date:"Feb 25, 2026", time:"2:00 PM", location:"Room 204" },
  { id:"ap2", title:"Pharmacist Consult", doctor:"Pharm. Chen", date:"Mar 4, 2026", time:"10:00 AM", location:"Pharmacy Clinic" },
];

function FALogo({ th }) {
  const isLight = th === "light";
  const cL = isLight ? "#0369a1" : "#06b6d4";
  const cR = isLight ? "#0ea5e9" : "#0e7490";
  const arr = isLight ? "#0369a1" : "#06b6d4";
  const dash = isLight ? "#f8fafc" : "#060b14";
  const txt = isLight ? "#0f172a" : "#f1f5f9";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
        <path d="M3 13 C3 8 6 4 10 4 L14 4 L14 22 L10 22 C6 22 3 18 3 13 Z" fill={cL}/>
        <path d="M14 4 L18 4 C22 4 25 8 25 13 C25 18 22 22 18 22 L14 22 Z" fill={cR}/>
        <line x1="14" y1="4" x2="14" y2="22" stroke={dash} strokeWidth="1.2" strokeDasharray="1.5 1.5"/>
        <path d="M14 25 L14 29" stroke={arr} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 27 L14 32 L18 27" stroke={arr} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:14, color:txt, letterSpacing:"-0.3px", lineHeight:1 }}>Less</div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:300, fontSize:10, color:arr, letterSpacing:"2px", lineHeight:1, marginTop:1 }}>MEDS</div>
      </div>
    </div>
  );
}

function FullAppScreen({ patientInfo, result, prefillMeds, onLogout }) {
  const [faTheme, setFaTheme] = useState("dark");
  const ft = FA_THEMES[faTheme];
  const [faScreen, setFaScreen] = useState("home");
  const [faMeds, setFaMeds] = useState(() => {
    if (prefillMeds && prefillMeds.length) {
      const colors = ["#ef4444","#3b82f6","#8b5cf6","#f59e0b","#06b6d4","#22c55e","#ec4899"];
      return prefillMeds.map((m, i) => ({ id: m.id || "m"+i, name: m.name, dose: m.dose || "—", time: "8:00 AM", taken: false, color: colors[i % colors.length] }));
    }
    return [
      { id:"m1", name:"Warfarin", dose:"5mg", time:"8:00 AM", taken:true, color:"#ef4444" },
      { id:"m2", name:"Metformin", dose:"1000mg", time:"8:00 AM", taken:true, color:"#3b82f6" },
      { id:"m3", name:"Lisinopril", dose:"10mg", time:"8:00 AM", taken:false, color:"#8b5cf6" },
      { id:"m4", name:"Aspirin", dose:"81mg", time:"12:00 PM", taken:false, color:"#f59e0b" },
      { id:"m5", name:"Atorvastatin", dose:"40mg", time:"8:00 PM", taken:false, color:"#06b6d4" },
      { id:"m6", name:"Potassium", dose:"20mEq", time:"8:00 AM", taken:false, color:"#22c55e" },
    ];
  });
  const [faSymptoms, setFaSymptoms] = useState([]);
  const [showSymForm, setShowSymForm] = useState(false);
  const [selSymptoms, setSelSymptoms] = useState([]);
  const [symNotes, setSymNotes] = useState("");
  const [faMessages, setFaMessages] = useState(patientInfo?.ehrImported && patientInfo?.messages ? patientInfo.messages : FA_MOCK_MESSAGES_INIT);
  const [faMsgInput, setFaMsgInput] = useState("");
  const [faToasts, setFaToasts] = useState([]);

  const takenCount = faMeds.filter(m => m.taken).length;
  const score = result?.score ?? 82;
  const patientName = patientInfo?.firstName ? `${patientInfo.firstName}` : "Eleanor";
  const patientAge = patientInfo?.age ?? 78;

  function faToast(msg, type="success") {
    const id = Date.now();
    setFaToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setFaToasts(p => p.filter(x => x.id !== id)), 3000);
  }
  function markTaken(id) {
    const med = faMeds.find(m => m.id === id);
    setFaMeds(p => p.map(m => m.id !== id ? m : { ...m, taken:true }));
    faToast(`${med?.name} marked as taken ✓`);
  }
  function logSymptoms() {
    if (!selSymptoms.length) return;
    const entry = { id:Date.now(), symptoms:selSymptoms, notes:symNotes, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), date:new Date().toLocaleDateString() };
    setFaSymptoms(p => [entry, ...p]);
    setSelSymptoms([]); setSymNotes(""); setShowSymForm(false);
    faToast("Symptoms reported to care team", "info");
  }
  function sendMessage() {
    if (!faMsgInput.trim()) return;
    setFaMessages(p => [...p, { id:Date.now(), from:"You", text:faMsgInput, time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}), outgoing:true }]);
    setFaMsgInput("");
    faToast("Message sent securely");
  }

  const navItems = [
    { id:"home", icon:"⬡", label:"Home" },
    { id:"meds", icon:"◎", label:"Meds" },
    { id:"symptoms", icon:"♥", label:"Symptoms" },
    { id:"messages", icon:"◈", label:"Messages" },
    { id:"resources", icon:"▶", label:"Resources" },
    { id:"settings", icon:"◍", label:"Settings" },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:ft.appBg, transition:"background 0.3s", fontFamily:"'DM Sans',sans-serif", borderRadius:34 }}>
      {/* Header */}
      <div style={{ padding:"10px 20px 12px", background:ft.headerBg, borderBottom:`1px solid ${ft.border}`, flexShrink:0, boxShadow:faTheme==="light"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <FALogo th={faTheme} />
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:score>=71?ft.danger:score>=41?ft.warning:ft.success }}/>
            <div style={{ fontSize:13, fontWeight:700, color:score>=71?ft.danger:score>=41?ft.warning:ft.success }}>Score: {score}</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:ft.textSecondary, marginTop:3 }}>{patientName} · Age {patientAge}</div>
        {patientInfo?.ehrImported && <div style={{ fontSize:10, color:ft.success, marginTop:2, display:"flex", alignItems:"center", gap:4 }}><span>🏥</span>{patientInfo.physician} · EHR Connected</div>}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:(faScreen==="messages"||faScreen==="resources")?0:14, background:ft.appBg, scrollbarWidth:"none" }}>
        {faScreen==="home" && (
          <FAHomeScreen ft={ft} faMeds={faMeds} takenCount={takenCount} alerts={patientInfo?.ehrImported && patientInfo?.alerts ? patientInfo.alerts : FA_MOCK_ALERTS} onNavigate={setFaScreen} onMarkTaken={markTaken} score={score} appointments={FA_APPOINTMENTS} />
        )}
        {faScreen==="meds" && <FAMedsScreen ft={ft} faMeds={faMeds} onMark={markTaken} />}
        {faScreen==="symptoms" && (
          <FASymptomsScreen ft={ft} symptoms={faSymptoms} show={showSymForm} setShow={setShowSymForm}
            selected={selSymptoms} setSelected={setSelSymptoms} notes={symNotes} setNotes={setSymNotes}
            onLog={logSymptoms} options={FA_SYMPTOM_OPTIONS} />
        )}
        {faScreen==="messages" && (
          <FAMessagesScreen ft={ft} messages={faMessages} msgInput={faMsgInput} setMsgInput={setFaMsgInput} onSend={sendMessage} />
        )}
        {faScreen==="settings" && <FASettingsScreen ft={ft} faTheme={faTheme} setFaTheme={setFaTheme} patientName={patientName} patientAge={patientAge} caregiverName={patientInfo?.caregiverName || "Caregiver"} onLogout={onLogout} />}
        {faScreen==="resources" && <FAResourcesScreen ft={ft} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ height:68, background:ft.navBg, borderTop:`1px solid ${ft.navBorder}`, display:"flex", flexShrink:0, boxShadow:faTheme==="light"?"0 -1px 4px rgba(0,0,0,0.06)":"none" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setFaScreen(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"transparent", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontSize:15, opacity:faScreen===n.id?1:0.4, transition:"opacity 0.15s" }}>{n.icon}</span>
            <span style={{ fontSize:9, letterSpacing:0.5, textTransform:"uppercase", fontWeight:600, color:faScreen===n.id?ft.navActive:ft.navInactive, transition:"color 0.15s" }}>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Toasts */}
      <div style={{ position:"absolute", top:120, left:16, right:16, display:"flex", flexDirection:"column", gap:8, zIndex:20, pointerEvents:"none" }}>
        {faToasts.map(toast => (
          <div key={toast.id} style={{ padding:"10px 14px", borderRadius:10, background:toast.type==="success"?ft.successBg:ft.cardBg, border:`1px solid ${toast.type==="success"?ft.success:ft.border}`, color:ft.textPrimary, fontSize:12, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", animation:"slideDown 0.3s ease" }}>
            {toast.type==="success"?"✅ ":"ℹ️ "}{toast.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// Full App sub-screens
function FAHomeScreen({ ft, faMeds, takenCount, alerts, onNavigate, onMarkTaken, score, appointments }) {
  const nextMed = faMeds.find(m => !m.taken);
  const scoreColor = score>=71?ft.danger:score>=41?ft.warning:ft.success;
  return (
    <div>
      {/* Progress Ring */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:ft.cardBg, border:`1px solid ${ft.border}`, borderRadius:16, padding:14, marginBottom:12, boxShadow:ft.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <svg width={60} height={60} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke={ft.progressTrack} strokeWidth="5"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke={ft.success} strokeWidth="5"
            strokeDasharray={`${(takenCount/Math.max(faMeds.length,1))*163} 163`}
            strokeLinecap="round" transform="rotate(-90 32 32)"/>
          <text x="32" y="36" textAnchor="middle" fill={ft.textPrimary} fontSize="13" fontWeight="700" fontFamily="monospace">{takenCount}/{faMeds.length}</text>
        </svg>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:ft.textPrimary }}>Today's Progress</div>
          <div style={{ fontSize:12, color:ft.success, marginTop:2 }}>{takenCount} taken</div>
          <div style={{ fontSize:12, color:ft.textMuted }}>{faMeds.length - takenCount} remaining</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <div style={{ fontSize:10, color:ft.textMuted }}>Risk</div>
          <div style={{ fontSize:20, fontWeight:700, color:scoreColor }}>{score}</div>
        </div>
      </div>
      {/* Alerts */}
      {alerts.slice(0,2).map(a => (
        <div key={a.id} style={{ padding:"9px 12px", borderRadius:11, marginBottom:9, display:"flex", gap:9, alignItems:"flex-start", background:a.type==="critical"?ft.dangerBg:a.type==="warning"?ft.warningBg:ft.cardBg, border:`1px solid ${a.type==="critical"?ft.danger+"44":a.type==="warning"?ft.warning+"44":ft.border}` }}>
          <span style={{ fontSize:13 }}>{a.type==="critical"?"🔴":a.type==="warning"?"🟡":"🔵"}</span>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:a.type==="critical"?ft.dangerText:a.type==="warning"?ft.warningText:ft.accent }}>{a.msg}</div>
            <div style={{ fontSize:10, color:ft.textMuted, marginTop:2 }}>{a.time}</div>
          </div>
        </div>
      ))}
      {/* Next Med */}
      {nextMed && (
        <div style={{ background:ft.cardBg, border:`1px solid ${ft.accent}44`, borderRadius:14, padding:14, marginBottom:12 }}>
          <div style={{ fontSize:10, color:ft.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Next Medication</div>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:nextMed.color+"22", border:`1px solid ${nextMed.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>💊</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:ft.textPrimary }}>{nextMed.name}</div>
              <div style={{ fontSize:11, color:ft.textSecondary }}>{nextMed.dose} · {nextMed.time}</div>
            </div>
            <button onClick={() => onMarkTaken(nextMed.id)} style={{ padding:"6px 12px", borderRadius:9, border:"none", background:ft.btnPrimary, color:ft.btnPrimaryText, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Mark Taken</button>
          </div>
        </div>
      )}
      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
        {[
          { label:"Log Symptoms", icon:"♥", screen:"symptoms", color:ft.danger },
          { label:"Message Team", icon:"◈", screen:"messages", color:ft.accent },
          { label:"All Meds", icon:"◎", screen:"meds", color:ft.success },
          { label:"Settings", icon:"◍", screen:"settings", color:ft.textSecondary },
        ].map(a => (
          <button key={a.label} onClick={() => onNavigate(a.screen)} style={{ padding:"13px 11px", borderRadius:13, border:`1px solid ${a.color}33`, background:`${a.color}11`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
            <div style={{ fontSize:19, marginBottom:5 }}>{a.icon}</div>
            <div style={{ fontSize:11, fontWeight:600, color:a.color }}>{a.label}</div>
          </button>
        ))}
      </div>
      {/* Appointments */}
      <div style={{ fontSize:11, color:ft.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:9 }}>Upcoming</div>
      {appointments.map(ap => (
        <div key={ap.id} style={{ background:ft.cardBg, border:`1px solid ${ft.border}`, borderRadius:12, padding:"11px 13px", marginBottom:8, display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ width:36, height:36, borderRadius:9, background:ft.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:ft.textPrimary }}>{ap.title}</div>
            <div style={{ fontSize:11, color:ft.textSecondary, marginTop:1 }}>{ap.doctor} · {ap.date} at {ap.time}</div>
            <div style={{ fontSize:10, color:ft.textMuted, marginTop:1 }}>{ap.location}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FAMedsScreen({ ft, faMeds, onMark }) {
  const times = [...new Set(faMeds.map(m => m.time))];
  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:ft.textPrimary, marginBottom:14 }}>Medication List</div>
      {times.map(time => (
        <div key={time} style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:ft.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📅 {time}</div>
          {faMeds.filter(m => m.time===time).map(m => (
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 13px", borderRadius:11, background:ft.cardBg, border:`1px solid ${m.taken?ft.success+"44":ft.border}`, marginBottom:7, opacity:m.taken?0.7:1 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:m.color+"22", border:`1px solid ${m.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:14 }}>💊</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:ft.textPrimary }}>{m.name}</div>
                <div style={{ fontSize:11, color:ft.textSecondary, marginTop:1 }}>{m.dose}</div>
                {m.flag && <div style={{ fontSize:10, color:m.flag.startsWith("🔴")?ft.danger:ft.warning, marginTop:3, lineHeight:1.4 }}>{m.flag}</div>}
              </div>
              {m.taken ? <span style={{ fontSize:17 }}>✅</span> : (
                <button onClick={() => onMark(m.id)} style={{ padding:"5px 11px", borderRadius:8, border:`1px solid ${ft.accent}`, background:ft.accentBg, color:ft.accent, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Take</button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FASymptomsScreen({ ft, symptoms, show, setShow, selected, setSelected, notes, setNotes, onLog, options }) {
  function toggle(s) { setSelected(p => p.includes(s) ? p.filter(x => x!==s) : [...p, s]); }
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, color:ft.textPrimary }}>Symptom Log</div>
        <button onClick={() => setShow(true)} style={{ padding:"5px 13px", borderRadius:8, border:`1px solid ${ft.accent}`, background:ft.accentBg, color:ft.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Report</button>
      </div>
      {show && (
        <div style={{ background:ft.cardBg, border:`1px solid ${ft.border}`, borderRadius:14, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:ft.textPrimary, marginBottom:11 }}>Report Symptoms</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:11 }}>
            {options.map(s => (
              <button key={s} onClick={() => toggle(s)} style={{ padding:"4px 9px", borderRadius:18, border:`1px solid ${selected.includes(s)?ft.accent:ft.border}`, background:selected.includes(s)?ft.accentBg:"transparent", color:selected.includes(s)?ft.accent:ft.textSecondary, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s}</button>
            ))}
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={2}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${ft.border}`, background:ft.inputBg, color:ft.textPrimary, fontSize:12, fontFamily:"'DM Sans',sans-serif", resize:"none", boxSizing:"border-box", outline:"none" }}/>
          <div style={{ display:"flex", gap:8, marginTop:9 }}>
            <button onClick={() => setShow(false)} style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${ft.border}`, background:"transparent", color:ft.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={onLog} style={{ flex:2, padding:"8px", borderRadius:8, border:"none", background:ft.btnPrimary, color:ft.btnPrimaryText, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Submit to Care Team</button>
          </div>
        </div>
      )}
      {symptoms.length === 0 && !show && <div style={{ textAlign:"center", padding:"36px 0", color:ft.textMuted, fontSize:13 }}>No symptoms logged yet.<br/>Tap + Report to log symptoms.</div>}
      {symptoms.map(s => (
        <div key={s.id} style={{ background:ft.cardBg, border:`1px solid ${ft.border}`, borderRadius:11, padding:13, marginBottom:9 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontSize:10, color:ft.textMuted }}>{s.date} · {s.time}</span>
            <span style={{ fontSize:10, color:ft.warning }}>Reported to care team</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {s.symptoms.map(sym => <span key={sym} style={{ padding:"2px 7px", borderRadius:18, background:ft.pillBg, color:ft.pillText, fontSize:10 }}>{sym}</span>)}
          </div>
          {s.notes && <div style={{ marginTop:7, fontSize:11, color:ft.textMuted, fontStyle:"italic" }}>{s.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function FAMessagesScreen({ ft, messages, msgInput, setMsgInput, onSend }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"11px 16px", borderBottom:`1px solid ${ft.border}`, background:ft.headerBg, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:ft.textPrimary }}>Secure Messaging</div>
        <div style={{ fontSize:10, color:ft.success, marginTop:1 }}>🔒 End-to-end encrypted · No PHI in notifications</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:9, background:ft.appBg, scrollbarWidth:"none" }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.outgoing?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"80%", padding:"9px 13px", borderRadius:m.outgoing?"16px 4px 16px 16px":"4px 16px 16px 16px", background:m.outgoing?ft.msgOut:ft.msgIn, color:m.outgoing?ft.msgOutText:ft.msgInText }}>
              {!m.outgoing && <div style={{ fontSize:9, fontWeight:700, color:ft.accent, marginBottom:2 }}>{m.from}</div>}
              <div style={{ fontSize:12, lineHeight:1.4 }}>{m.text}</div>
              <div style={{ fontSize:9, color:m.outgoing?`${ft.msgOutText}88`:ft.textMuted, marginTop:2, textAlign:"right" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:11, borderTop:`1px solid ${ft.border}`, background:ft.headerBg, display:"flex", gap:7, flexShrink:0 }}>
        <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key==="Enter" && onSend()}
          placeholder="Secure message..." style={{ flex:1, padding:"9px 13px", borderRadius:22, border:`1px solid ${ft.border}`, background:ft.inputBg, color:ft.textPrimary, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
        <button onClick={onSend} style={{ width:38, height:38, borderRadius:"50%", border:"none", background:ft.btnPrimary, color:ft.btnPrimaryText, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>→</button>
      </div>
    </div>
  );
}

function FASettingsScreen({ ft, faTheme, setFaTheme, patientName, patientAge, caregiverName, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:ft.textPrimary, marginBottom:14 }}>Settings</div>
      {/* Theme Card */}
      <div style={{ background:ft.cardBg, border:`1px solid ${ft.accent}44`, borderRadius:14, padding:14, marginBottom:13 }}>
        <div style={{ fontSize:10, color:ft.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:11 }}>Display Theme</div>
        <div style={{ display:"flex", gap:9 }}>
          {Object.entries(FA_THEMES).map(([key]) => (
            <button key={key} onClick={() => setFaTheme(key)} style={{ flex:1, padding:"12px 9px", borderRadius:11, border:`2px solid ${faTheme===key?ft.accent:ft.border}`, background:faTheme===key?ft.accentBg:ft.cardBg2, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"center", transition:"all 0.2s" }}>
              <div style={{ fontSize:10, fontWeight:700, color:ft.textPrimary }}>{key==="dark"?"🌙 Dark":"☀️ Light"}</div>
              <div style={{ fontSize:9, color:ft.textMuted, marginTop:3 }}>{key==="dark"?"High contrast":"Clinical white"}</div>
              {faTheme===key && <div style={{ fontSize:9, color:ft.accent, fontWeight:700, marginTop:4 }}>✓ ACTIVE</div>}
            </button>
          ))}
        </div>
        <div style={{ marginTop:11, padding:"9px 11px", background:ft.cardBg2, borderRadius:9, border:`1px solid ${ft.border}` }}>
          <div style={{ fontSize:10, color:ft.textMuted, marginBottom:7 }}>Current palette</div>
          <div style={{ display:"flex", gap:5 }}>
            {[ft.appBg, ft.cardBg, ft.accent, ft.danger, ft.warning, ft.success].map((color, i) => (
              <div key={i} style={{ flex:1, height:20, borderRadius:5, background:color, border:`1px solid ${ft.border}` }}/>
            ))}
          </div>
        </div>
      </div>
      {/* Other settings */}
      {[
        { title:"Security", items:[["HIPAA Mode","Enabled ✓"],["PHI in Notifications","Disabled"],["Session Timeout","30 min"]] },
        { title:"Notifications", items:[["Medication Reminders","On"],["Critical Alerts","On"],["Team Messages","On"]] },
        { title:"Account", items:[["Role","Caregiver"],["Patient",patientName+", age "+patientAge],["Caregiver",caregiverName],["Care Team","Dr. Patel, Pharm. Chen"]] },
      ].map(section => (
        <div key={section.title} style={{ background:ft.cardBg, border:`1px solid ${ft.border}`, borderRadius:13, padding:13, marginBottom:11 }}>
          <div style={{ fontSize:10, color:ft.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:9 }}>{section.title}</div>
          {section.items.map(([k, v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${ft.border}` }}>
              <span style={{ fontSize:12, color:ft.textSecondary }}>{k}</span>
              <span style={{ fontSize:12, color:ft.success, fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Logout */}
      {!confirmLogout ? (
        <button onClick={() => setConfirmLogout(true)} style={{ width:"100%", marginTop:6, padding:"13px", borderRadius:12, border:`1px solid ${ft.danger}44`, background:ft.dangerBg, color:ft.danger, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          ⎋ Sign Out
        </button>
      ) : (
        <div style={{ background:ft.dangerBg, border:`1px solid ${ft.danger}44`, borderRadius:12, padding:16, marginTop:6 }}>
          <div style={{ fontSize:13, fontWeight:700, color:ft.danger, marginBottom:4 }}>Sign out of LessMeds?</div>
          <div style={{ fontSize:12, color:ft.textSecondary, marginBottom:14, lineHeight:1.5 }}>Your patient data and care team connection will be removed from this device.</div>
          <div style={{ display:"flex", gap:9 }}>
            <button onClick={() => setConfirmLogout(false)} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${ft.border}`, background:"transparent", color:ft.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={onLogout} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:ft.danger, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Yes, Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Full App Resources Screen ────────────────────────────────────────────────
function FAResourcesScreen({ ft }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const tagColors = {
    accent: [ft.accentBg, ft.accent],
    success: [ft.successBg, ft.success],
    warning: [ft.warningBg, ft.warning],
    danger:  [ft.dangerBg,  ft.danger],
  };
  return (
    <div style={{ padding:"16px 14px", overflowY:"auto" }}>
      {/* Dr. Canterbury bio */}
      <div style={{ background:ft.cardBg, border:`1px solid ${ft.accent}44`, borderRadius:14, padding:"13px", marginBottom:16, display:"flex", gap:11, alignItems:"center" }}>
        <div style={{ width:46, height:46, borderRadius:"50%", flexShrink:0, background:ft.accentBg, border:`2px solid ${ft.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👨‍⚕️</div>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:ft.textPrimary }}>Dr. DeLon Canterbury</div>
          <div style={{ color:ft.accent, fontSize:11, fontWeight:500 }}>MD · Geriatric Medicine</div>
          <div style={{ color:ft.textSecondary, fontSize:11, marginTop:3, lineHeight:1.4 }}>Nationally recognized expert in polypharmacy and medication safety for older adults.</div>
        </div>
      </div>
      {/* Videos */}
      <div style={{ fontSize:10, color:ft.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>{VIDEOS.length} Videos & Talks</div>
      {VIDEOS.map(v => {
        const [tagBg, tagFg] = tagColors[v.tagColor] || tagColors.accent;
        const isActive = activeVideo === v.id;
        return (
          <div key={v.id} onClick={() => setActiveVideo(isActive ? null : v.id)}
            style={{ background:ft.cardBg, border:`1px solid ${isActive ? ft.accent : ft.border}`, borderRadius:12, padding:"12px", marginBottom:9, cursor:"pointer", transition:"border-color 0.2s", boxShadow:isActive?`0 0 0 1px ${ft.accent}33, 0 4px 16px rgba(0,0,0,0.15)`:"none" }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ width:42, height:42, borderRadius:8, flexShrink:0, background:isActive?ft.accentBg:ft.cardBg2, border:`1px solid ${isActive?ft.accent:ft.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, transition:"all 0.2s" }}>
                {isActive ? "▶" : v.thumb}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:2 }}>
                  <div style={{ fontWeight:600, fontSize:12, lineHeight:1.3, color:ft.textPrimary, flex:1 }}>{v.title}</div>
                  <span style={{ background:tagBg, color:tagFg, borderRadius:5, padding:"2px 6px", fontSize:8, fontWeight:700, letterSpacing:0.4, textTransform:"uppercase", flexShrink:0 }}>{v.tag}</span>
                </div>
                <div style={{ color:ft.accent, fontSize:10, fontWeight:500, marginBottom:3 }}>{v.subtitle} · {v.year}</div>
                <div style={{ color:ft.textSecondary, fontSize:11, lineHeight:1.5 }}>{v.desc}</div>
              </div>
            </div>
            {isActive && (
              <div style={{ marginTop:10, background:ft.cardBg2, border:`1px solid ${ft.border}`, borderRadius:8, height:140, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:ft.accentBg, border:`1px solid ${ft.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, color:ft.accent }}>▶</div>
                <div style={{ color:ft.textSecondary, fontSize:12, fontWeight:500 }}>YouTube embed goes here</div>
                <div style={{ color:ft.textMuted, fontSize:10 }}>Paste Dr. Canterbury's video URL</div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ padding:"10px 13px", background:ft.cardBg2, borderRadius:10, color:ft.textMuted, fontSize:11, lineHeight:1.5, textAlign:"center", marginTop:4 }}>
        More videos added regularly. Subscribe for the latest from Dr. Canterbury.
      </div>
    </div>
  );
}

// ─── RESOURCES ────────────────────────────────────────────────────────────────
function ResourcesScreen({ t, activeVideo, setActiveVideo }) {
  const tcMap = { accent:[t.accentDim,t.accent], success:[t.successDim,t.success], warning:[t.warningDim,t.warning], danger:[t.dangerDim,t.danger] };
  return (
    <div style={{ padding:"20px 18px" }}>
      <h2 style={{ fontFamily:serif, fontSize:22, fontWeight:400, margin:"0 0 3px" }}>Resource Center</h2>
      <p style={{ color:t.textSub, fontSize:13, margin:"0 0 16px", lineHeight:1.5 }}>Expert talks from Dr. DeLon Canterbury on polypharmacy and deprescribing.</p>
      <div style={{ background:`linear-gradient(135deg, ${t.surfaceAlt}, ${t.surface})`, border:`1px solid ${t.border}`, borderRadius:13, padding:"13px", marginBottom:16, display:"flex", gap:11, alignItems:"center" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg, ${t.accent}44, ${t.accentDim})`, border:`2px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👨‍⚕️</div>
        <div><div style={{ fontWeight:700, fontSize:14 }}>Dr. DeLon Canterbury</div><div style={{ color:t.accent, fontSize:11, fontWeight:500 }}>MD · Geriatric Medicine</div><div style={{ color:t.textSub, fontSize:11, marginTop:3, lineHeight:1.4 }}>Nationally recognized expert in polypharmacy and medication safety for older adults.</div></div>
      </div>
      <SectionLabel t={t}>{VIDEOS.length} Videos & Talks</SectionLabel>
      {VIDEOS.map(v => {
        const [tBg,tFg] = tcMap[v.tagColor]||tcMap.accent;
        const active = activeVideo===v.id;
        return (
          <div key={v.id} onClick={() => setActiveVideo(active?null:v.id)} style={{ background:t.surface, border:`1px solid ${active?t.accent:t.border}`, borderRadius:12, padding:"13px", marginBottom:9, cursor:"pointer", transition:"border-color 0.2s", boxShadow:active?`0 0 0 1px ${t.accent}33, 0 4px 16px ${t.accentGlow}`:"none" }}>
            <div style={{ display:"flex", gap:11, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:8, flexShrink:0, background:active?t.accentDim:t.surfaceAlt, border:`1px solid ${active?t.accent:t.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, transition:"all 0.2s" }}>{active?"▶":v.thumb}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:2 }}>
                  <div style={{ fontWeight:600, fontSize:13, lineHeight:1.3, flex:1 }}>{v.title}</div>
                  <span style={{ background:tBg, color:tFg, borderRadius:5, padding:"2px 6px", fontSize:8, fontWeight:700, letterSpacing:0.4, textTransform:"uppercase", flexShrink:0 }}>{v.tag}</span>
                </div>
                <div style={{ color:t.accent, fontSize:10, fontWeight:500, marginBottom:3 }}>{v.subtitle} · {v.year}</div>
                <div style={{ color:t.textSub, fontSize:11, lineHeight:1.5 }}>{v.desc}</div>
              </div>
            </div>
            {active && (
              <div style={{ marginTop:11, background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:8, height:148, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, animation:"fadeIn 0.2s ease" }}>
                <div style={{ width:42, height:42, borderRadius:"50%", background:t.accentDim, border:`1px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, color:t.accent }}>▶</div>
                <div style={{ color:t.textSub, fontSize:12, fontWeight:500 }}>YouTube embed goes here</div>
                <div style={{ color:t.textMuted, fontSize:10 }}>Paste Dr. Canterbury's video URL</div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ padding:"11px 13px", background:t.surfaceAlt, borderRadius:10, color:t.textMuted, fontSize:11, lineHeight:1.5, textAlign:"center" }}>More videos added regularly. Subscribe for the latest from Dr. Canterbury.</div>
    </div>
  );
}

