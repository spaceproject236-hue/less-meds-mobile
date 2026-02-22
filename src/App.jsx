import { useState, createContext, useContext } from "react";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    name: "Accessibility Dark",
    appBg: "#060b14",
    headerBg: "#0a1628",
    cardBg: "#0a1628",
    cardBg2: "#0f172a",
    inputBg: "#0f172a",
    border: "#1e293b",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    accent: "#06b6d4",
    accentBg: "rgba(6,182,212,0.15)",
    success: "#22c55e",
    successBg: "#052e16",
    warning: "#f59e0b",
    warningBg: "#1c1200",
    danger: "#ef4444",
    dangerBg: "#1c0002",
    dangerText: "#fca5a5",
    warningText: "#fcd34d",
    successText: "#86efac",
    navBg: "#0a1628",
    navBorder: "#1e293b",
    navActive: "#06b6d4",
    navInactive: "#64748b",
    msgOut: "#06b6d4",
    msgOutText: "#000000",
    msgIn: "#1e293b",
    msgInText: "#f1f5f9",
    pillBg: "#1e293b",
    pillText: "#94a3b8",
    statusBar: "#060b14",
    progressTrack: "#1e293b",
    btnPrimary: "#06b6d4",
    btnPrimaryText: "#000000",
  },
  light: {
    name: "Clinical Light",
    appBg: "#f0f4f8",
    headerBg: "#ffffff",
    cardBg: "#ffffff",
    cardBg2: "#f8fafc",
    inputBg: "#f8fafc",
    border: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#0369a1",
    accentBg: "rgba(3,105,161,0.1)",
    success: "#16a34a",
    successBg: "#f0fdf4",
    warning: "#d97706",
    warningBg: "#fffbeb",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    dangerText: "#dc2626",
    warningText: "#b45309",
    successText: "#15803d",
    navBg: "#ffffff",
    navBorder: "#e2e8f0",
    navActive: "#0369a1",
    navInactive: "#94a3b8",
    msgOut: "#0369a1",
    msgOutText: "#ffffff",
    msgIn: "#f1f5f9",
    msgInText: "#0f172a",
    pillBg: "#f1f5f9",
    pillText: "#475569",
    statusBar: "#ffffff",
    progressTrack: "#e2e8f0",
    btnPrimary: "#0369a1",
    btnPrimaryText: "#ffffff",
  },
};

const ThemeContext = createContext(THEMES.dark);
const useTheme = () => useContext(ThemeContext);

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_MEDICATIONS = [
  { id:"m1", name:"Warfarin", dose:"5mg", time:"8:00 AM", taken:true, color:"#ef4444" },
  { id:"m2", name:"Metformin", dose:"1000mg", time:"8:00 AM", taken:true, color:"#3b82f6" },
  { id:"m3", name:"Lisinopril", dose:"10mg", time:"8:00 AM", taken:false, color:"#8b5cf6" },
  { id:"m4", name:"Aspirin", dose:"81mg", time:"12:00 PM", taken:false, color:"#f59e0b" },
  { id:"m5", name:"Atorvastatin", dose:"40mg", time:"8:00 PM", taken:false, color:"#06b6d4" },
  { id:"m6", name:"Potassium", dose:"20mEq", time:"8:00 AM", taken:false, color:"#22c55e" },
  { id:"m7", name:"Alendronate", dose:"70mg", time:"Monday AM", taken:false, color:"#ec4899" },
];

const MOCK_ALERTS = [
  { id:"a1", type:"critical", msg:"Warfarin + Aspirin interaction flagged", time:"2 hrs ago" },
  { id:"a2", type:"warning", msg:"3 missed doses this week", time:"Today" },
  { id:"a3", type:"info", msg:"Review scheduled for Feb 25", time:"Yesterday" },
];

const MOCK_MESSAGES = [
  { id:"msg1", from:"Dr. Patel", text:"Please ensure Eleanor takes her Lisinopril with food.", time:"10:22 AM", outgoing:false },
  { id:"msg2", from:"You", text:"Understood. She had breakfast at 8 AM, will give it now.", time:"10:30 AM", outgoing:true },
  { id:"msg3", from:"Pharm. Chen", text:"Please watch for swelling or shortness of breath with the Warfarin + Aspirin combo.", time:"11:05 AM", outgoing:false },
];

