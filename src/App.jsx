import { useState } from "react";

// ─── Mobile Frame Wrapper ─────────────────────────────────────────────────────
// This renders as a mobile phone preview within the artifact

const MOCK_PATIENT = {
  name: "Eleanor Whitmore",
  age: 78,
  mrn: "MRN-4421",
  score: 82,
  medications: [
    { id: "m1", name: "Warfarin", dose: "5mg", time: "8:00 AM", taken: true, color: "#ef4444" },
    { id: "m2", name: "Metformin", dose: "1000mg", time: "8:00 AM", taken: true, color: "#3b82f6" },
    { id: "m3", name: "Lisinopril", dose: "10mg", time: "8:00 AM", taken: false, color: "#8b5cf6" },
    { id: "m4", name: "Aspirin", dose: "81mg", time: "12:00 PM", taken: false, color: "#f59e0b" },
    { id: "m5", name: "Atorvastatin", dose: "40mg", time: "8:00 PM", taken: false, color: "#06b6d4" },
    { id: "m6", name: "Potassium", dose: "20mEq", time: "8:00 AM", taken: false, color: "#22c55e" },
    { id: "m7", name: "Alendronate", dose: "70mg", time: "Monday AM", taken: false, color: "#ec4899" },
  ],
  alerts: [
    { id:"a1", type:"critical", msg:"Warfarin + Aspirin interaction flagged", time:"2 hrs ago" },
    { id:"a2", type:"warning", msg:"3 missed doses this week", time:"Today" },
    { id:"a3", type:"info", msg:"Review scheduled for Feb 25", time:"Yesterday" },
  ],
  messages: [
    { id:"msg1", from:"Dr. Patel", text:"Please ensure Eleanor takes her Lisinopril with food.", time:"10:22 AM", outgoing:false },
    { id:"msg2", from:"You", text:"Understood. She had breakfast at 8 AM, will give it now.", time:"10:30 AM", outgoing:true },
    { id:"msg3", from:"Pharm. Chen", text:"Please watch for swelling or shortness of breath with the Warfarin + Aspirin combo.", time:"11:05 AM", outgoing:false },
  ],
  appointments: [
    { id:"ap1", title:"Medication Review", doctor:"Dr. Patel", date:"Feb 25, 2026", time:"2:00 PM", location:"Room 204" },
    { id:"ap2", title:"Pharmacist Consult", doctor:"Pharm. Chen", date:"Mar 4, 2026", time:"10:00 AM", location:"Pharmacy Clinic" },
  ],
  symptoms: [],
};

const SYMPTOM_OPTIONS = ["Dizziness","Nausea","Fatigue","Shortness of breath","Swelling","Confusion","Headache","Chest pain","Rash","Other"];

