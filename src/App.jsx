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
  const hideNav = ["paywall","patientInfo"].includes(screen);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:font }}>
        <div style={{ width:375, height:780, borderRadius:44, background:frameColor, boxShadow:`0 0 0 10px ${frameColor}, 0 0 0 11px ${frameBorder}, 0 40px 80px rgba(0,0,0,0.8)`, overflow:"hidden", position:"relative", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ flex:1, background:t.bg, color:t.text, display:"flex", flexDirection:"column", overflow:"hidden", borderRadius:34, transition:"background 0.3s, color 0.3s" }}>

            {/* Status Bar */}
            <div style={{ height:44, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, borderRadius:"34px 34px 0 0", transition:"background 0.3s", position:"relative" }}>
              <span style={{ fontSize:12, fontWeight:600, color:t.text, fontFamily:font }}>9:41</span>
              <div style={{ width:120, height:28, background:theme==="dark"?"#111":"#ddd", borderRadius:14, position:"absolute", left:"50%", transform:"translateX(-50%)", transition:"background 0.3s" }} />
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                <span style={{ fontSize:9, color:t.textSub }}>●●●</span>
                <span style={{ fontSize:9, color:t.textSub }}>▲</span>
                <span style={{ fontSize:9, color:t.textSub }}>⬛</span>
              </div>
            </div>

            {/* Header */}
            <header style={{ padding:"10px 18px", borderBottom:`1px solid ${t.border}`, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
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
            </header>

            {/* Content */}
            <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", paddingBottom:8, scrollbarWidth:"none" }}>
              {screen==="home" && <HomeScreen t={t} onStart={() => setScreen("checker")} onResources={() => setScreen("resources")} />}
              {screen==="checker" && <CheckerScreen t={t} meds={meds} setMeds={setMeds} onResult={r => { setResult(r); setScreen("results"); }} />}
              {screen==="results" && result && <ResultsScreen t={t} result={result} meds={meds} pricingTab={pricingTab} setPricingTab={setPricingTab} onBack={() => setScreen("checker")} onResources={() => setScreen("resources")} onPurchase={plan => { setPlanType(plan); setScreen("paywall"); }} />}
              {screen==="resources" && <ResourcesScreen t={t} activeVideo={activeVideo} setActiveVideo={setActiveVideo} />}
              {screen==="paywall" && <PaywallScreen t={t} planType={planType} onBack={() => setScreen("results")} onComplete={() => setScreen("patientInfo")} />}
              {screen==="patientInfo" && <PatientInfoScreen t={t} planType={planType} prefillMeds={meds} onSubmit={info => { setPatientInfo(info); setScreen(planType==="monthly"?"fullApp":"submitted"); }} onBack={() => setScreen("paywall")} />}
              {screen==="submitted" && <SubmittedScreen t={t} patientInfo={patientInfo} assessmentReady={assessmentReady} onViewAssessment={() => { setScreen("assessment"); setAssessmentBadge(false); }} />}
              {screen==="assessment" && <AssessmentScreen t={t} patientInfo={patientInfo} result={result} meds={meds} assessmentReady={assessmentReady} />}
              {screen==="fullApp" && <FullAppScreen t={t} patientInfo={patientInfo} result={result} meds={meds} />}
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
            <div style={{ height:20, background:t.navBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, borderRadius:"0 0 34px 34px" }}>
              <div style={{ width:120, height:4, background:t.border, borderRadius:2 }} />
            </div>
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

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ t, onStart, onResources }) {
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

// ─── CHECKER ──────────────────────────────────────────────────────────────────
function CheckerScreen({ t, meds, setMeds, onResult }) {
  const [name, setName] = useState(""); const [dose, setDose] = useState(""); const [freq, setFreq] = useState("Once daily"); const [error, setError] = useState("");
  const inputRef = useRef();
  const freqs = ["Once daily","Twice daily","Three times daily","Four times daily","Every other day","Weekly","As needed"];
  const iS = inputStyle(t);
  const addMed = () => { if (!name.trim()) { setError("Please enter a medication name."); return; } setMeds(p => [...p, { id:Date.now(), name:name.trim(), dose:dose.trim()||"—", freq }]); setName(""); setDose(""); setError(""); inputRef.current?.focus(); };
  return (
    <div style={{ padding:"20px 18px" }}>
      <h2 style={{ fontFamily:serif, fontSize:22, fontWeight:400, margin:"0 0 3px" }}>Medication Checker</h2>
      <p style={{ color:t.textSub, fontSize:13, margin:"0 0 18px" }}>No names or identifying information needed.</p>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"14px", marginBottom:14 }}>
        <LabeledField label="Medication Name *" t={t}>
          <input ref={inputRef} value={name} onChange={e => { setName(e.target.value); setError(""); }} onKeyDown={e => e.key==="Enter" && addMed()} placeholder="e.g. Metformin, Lisinopril..." style={iS} />
        </LabeledField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:4 }}>
          <LabeledField label="Dose" t={t}><input value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 500mg" style={iS} /></LabeledField>
          <LabeledField label="Frequency" t={t}><select value={freq} onChange={e => setFreq(e.target.value)} style={{ ...iS, appearance:"none", cursor:"pointer" }}>{freqs.map(f => <option key={f}>{f}</option>)}</select></LabeledField>
        </div>
        {error && <div style={{ color:t.danger, fontSize:12, marginBottom:8 }}>{error}</div>}
        <Btn t={t} variant="outline" onClick={addMed}>+ Add Medication</Btn>
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
  const ready = cardNum.replace(/\s/g,"").length===16 && expiry.length===5 && cvc.length>=3 && name.trim();
  const handlePay = () => { if(!ready) return; setProcessing(true); setTimeout(()=>{ setProcessing(false); setDone(true); setTimeout(onComplete,1200); },2200); };
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
function FullAppScreen({ t, patientInfo, result, meds }) {
  const risk = result ? riskLevel(result.score) : { label:"Moderate Risk", color:"warning", emoji:"🟡" };
  const fg = t[risk.color]; const score = result?.score ?? 58;
  const [tab, setTab] = useState("overview");
  const displayMeds = meds.length ? meds : [{ id:1, name:"Metformin", dose:"500mg", freq:"Twice daily" },{ id:2, name:"Lisinopril", dose:"10mg", freq:"Once daily" },{ id:3, name:"Aspirin", dose:"81mg", freq:"Once daily" }];
  return (
    <div style={{ paddingBottom:16 }}>
      <div style={{ padding:"16px 18px 13px", background:`linear-gradient(135deg, ${t.surfaceAlt}, ${t.bg})`, borderBottom:`1px solid ${t.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10, color:t.accent, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:2 }}>Monthly Plan Active ✓</div>
            <div style={{ fontFamily:serif, fontSize:18, fontWeight:400 }}>Welcome, {patientInfo?.caregiverName?.split(" ")[0]||"Caregiver"}</div>
            <div style={{ color:t.textSub, fontSize:12, marginTop:2 }}>Monitoring: <strong style={{ color:t.text }}>{patientInfo?.firstName}</strong>, age {patientInfo?.age}</div>
          </div>
          <div style={{ background:t[risk.color+"Dim"], border:`1px solid ${t[risk.color]}44`, borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:serif, fontSize:20, fontWeight:400, color:fg }}>{score}</div>
            <div style={{ fontSize:8, color:fg, fontWeight:600 }}>RISK SCORE</div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", borderBottom:`1px solid ${t.border}`, background:t.navBg }}>
        {["overview","meds","messages"].map(s => (
          <button key={s} onClick={() => setTab(s)} style={{ flex:1, border:"none", background:"none", padding:"10px 0", color:tab===s?t.accent:t.textMuted, fontSize:11, fontWeight:tab===s?600:400, cursor:"pointer", fontFamily:font, borderBottom:`2px solid ${tab===s?t.accent:"transparent"}`, textTransform:"capitalize", transition:"all 0.2s" }}>
            {s==="overview"?"Overview":s==="meds"?"Medications":"Messages"}
          </button>
        ))}
      </div>
      {tab==="overview" && (
        <div style={{ padding:"14px 18px" }}>
          <div style={{ background:t.success+"22", border:`1px solid ${t.success}44`, borderRadius:10, padding:"11px 13px", marginBottom:14, display:"flex", gap:7 }}>
            <span>✅</span><div><div style={{ color:t.success, fontWeight:600, fontSize:13 }}>Plan Active — Full clinical review underway</div><div style={{ color:t.textSub, fontSize:11, marginTop:1 }}>Next scheduled check-in: 30 days</div></div>
          </div>
          <SectionLabel t={t}>Care Team</SectionLabel>
          {[{ name:"Dr. R. Patel", role:"Physician", emoji:"👨‍⚕️", status:"Active" },{ name:"Pharm. S. Chen", role:"Clinical Pharmacist", emoji:"💊", status:"Reviewing" }].map(m => (
            <div key={m.name} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:"11px 13px", display:"flex", gap:9, alignItems:"center", marginBottom:7 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:t.accentDim, border:`1px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{m.emoji}</div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div><div style={{ color:t.textSub, fontSize:11 }}>{m.role}</div></div>
              <span style={{ background:t.successDim, color:t.success, borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:600 }}>{m.status}</span>
            </div>
          ))}
          {result?.flags?.length>0 && <>
            <SectionLabel t={t}>Risk Factors on File</SectionLabel>
            {result.flags.slice(0,3).map((f,i) => (
              <div key={i} style={{ background:t.surface, border:`1px solid ${t.border}`, borderLeft:`3px solid ${t[f.type]}`, borderRadius:9, padding:"8px 12px", display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:500 }}>{f.label}</span>
                <span style={{ background:t[f.type+"Dim"], color:t[f.type], borderRadius:6, padding:"2px 6px", fontSize:10, fontWeight:600 }}>{f.detail}</span>
              </div>
            ))}
          </>}
        </div>
      )}
      {tab==="meds" && (
        <div style={{ padding:"14px 18px" }}>
          <SectionLabel t={t}>{displayMeds.length} Medications on File</SectionLabel>
          {displayMeds.map((m,i) => (
            <div key={m.id} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:"11px 13px", display:"flex", gap:9, alignItems:"center", marginBottom:7 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:t.pillBg, color:t.accent, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12 }}>{i+1}</div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div><div style={{ color:t.textSub, fontSize:11 }}>{m.dose} · {m.freq}</div></div>
              <span>💊</span>
            </div>
          ))}
          <div style={{ background:t.accentDim, border:`1px solid ${t.accent}33`, borderRadius:10, padding:"11px 13px", marginTop:4, fontSize:12, color:t.accent }}>
            📋 Your pharmacist will review this list and may suggest changes at your next check-in.
          </div>
        </div>
      )}
      {tab==="messages" && (
        <div style={{ padding:"14px 18px" }}>
          <SectionLabel t={t}>Secure Messaging</SectionLabel>
          {[
            { from:"Pharm. S. Chen", time:"Today, 9:14 AM", msg:`Hi ${patientInfo?.caregiverName?.split(" ")[0]||"there"}, I've received ${patientInfo?.firstName}'s medication list and will have a full review ready within 48 hours. Feel free to message me with any questions.`, unread:true },
            { from:"LessMeds", time:"Today, 8:00 AM", msg:"Your LessMeds monthly plan is now active. Your care team has been notified and will reach out shortly.", unread:false },
          ].map((msg,i) => (
            <div key={i} style={{ background:t.surface, border:`1px solid ${msg.unread?t.accent:t.border}`, borderRadius:11, padding:"13px", marginBottom:9, position:"relative" }}>
              {msg.unread && <div style={{ position:"absolute", top:11, right:11, width:7, height:7, borderRadius:"50%", background:t.accent }} />}
              <div style={{ fontWeight:600, fontSize:13, marginBottom:1 }}>{msg.from}</div>
              <div style={{ color:t.textMuted, fontSize:10, marginBottom:6 }}>{msg.time}</div>
              <p style={{ color:t.textSub, fontSize:12, lineHeight:1.6, margin:0 }}>{msg.msg}</p>
            </div>
          ))}
          <div style={{ background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:10, padding:"10px 13px", display:"flex", gap:7, alignItems:"center" }}>
            <input placeholder="Send a message to your care team..." style={{ flex:1, background:"none", border:"none", color:t.text, fontSize:12, fontFamily:font, outline:"none" }} />
            <button style={{ background:t.accentDim, border:`1px solid ${t.accent}`, borderRadius:7, padding:"5px 9px", color:t.accent, fontSize:11, cursor:"pointer", fontFamily:font, fontWeight:600 }}>Send</button>
          </div>
        </div>
      )}
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