const MOCK_APPOINTMENTS = [
  { id:"ap1", title:"Medication Review", doctor:"Dr. Patel", date:"Feb 25, 2026", time:"2:00 PM", location:"Room 204" },
  { id:"ap2", title:"Pharmacist Consult", doctor:"Pharm. Chen", date:"Mar 4, 2026", time:"10:00 AM", location:"Pharmacy Clinic" },
];

const SYMPTOM_OPTIONS = ["Dizziness","Nausea","Fatigue","Shortness of breath","Swelling","Confusion","Headache","Chest pain","Rash","Other"];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CaregiverApp() {
  const [themeName, setThemeName] = useState("dark");
  const t = THEMES[themeName];
  const [screen, setScreen] = useState("home");
  const [meds, setMeds] = useState(MOCK_MEDICATIONS);
  const [symptoms, setSymptoms] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [toasts, setToasts] = useState([]);

  const takenCount = meds.filter(m=>m.taken).length;
  const pendingCount = meds.filter(m=>!m.taken).length;
  const score = 82;

  function toast(msg, type="success") {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000);
  }
  function markTaken(id) {
    setMeds(prev=>prev.map(m=>m.id!==id?m:{...m,taken:true}));
    const med = meds.find(m=>m.id===id);
    toast(`${med?.name} marked as taken ✓`);
  }
  function logSymptoms() {
    if(!selectedSymptoms.length) return;
    const entry = { id:Date.now(), symptoms:selectedSymptoms, notes:symptomNotes, time:new Date().toLocaleTimeString(), date:new Date().toLocaleDateString() };
    setSymptoms(prev=>[entry,...prev]);
    setSelectedSymptoms([]); setSymptomNotes(""); setShowSymptomForm(false);
    toast("Symptoms reported to care team","info");
  }
  function sendMessage() {
    if(!msgInput.trim()) return;
    const msg = { id:Date.now(), from:"You", text:msgInput, time:new Date().toLocaleTimeString(), outgoing:true };
    setMessages(prev=>[...prev,msg]);
    setMsgInput("");
    toast("Message sent securely");
  }

  const navItems = [
    { id:"home", icon:"⬡", label:"Home" }, { id:"meds", icon:"◎", label:"Meds" },
    { id:"symptoms", icon:"♥", label:"Symptoms" }, { id:"messages", icon:"◈", label:"Messages" },
    { id:"settings", icon:"◍", label:"Settings" },
  ];

  return (
    <ThemeContext.Provider value={t}>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background: themeName==="dark"?"#030712":"#e2e8f0", fontFamily:"'DM Sans', sans-serif", transition:"background 0.3s" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet"/>

        {/* Phone Frame */}
        <div style={{ width:375, height:780, background:t.appBg, borderRadius:44, overflow:"hidden",
          border: themeName==="dark"?"2px solid #1e293b":"2px solid #cbd5e1",
          position:"relative", display:"flex", flexDirection:"column",
          boxShadow: themeName==="dark"?"0 40px 100px rgba(0,0,0,0.8)":"0 40px 100px rgba(0,0,0,0.2)",
          transition:"all 0.3s" }}>

          {/* Status Bar */}
          <div style={{ height:44, background:t.statusBar, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0, borderBottom:`1px solid ${t.border}` }}>
            <span style={{ fontSize:12, fontWeight:600, color:t.textPrimary }}>9:41</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:11, color:t.textSecondary }}>●●●</span>
              <span style={{ fontSize:11, color:t.textSecondary }}>WiFi</span>
              <span style={{ fontSize:11, color:t.textSecondary }}>🔋</span>
            </div>
          </div>

          {/* Header */}
          <div style={{ padding:"10px 20px 14px", background:t.headerBg, borderBottom:`1px solid ${t.border}`, flexShrink:0, boxShadow: themeName==="light"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:11, color:t.textMuted, letterSpacing:1, textTransform:"uppercase" }}>LessMeds Caregiver</div>
                <div style={{ fontSize:16, fontWeight:700, color:t.textPrimary, marginTop:1 }}>Eleanor Whitmore</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:score>=71?t.danger:score>=41?t.warning:t.success }}/>
                <div style={{ fontSize:13, fontWeight:700, color:score>=71?t.danger:score>=41?t.warning:t.success }}>Score: {score}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding: screen==="messages"?0:16, background:t.appBg }}>
            {screen==="home" && <HomeScreen meds={meds} takenCount={takenCount} pendingCount={pendingCount} alerts={MOCK_ALERTS} onNavigate={setScreen} onMarkTaken={markTaken} score={score}/>}
            {screen==="meds" && <MedsScreen meds={meds} onMark={markTaken}/>}
            {screen==="symptoms" && <SymptomsScreen symptoms={symptoms} show={showSymptomForm} setShow={setShowSymptomForm} selected={selectedSymptoms} setSelected={setSelectedSymptoms} notes={symptomNotes} setNotes={setSymptomNotes} onLog={logSymptoms} options={SYMPTOM_OPTIONS}/>}
            {screen==="messages" && <MessagesScreen messages={messages} msgInput={msgInput} setMsgInput={setMsgInput} onSend={sendMessage}/>}
            {screen==="settings" && <MobileSettings themeName={themeName} setThemeName={setThemeName}/>}
          </div>

          {/* Bottom Nav */}
          <div style={{ height:74, background:t.navBg, borderTop:`1px solid ${t.navBorder}`, display:"flex", flexShrink:0, boxShadow: themeName==="light"?"0 -1px 4px rgba(0,0,0,0.06)":"none" }}>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>setScreen(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"transparent", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ fontSize:16, opacity: screen===n.id?1:0.4, transition:"opacity 0.15s" }}>{n.icon}</span>
                <span style={{ fontSize:9, letterSpacing:0.5, textTransform:"uppercase", fontWeight:600, color: screen===n.id?t.navActive:t.navInactive, transition:"color 0.15s" }}>{n.label}</span>
              </button>
            ))}
          </div>

          {/* Toasts */}
          <div style={{ position:"absolute", top:100, left:16, right:16, display:"flex", flexDirection:"column", gap:8, zIndex:10, pointerEvents:"none" }}>
            {toasts.map(toast=>(
              <div key={toast.id} style={{ padding:"10px 14px", borderRadius:10,
                background:toast.type==="success"?t.successBg:t.cardBg,
                border:`1px solid ${toast.type==="success"?t.success:t.border}`,
                color:t.textPrimary, fontSize:12, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", animation:"slideDown 0.3s ease" }}>
                {toast.type==="success"?"✅ ":"ℹ️ "}{toast.msg}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
          ::-webkit-scrollbar { display:none; }
        `}</style>
      </div>
    </ThemeContext.Provider>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ meds, takenCount, pendingCount, alerts, onNavigate, onMarkTaken, score }) {
  const t = useTheme();
  const nextMed = meds.find(m=>!m.taken);
  const scoreColor = score>=71?t.danger:score>=41?t.warning:t.success;
  return (
    <div>
      {/* Progress Ring */}
      <div style={{ display:"flex", alignItems:"center", gap:16, background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:16, padding:16, marginBottom:14, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
        <svg width={64} height={64} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke={t.progressTrack} strokeWidth="5"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke={t.success} strokeWidth="5"
            strokeDasharray={`${(takenCount/meds.length)*163} 163`}
            strokeLinecap="round" transform="rotate(-90 32 32)"/>
          <text x="32" y="36" textAnchor="middle" fill={t.textPrimary} fontSize="14" fontWeight="700" fontFamily="monospace">{takenCount}/{meds.length}</text>
        </svg>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>Today's Progress</div>
          <div style={{ fontSize:12, color:t.success, marginTop:2 }}>{takenCount} taken</div>
          <div style={{ fontSize:12, color:t.textMuted }}>{pendingCount} remaining</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <div style={{ fontSize:11, color:t.textMuted }}>Risk</div>
          <div style={{ fontSize:20, fontWeight:700, color:scoreColor }}>{score}</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.slice(0,2).map(a=>(
        <div key={a.id} style={{ padding:"10px 14px", borderRadius:12, marginBottom:10, display:"flex", gap:10, alignItems:"flex-start",
          background:a.type==="critical"?t.dangerBg:a.type==="warning"?t.warningBg:t.cardBg,
          border:`1px solid ${a.type==="critical"?t.danger+"44":a.type==="warning"?t.warning+"44":t.border}` }}>
          <span style={{ fontSize:14 }}>{a.type==="critical"?"🔴":a.type==="warning"?"🟡":"🔵"}</span>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:a.type==="critical"?t.dangerText:a.type==="warning"?t.warningText:t.accent }}>{a.msg}</div>
            <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{a.time}</div>
          </div>
        </div>
      ))}

      {/* Next Med */}
      {nextMed && (
        <div style={{ background:t.cardBg, border:`1px solid ${t.accent}44`, borderRadius:16, padding:16, marginBottom:14, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>
          <div style={{ fontSize:11, color:t.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Next Medication</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:nextMed.color+"22", border:`1px solid ${nextMed.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💊</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:t.textPrimary }}>{nextMed.name}</div>
              <div style={{ fontSize:12, color:t.textSecondary }}>{nextMed.dose} · {nextMed.time}</div>
            </div>
            <button onClick={()=>onMarkTaken(nextMed.id)} style={{ padding:"7px 14px", borderRadius:10, border:"none", background:t.btnPrimary, color:t.btnPrimaryText, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Mark Taken
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"Log Symptoms", icon:"♥", screen:"symptoms", color:t.danger },
          { label:"Message Team", icon:"◈", screen:"messages", color:t.accent },
          { label:"All Meds", icon:"◎", screen:"meds", color:t.success },
          { label:"Settings", icon:"◍", screen:"settings", color:t.textSecondary },
        ].map(a=>(
          <button key={a.label} onClick={()=>onNavigate(a.screen)} style={{ padding:"14px 12px", borderRadius:14, border:`1px solid ${a.color}33`, background:`${a.color}11`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left", transition:"opacity 0.15s" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{a.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:a.color }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Meds Screen ──────────────────────────────────────────────────────────────
function MedsScreen({ meds, onMark }) {
  const t = useTheme();
  const times = [...new Set(meds.map(m=>m.time))];
  return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:t.textPrimary, marginBottom:16 }}>Medication List</div>
      {times.map(time=>(
        <div key={time} style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📅 {time}</div>
          {meds.filter(m=>m.time===time).map(m=>(
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12,
              background:t.cardBg, border:`1px solid ${m.taken?t.success+"44":t.border}`, marginBottom:8, opacity:m.taken?0.7:1,
              boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.05)":"none" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:m.color+"22", border:`1px solid ${m.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:14 }}>💊</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:t.textPrimary }}>{m.name}</div>
                <div style={{ fontSize:11, color:t.textSecondary, marginTop:1 }}>{m.dose}</div>
              </div>
              {m.taken ? (
                <span style={{ fontSize:18 }}>✅</span>
              ) : (
                <button onClick={()=>onMark(m.id)} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Take</button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Symptoms Screen ──────────────────────────────────────────────────────────
function SymptomsScreen({ symptoms, show, setShow, selected, setSelected, notes, setNotes, onLog, options }) {
  const t = useTheme();
  function toggle(s) { setSelected(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]); }
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.textPrimary }}>Symptom Log</div>
        <button onClick={()=>setShow(true)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${t.accent}`, background:t.accentBg, color:t.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Report</button>
      </div>
      {show && (
        <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:16, padding:16, marginBottom:16, boxShadow: t.appBg==="#f0f4f8"?"0 2px 8px rgba(0,0,0,0.08)":"none" }}>
          <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary, marginBottom:12 }}>Report Symptoms</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {options.map(s=>(
              <button key={s} onClick={()=>toggle(s)} style={{ padding:"5px 10px", borderRadius:20,
                border:`1px solid ${selected.includes(s)?t.accent:t.border}`,
                background:selected.includes(s)?t.accentBg:"transparent",
                color:selected.includes(s)?t.accent:t.textSecondary, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s}</button>
            ))}
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes..." rows={2}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:12, fontFamily:"'DM Sans',sans-serif", resize:"none", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={()=>setShow(false)} style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={onLog} style={{ flex:2, padding:"8px", borderRadius:8, border:"none", background:t.btnPrimary, color:t.btnPrimaryText, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Submit to Care Team</button>
          </div>
        </div>
      )}
      {symptoms.length === 0 && !show && (
        <div style={{ textAlign:"center", padding:"40px 0", color:t.textMuted, fontSize:13 }}>No symptoms logged yet.<br/>Tap + Report to log symptoms.</div>
      )}
      {symptoms.map(s=>(
        <div key={s.id} style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:11, color:t.textMuted }}>{s.date} · {s.time}</span>
            <span style={{ fontSize:11, color:t.warning }}>Reported to care team</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {s.symptoms.map(sym=><span key={sym} style={{ padding:"3px 8px", borderRadius:20, background:t.pillBg, color:t.pillText, fontSize:11 }}>{sym}</span>)}
          </div>
          {s.notes && <div style={{ marginTop:8, fontSize:12, color:t.textMuted, fontStyle:"italic" }}>{s.notes}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Messages Screen ──────────────────────────────────────────────────────────
function MessagesScreen({ messages, msgInput, setMsgInput, onSend }) {
  const t = useTheme();
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${t.border}`, background:t.headerBg, flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>Secure Messaging</div>
        <div style={{ fontSize:11, color:t.success, marginTop:1 }}>🔒 End-to-end encrypted · No PHI in notifications</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10, background:t.appBg }}>
        {messages.map(m=>(
          <div key={m.id} style={{ display:"flex", justifyContent:m.outgoing?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"80%", padding:"10px 14px",
              borderRadius:m.outgoing?"16px 4px 16px 16px":"4px 16px 16px 16px",
              background:m.outgoing?t.msgOut:t.msgIn, color:m.outgoing?t.msgOutText:t.msgInText,
              boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
              {!m.outgoing && <div style={{ fontSize:10, fontWeight:700, color:t.accent, marginBottom:3 }}>{m.from}</div>}
              <div style={{ fontSize:13, lineHeight:1.4 }}>{m.text}</div>
              <div style={{ fontSize:10, color:m.outgoing?`${t.msgOutText}88`:t.textMuted, marginTop:3, textAlign:"right" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:12, borderTop:`1px solid ${t.border}`, background:t.headerBg, display:"flex", gap:8, flexShrink:0 }}>
        <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()}
          placeholder="Secure message..." style={{ flex:1, padding:"10px 14px", borderRadius:24, border:`1px solid ${t.border}`, background:t.inputBg, color:t.textPrimary, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
        <button onClick={onSend} style={{ width:40, height:40, borderRadius:"50%", border:"none", background:t.btnPrimary, color:t.btnPrimaryText, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>→</button>
      </div>
    </div>
  );
}

// ─── Mobile Settings with Theme Switcher ─────────────────────────────────────
function MobileSettings({ themeName, setThemeName }) {
  const t = useTheme();
  return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:t.textPrimary, marginBottom:16 }}>Settings</div>

      {/* Theme Card */}
      <div style={{ background:t.cardBg, border:`1px solid ${t.accent}44`, borderRadius:16, padding:16, marginBottom:14, boxShadow: t.appBg==="#f0f4f8"?"0 2px 8px rgba(0,0,0,0.06)":"none" }}>
        <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Display Theme</div>
        <div style={{ display:"flex", gap:10 }}>
          {Object.entries(THEMES).map(([key, th]) => (
            <button key={key} onClick={()=>setThemeName(key)} style={{ flex:1, padding:"12px 10px", borderRadius:12,
              border:`2px solid ${themeName===key?t.accent:t.border}`,
              background:themeName===key?t.accentBg:t.cardBg2,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"center", transition:"all 0.2s" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{key==="dark"?"🌙":"☀️"}</div>
              <div style={{ fontSize:11, fontWeight:700, color:t.textPrimary }}>{key==="dark"?"Dark":"Light"}</div>
              <div style={{ fontSize:9, color:t.textMuted, marginTop:2, lineHeight:1.3 }}>{key==="dark"?"High contrast":"Clinical white"}</div>
              {themeName===key && <div style={{ fontSize:9, color:t.accent, fontWeight:700, marginTop:4 }}>✓ ACTIVE</div>}
            </button>
          ))}
        </div>
        {/* Color preview swatches */}
        <div style={{ marginTop:12, padding:"10px 12px", background:t.cardBg2, borderRadius:10, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:10, color:t.textMuted, marginBottom:8 }}>Current palette preview</div>
          <div style={{ display:"flex", gap:6 }}>
            {[t.appBg, t.cardBg, t.accent, t.danger, t.warning, t.success].map((color,i)=>(
              <div key={i} style={{ flex:1, height:24, borderRadius:6, background:color, border:`1px solid ${t.border}` }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Other settings */}
      {[
        { title:"Security", items:[["HIPAA Mode","Enabled ✓"],["PHI in Notifications","Disabled"],["Session Timeout","30 min"]] },
        { title:"Notifications", items:[["Medication Reminders","On"],["Critical Alerts","On"],["Team Messages","On"]] },
        { title:"Account", items:[["Role","Caregiver"],["Patient","Eleanor Whitmore"],["Care Team","Dr. Patel, Pharm. Chen"]] },
      ].map(section=>(
        <div key={section.title} style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:14, padding:14, marginBottom:12, boxShadow: t.appBg==="#f0f4f8"?"0 1px 4px rgba(0,0,0,0.05)":"none" }}>
          <div style={{ fontSize:10, color:t.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>{section.title}</div>
          {section.items.map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              <span style={{ fontSize:12, color:t.textSecondary }}>{k}</span>
              <span style={{ fontSize:12, color:t.success, fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