export default function CaregiverApp() {
  const [screen, setScreen] = useState("home");
  const [meds, setMeds] = useState(MOCK_PATIENT.medications);
  const [symptoms, setSymptoms] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [messages, setMessages] = useState(MOCK_PATIENT.messages);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [toasts, setToasts] = useState([]);

  const patient = { ...MOCK_PATIENT, medications: meds };
  const takenCount = meds.filter(m=>m.taken).length;
  const pendingCount = meds.filter(m=>!m.taken).length;

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
    toast("Symptoms reported to care team", "info");
  }

  function sendMessage() {
    if(!msgInput.trim()) return;
    const msg = { id:Date.now(), from:"You", text:msgInput, time:new Date().toLocaleTimeString(), outgoing:true };
    setMessages(prev=>[...prev,msg]);
    setMsgInput("");
    toast("Message sent securely");
  }

  const navItems = [
    { id:"home", icon:"⬡", label:"Home" },
    { id:"meds", icon:"◎", label:"Meds" },
    { id:"symptoms", icon:"♥", label:"Symptoms" },
    { id:"messages", icon:"◈", label:"Messages" },
    { id:"appointments", icon:"▣", label:"Schedule" },
  ];

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background:"#0a0f1a", fontFamily:"'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet"/>

      {/* Phone Frame */}
      <div style={{ width:375, height:780, background:"#060b14", borderRadius:44, overflow:"hidden", border:"2px solid #1e293b", position:"relative", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.8)" }}>

        {/* Status Bar */}
        <div style={{ height:44, background:"#060b14", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#f1f5f9" }}>9:41</span>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>●●●</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>WiFi</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>🔋</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ padding:"10px 20px 14px", background:"#0a1628", borderBottom:"1px solid #1e293b", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, textTransform:"uppercase" }}>LessMeds Caregiver</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9", marginTop:1 }}>{patient.name}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: patient.score >= 71 ? "#ef4444" : patient.score >= 41 ? "#f59e0b" : "#22c55e" }}/>
              <div style={{ fontSize:13, fontWeight:700, color: patient.score >= 71 ? "#ef4444" : patient.score >= 41 ? "#f59e0b" : "#22c55e" }}>Score: {patient.score}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding: screen==="messages" ? 0 : 16 }}>
          {screen === "home" && <HomeScreen patient={patient} takenCount={takenCount} pendingCount={pendingCount} onNavigate={setScreen} onMarkTaken={markTaken}/>}
          {screen === "meds" && <MedsScreen meds={meds} onMark={markTaken}/>}
          {screen === "symptoms" && <SymptomsScreen symptoms={symptoms} show={showSymptomForm} setShow={setShowSymptomForm} selected={selectedSymptoms} setSelected={setSelectedSymptoms} notes={symptomNotes} setNotes={setSymptomNotes} onLog={logSymptoms} options={SYMPTOM_OPTIONS}/>}
          {screen === "messages" && <MessagesScreen messages={messages} msgInput={msgInput} setMsgInput={setMsgInput} onSend={sendMessage}/>}
          {screen === "appointments" && <AppointmentsScreen appointments={patient.appointments}/>}
        </div>

        {/* Bottom Nav */}
        <div style={{ height:74, background:"#0a1628", borderTop:"1px solid #1e293b", display:"flex", flexShrink:0 }}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setScreen(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"transparent", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              <span style={{ fontSize:16, opacity: screen===n.id ? 1 : 0.4 }}>{n.icon}</span>
              <span style={{ fontSize:9, letterSpacing:0.5, textTransform:"uppercase", fontWeight:600, color: screen===n.id ? "#06b6d4" : "#64748b" }}>{n.label}</span>
            </button>
          ))}
        </div>

        {/* Toasts */}
        <div style={{ position:"absolute", top:100, left:16, right:16, display:"flex", flexDirection:"column", gap:8, zIndex:10, pointerEvents:"none" }}>
          {toasts.map(t=>(
            <div key={t.id} style={{ padding:"10px 14px", borderRadius:10, background:t.type==="success"?"#052e16":"#0f172a", border:`1px solid ${t.type==="success"?"#16a34a":"#334155"}`, color:"#f1f5f9", fontSize:12, boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"slideDown 0.3s ease" }}>
              {t.type==="success"?"✅ ":"ℹ️ "}{t.msg}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}

function HomeScreen({ patient, takenCount, pendingCount, onNavigate, onMarkTaken }) {
  const nextMed = patient.medications.find(m=>!m.taken);
  return (
    <div>
      {/* Progress Ring */}
      <div style={{ display:"flex", alignItems:"center", gap:16, background:"#0a1628", border:"1px solid #1e293b", borderRadius:16, padding:16, marginBottom:14 }}>
        <svg width={64} height={64} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="5"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="5"
            strokeDasharray={`${(takenCount/patient.medications.length)*163} 163`}
            strokeLinecap="round" transform="rotate(-90 32 32)"/>
          <text x="32" y="36" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="700" fontFamily="monospace">{takenCount}/{patient.medications.length}</text>
        </svg>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>Today's Progress</div>
          <div style={{ fontSize:12, color:"#22c55e", marginTop:2 }}>{takenCount} taken</div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>{pendingCount} remaining</div>
        </div>
      </div>

      {/* Alerts */}
      {patient.alerts.slice(0,2).map(a=>(
        <div key={a.id} style={{ padding:"10px 14px", borderRadius:12, marginBottom:10, display:"flex", gap:10, alignItems:"flex-start",
          background:a.type==="critical"?"#1c0002":"#0f172a", border:`1px solid ${a.type==="critical"?"#ef444466":"#334155"}` }}>
          <span style={{ fontSize:14 }}>{a.type==="critical"?"🔴":a.type==="warning"?"🟡":"🔵"}</span>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color: a.type==="critical"?"#fca5a5":a.type==="warning"?"#fcd34d":"#93c5fd" }}>{a.msg}</div>
            <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{a.time}</div>
          </div>
        </div>
      ))}

      {/* Next Med */}
      {nextMed && (
        <div style={{ background:"#0d1b2a", border:"1px solid #06b6d466", borderRadius:16, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:11, color:"#06b6d4", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Next Medication</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:nextMed.color+"33", border:`1px solid ${nextMed.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💊</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{nextMed.name}</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>{nextMed.dose} · {nextMed.time}</div>
            </div>
            <button onClick={()=>onMarkTaken(nextMed.id)} style={{ padding:"7px 14px", borderRadius:10, border:"none", background:"#06b6d4", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Mark Taken
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"Log Symptoms", icon:"♥", screen:"symptoms", color:"#ef4444" },
          { label:"View Schedule", icon:"▣", screen:"appointments", color:"#06b6d4" },
          { label:"Message Team", icon:"◈", screen:"messages", color:"#8b5cf6" },
          { label:"All Meds", icon:"◎", screen:"meds", color:"#22c55e" },
        ].map(a=>(
          <button key={a.label} onClick={()=>onNavigate(a.screen)} style={{ padding:"14px 12px", borderRadius:14, border:`1px solid ${a.color}33`, background:`${a.color}11`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{a.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:a.color }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MedsScreen({ meds, onMark }) {
  const times = [...new Set(meds.map(m=>m.time))];
  return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:16 }}>Medication List</div>
      {times.map(time=>(
        <div key={time} style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:"#64748b", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📅 {time}</div>
          {meds.filter(m=>m.time===time).map(m=>(
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, background:"#0a1628", border:`1px solid ${m.taken?"#22c55e33":"#1e293b"}`, marginBottom:8, opacity:m.taken?0.7:1 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:m.color+"22", border:`1px solid ${m.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:14 }}>💊</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#f1f5f9" }}>{m.name}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{m.dose}</div>
              </div>
              {m.taken ? (
                <span style={{ fontSize:18 }}>✅</span>
              ) : (
                <button onClick={()=>onMark(m.id)} style={{ padding:"5px 12px", borderRadius:8, border:"1px solid #06b6d4", background:"transparent", color:"#06b6d4", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  Take
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SymptomsScreen({ symptoms, show, setShow, selected, setSelected, notes, setNotes, onLog, options }) {
  function toggle(s) {
    setSelected(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);
  }
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>Symptom Log</div>
        <button onClick={()=>setShow(true)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #06b6d4", background:"rgba(6,182,212,0.1)", color:"#06b6d4", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Report</button>
      </div>

      {show && (
        <div style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:16, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9", marginBottom:12 }}>Report Symptoms</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {options.map(s=>(
              <button key={s} onClick={()=>toggle(s)} style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${selected.includes(s)?"#06b6d4":"#334155"}`, background:selected.includes(s)?"rgba(6,182,212,0.15)":"transparent", color:selected.includes(s)?"#06b6d4":"#94a3b8", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s}</button>
            ))}
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes..." rows={2}
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #1e293b", background:"#0f172a", color:"#f1f5f9", fontSize:12, fontFamily:"'DM Sans',sans-serif", resize:"none", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={()=>setShow(false)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={onLog} style={{ flex:2, padding:"8px", borderRadius:8, border:"none", background:"#06b6d4", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Submit to Care Team</button>
          </div>
        </div>
      )}

      {symptoms.length === 0 && !show && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#64748b", fontSize:13 }}>No symptoms logged yet.<br/>Tap + Report to log symptoms.</div>
      )}

      {symptoms.map(s=>(
        <div key={s.id} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:11, color:"#64748b" }}>{s.date} · {s.time}</span>
            <span style={{ fontSize:11, color:"#f59e0b" }}>Reported to care team</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {s.symptoms.map(sym=><span key={sym} style={{ padding:"3px 8px", borderRadius:20, background:"#1e293b", color:"#94a3b8", fontSize:11 }}>{sym}</span>)}
          </div>
          {s.notes && <div style={{ marginTop:8, fontSize:12, color:"#64748b", fontStyle:"italic" }}>{s.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function MessagesScreen({ messages, msgInput, setMsgInput, onSend }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e293b", background:"#0a1628", flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>Secure Messaging</div>
        <div style={{ fontSize:11, color:"#22c55e", marginTop:1 }}>🔒 End-to-end encrypted · No PHI in notifications</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        {messages.map(m=>(
          <div key={m.id} style={{ display:"flex", justifyContent:m.outgoing?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:m.outgoing?"16px 4px 16px 16px":"4px 16px 16px 16px",
              background:m.outgoing?"#06b6d4":"#1e293b", color:m.outgoing?"#000":"#f1f5f9" }}>
              {!m.outgoing && <div style={{ fontSize:10, fontWeight:700, color:"#06b6d4", marginBottom:3 }}>{m.from}</div>}
              <div style={{ fontSize:13, lineHeight:1.4 }}>{m.text}</div>
              <div style={{ fontSize:10, color:m.outgoing?"#00000066":"#64748b", marginTop:3, textAlign:"right" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:12, borderTop:"1px solid #1e293b", background:"#0a1628", display:"flex", gap:8, flexShrink:0 }}>
        <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()}
          placeholder="Secure message..." style={{ flex:1, padding:"10px 14px", borderRadius:24, border:"1px solid #1e293b", background:"#0f172a", color:"#f1f5f9", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
        <button onClick={onSend} style={{ width:40, height:40, borderRadius:"50%", border:"none", background:"#06b6d4", color:"#000", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>→</button>
      </div>
    </div>
  );
}

function AppointmentsScreen({ appointments }) {
  return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:16 }}>Upcoming Appointments</div>
      {appointments.map(a=>(
        <div key={a.id} style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:16, padding:16, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(6,182,212,0.15)", border:"1px solid #06b6d433", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📅</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{a.title}</div>
              <div style={{ fontSize:12, color:"#06b6d4", marginTop:2 }}>{a.doctor}</div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{a.date} · {a.time}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>📍 {a.location}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Add to Calendar</button>
            <button style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid #06b6d4", background:"rgba(6,182,212,0.1)", color:"#06b6d4", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Join Telehealth</button>
          </div>
        </div>
      ))}
    </div>
  );
}
