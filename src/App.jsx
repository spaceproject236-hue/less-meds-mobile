import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

const themes = {
  dark: {
    bg: "#080f1a",
    surface: "#0d1829",
    surfaceAlt: "#111f33",
    border: "#1e3a5f",
    borderLight: "#162d4a",
    text: "#e8f4fd",
    textSub: "#7eb3d4",
    textMuted: "#3d6a8a",
    accent: "#06b6d4",
    accentDim: "#0e4a5c",
    accentGlow: "rgba(6,182,212,0.15)",
    success: "#10b981",
    successDim: "#064e3b",
    warning: "#f59e0b",
    warningDim: "#451a03",
    danger: "#ef4444",
    dangerDim: "#450a0a",
    cardBg: "#0d1829",
    navBg: "#060d18",
    pillBg: "#0e2a40",
  },
  light: {
    bg: "#f0f6ff",
    surface: "#ffffff",
    surfaceAlt: "#f8faff",
    border: "#c7ddf5",
    borderLight: "#daeaf8",
    text: "#0a1929",
    textSub: "#3a6a9a",
    textMuted: "#8aabcc",
    accent: "#0369a1",
    accentDim: "#dbeafe",
    accentGlow: "rgba(3,105,161,0.10)",
    success: "#059669",
    successDim: "#d1fae5",
    warning: "#d97706",
    warningDim: "#fef3c7",
    danger: "#dc2626",
    dangerDim: "#fee2e2",
    cardBg: "#ffffff",
    navBg: "#ffffff",
    pillBg: "#e0f0ff",
  },
};

// ─── Risk Algorithm (same logic as clinical app) ──────────────────────────────
const HIGH_RISK_DRUGS = ["warfarin", "digoxin", "amiodarone", "methotrexate", "lithium", "opioid", "oxycodone", "hydrocodone", "morphine", "fentanyl"];
const INTERACTION_PAIRS = [
  ["warfarin", "aspirin"], ["warfarin", "ibuprofen"], ["metformin", "contrast"],
  ["lisinopril", "potassium"], ["digoxin", "amiodarone"], ["lithium", "ibuprofen"],
];

function computeFreeScore(meds) {
  let score = 0;
  const flags = [];
  const names = meds.map(m => m.name.toLowerCase());

  if (meds.length >= 10) { score += 30; flags.push({ label: "High Polypharmacy", detail: `${meds.length} medications`, type: "danger" }); }
  else if (meds.length >= 5) { score += 15; flags.push({ label: "Polypharmacy", detail: `${meds.length} medications`, type: "warning" }); }

  let interactions = 0;
  INTERACTION_PAIRS.forEach(([a, b]) => {
    if (names.some(n => n.includes(a)) && names.some(n => n.includes(b))) {
      interactions++;
      flags.push({ label: "Drug Interaction", detail: `${a.charAt(0).toUpperCase() + a.slice(1)} + ${b.charAt(0).toUpperCase() + b.slice(1)}`, type: "danger" });
    }
  });
  score += Math.min(interactions * 10, 30);

  HIGH_RISK_DRUGS.forEach(drug => {
    if (names.some(n => n.includes(drug))) {
      score += 7;
      flags.push({ label: "High-Risk Medication", detail: drug.charAt(0).toUpperCase() + drug.slice(1), type: "warning" });
    }
  });

  return { score: Math.min(score, 100), flags };
}

function getRiskLevel(score) {
  if (score <= 40) return { label: "Low Risk", color: "success", emoji: "🟢" };
  if (score <= 70) return { label: "Moderate Risk", color: "warning", emoji: "🟡" };
  return { label: "High Risk", color: "danger", emoji: "🔴" };
}

// ─── Dr. Canterbury Videos ────────────────────────────────────────────────────
const VIDEOS = [
  {
    id: "v1",
    title: "The Hidden Danger of Too Many Pills",
    subtitle: "TEDx Talk • 18 min",
    desc: "Dr. Canterbury reveals how polypharmacy silently undermines quality of life in elderly patients — and what caregivers can do about it.",
    tag: "Featured",
    tagColor: "accent",
    thumb: "🎤",
    year: "2023",
  },
  {
    id: "v2",
    title: "Deprescribing: The Art of Letting Go",
    subtitle: "Grand Rounds Lecture • 42 min",
    desc: "A deep dive into evidence-based frameworks for safely reducing medication burden in patients over 65.",
    tag: "Clinical",
    tagColor: "success",
    thumb: "🏥",
    year: "2024",
  },
  {
    id: "v3",
    title: "Talking to Your Doctor About Fewer Meds",
    subtitle: "Caregiver Guide • 12 min",
    desc: "Practical scripts and conversation starters for family caregivers who want to advocate for deprescribing at the next appointment.",
    tag: "For Caregivers",
    tagColor: "warning",
    thumb: "💬",
    year: "2024",
  },
  {
    id: "v4",
    title: "Polypharmacy & Dementia Risk",
    subtitle: "Research Seminar • 28 min",
    desc: "Emerging research linking high medication burden to accelerated cognitive decline — and the implications for treatment decisions.",
    tag: "Research",
    tagColor: "accent",
    thumb: "🧠",
    year: "2023",
  },
  {
    id: "v5",
    title: "Falls, Fractures & the Medication Connection",
    subtitle: "Patient Safety Talk • 22 min",
    desc: "How certain medication combinations dramatically increase fall risk, and which drugs are most often overlooked.",
    tag: "Safety",
    tagColor: "danger",
    thumb: "⚠️",
    year: "2024",
  },
  {
    id: "v6",
    title: "When Less Is More: A Geriatrician's Approach",
    subtitle: "Interview Series • 35 min",
    desc: "Dr. Canterbury in conversation with leading geriatricians on building systematic deprescribing into routine care.",
    tag: "Interview",
    tagColor: "success",
    thumb: "🎙️",
    year: "2025",
  },
];

// ─── Shared styles ─────────────────────────────────────────────────────────────
const font = "'DM Sans', sans-serif";

function Pill({ children, color = "accent", t }) {
  const th = themes[t];
  const map = { accent: [th.accentDim, th.accent], success: [th.successDim, th.success], warning: [th.warningDim, th.warning], danger: [th.dangerDim, th.danger] };
  const [bg, fg] = map[color] || map.accent;
  return (
    <span style={{ background: bg, color: fg, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: font }}>
      {children}
    </span>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function LessMedsFree() {
  const [theme, setTheme] = useState("dark");
  const [screen, setScreen] = useState("home"); // home | checker | results | resources
  const [meds, setMeds] = useState([]);
  const [result, setResult] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [pricingTab, setPricingTab] = useState("monthly");
  const t = themes[theme];

  // Animate nav active indicator
  const navItems = [
    { id: "home", icon: "⬡", label: "Home" },
    { id: "checker", icon: "⊕", label: "Checker" },
    { id: "resources", icon: "▶", label: "Resources" },
  ];

  const appStyle = {
    fontFamily: font,
    background: t.bg,
    color: t.text,
    minHeight: "100vh",
    paddingBottom: 72,
    transition: "background 0.3s, color 0.3s",
  };

  const navStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    background: t.navBg,
    borderTop: `1px solid ${t.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 100,
    backdropFilter: "blur(12px)",
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      <div style={appStyle}>
        {/* Header */}
        <header style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${t.border}`,
          background: t.navBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${t.accent}, #0891b2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>💊</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, lineHeight: 1 }}>
                Less<span style={{ color: t.accent }}>Meds</span>
              </div>
              <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.2 }}>Polypharmacy Risk Tool</div>
            </div>
          </div>
          <button
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{
              background: t.pillBg, border: `1px solid ${t.border}`, borderRadius: 8,
              padding: "6px 12px", color: t.textSub, fontSize: 13, cursor: "pointer",
              fontFamily: font,
            }}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        {/* Screens */}
        {screen === "home" && <HomeScreen t={t} theme={theme} onStart={() => setScreen("checker")} onResources={() => setScreen("resources")} />}
        {screen === "checker" && <CheckerScreen t={t} theme={theme} meds={meds} setMeds={setMeds} onResult={(r) => { setResult(r); setScreen("results"); }} />}
        {screen === "results" && result && <ResultsScreen t={t} theme={theme} result={result} meds={meds} pricingTab={pricingTab} setPricingTab={setPricingTab} onBack={() => setScreen("checker")} onResources={() => setScreen("resources")} />}
        {screen === "resources" && <ResourcesScreen t={t} theme={theme} activeVideo={activeVideo} setActiveVideo={setActiveVideo} />}

        {/* Bottom Nav */}
        <nav style={navStyle}>
          {navItems.map(item => {
            const active = screen === item.id || (item.id === "checker" && screen === "results");
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "8px 20px",
                  color: active ? t.accent : t.textMuted,
                  fontFamily: font,
                  transition: "color 0.2s",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.5 }}>{item.label}</span>
                {active && <span style={{ width: 4, height: 4, borderRadius: 2, background: t.accent, marginTop: -2 }} />}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ t, onStart, onResources }) {
  const stats = [
    { value: "40%", label: "of adults 65+ take 5+ meds daily" },
    { value: "2×", label: "higher fall risk with 5+ medications" },
    { value: "30%", label: "of hospital admissions are drug-related" },
  ];

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Hero */}
      <div style={{
        padding: "36px 24px 32px",
        background: `linear-gradient(160deg, ${t.surfaceAlt} 0%, ${t.bg} 100%)`,
        borderBottom: `1px solid ${t.border}`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative bg circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: t.accentGlow, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: t.accentGlow, pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.accentDim, borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: t.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Free Risk Assessment</span>
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 32, fontWeight: 400, lineHeight: 1.15,
            margin: "0 0 12px",
            letterSpacing: -0.5,
          }}>
            Is your loved one on<br /><em style={{ color: t.accent }}>too many medications?</em>
          </h1>

          <p style={{ color: t.textSub, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 340 }}>
            Polypharmacy — taking 5 or more medications — is one of the most under-recognized health risks for seniors. Check the risk in under 2 minutes.
          </p>

          <button
            onClick={onStart}
            style={{
              background: `linear-gradient(135deg, ${t.accent}, #0891b2)`,
              border: "none", borderRadius: 12,
              padding: "14px 28px",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: font,
              boxShadow: `0 8px 24px ${t.accentGlow}`,
              width: "100%",
              letterSpacing: 0.2,
            }}
          >
            Start Free Medication Check →
          </button>
          <p style={{ color: t.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 }}>No sign-up required • No PHI collected</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "24px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: "14px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.accent, fontFamily: "'DM Serif Display', serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: t.textSub, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dr. Canterbury callout */}
      <div style={{ margin: "20px 20px 0" }}>
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: "20px",
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${t.accent}33, ${t.accentDim})`,
            border: `2px solid ${t.accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>👨‍⚕️</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Dr. DeLon Canterbury</div>
            <div style={{ color: t.accent, fontSize: 11, fontWeight: 500, marginBottom: 6 }}>Geriatrician & Deprescribing Expert</div>
            <p style={{ color: t.textSub, fontSize: 13, lineHeight: 1.5, margin: "0 0 12px" }}>
              "Most of my patients come to me on 10+ medications. Many of them don't need half of what they're taking. The question isn't just what to take — it's what to stop."
            </p>
            <button
              onClick={onResources}
              style={{
                background: "none", border: `1px solid ${t.accent}`,
                borderRadius: 8, padding: "7px 14px",
                color: t.accent, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: font,
              }}
            >
              Watch his talks →
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ margin: "24px 20px 0" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>How It Works</h2>
        {[
          { step: "1", title: "Enter medications", desc: "Add your loved one's current medications — just the name, dose, and frequency.", icon: "💊" },
          { step: "2", title: "Get a risk score", desc: "Our algorithm checks for polypharmacy, drug interactions, and high-risk combinations.", icon: "📊" },
          { step: "3", title: "Take action", desc: "If risk is detected, connect with a clinical pharmacist for an official review.", icon: "🩺" },
        ].map((item) => (
          <div key={item.step} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: t.surfaceAlt, border: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
              <div style={{ color: t.textSub, fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Checker Screen ───────────────────────────────────────────────────────────
function CheckerScreen({ t, meds, setMeds, onResult }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("Once daily");
  const [error, setError] = useState("");
  const inputRef = useRef();

  const freqs = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every other day", "Weekly", "As needed"];

  const addMed = () => {
    if (!name.trim()) { setError("Please enter a medication name."); return; }
    setMeds(prev => [...prev, { id: Date.now(), name: name.trim(), dose: dose.trim() || "—", freq }]);
    setName(""); setDose(""); setError("");
    inputRef.current?.focus();
  };

  const removeMed = (id) => setMeds(prev => prev.filter(m => m.id !== id));

  const handleRun = () => {
    if (meds.length === 0) { setError("Add at least one medication to check."); return; }
    const { score, flags } = computeFreeScore(meds);
    onResult({ score, flags, medCount: meds.length });
  };

  const inputStyle = {
    background: t.surfaceAlt, border: `1px solid ${t.border}`,
    borderRadius: 10, padding: "12px 14px",
    color: t.text, fontSize: 14, fontFamily: font,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px 20px" }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, margin: "0 0 4px" }}>Medication Checker</h2>
      <p style={{ color: t.textSub, fontSize: 14, margin: "0 0 24px" }}>Enter current medications. No names or identifying information needed.</p>

      {/* Add form */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: "18px", marginBottom: 20,
      }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Medication Name *</label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && addMed()}
            placeholder="e.g. Metformin, Lisinopril, Aspirin..."
            style={inputStyle}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Dose</label>
            <input
              value={dose}
              onChange={e => setDose(e.target.value)}
              placeholder="e.g. 500mg"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Frequency</label>
            <select
              value={freq}
              onChange={e => setFreq(e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
            >
              {freqs.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ color: t.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button
          onClick={addMed}
          style={{
            background: t.accentDim, border: `1px solid ${t.accent}`,
            borderRadius: 10, padding: "10px 0",
            color: t.accent, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: font, width: "100%",
          }}
        >
          + Add Medication
        </button>
      </div>

      {/* Medication list */}
      {meds.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
            Added Medications ({meds.length})
          </div>
          {meds.map((m, i) => (
            <div key={m.id} style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 10, padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
              animation: "fadeIn 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: t.pillBg, color: t.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ color: t.textSub, fontSize: 12 }}>{m.dose} · {m.freq}</div>
                </div>
              </div>
              <button
                onClick={() => removeMed(m.id)}
                style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Risk indicator hint */}
      {meds.length >= 5 && (
        <div style={{
          background: t.warningDim, border: `1px solid ${t.warning}33`,
          borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ color: t.warning, fontSize: 13 }}>
            {meds.length} medications detected — this exceeds the polypharmacy threshold.
          </span>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={meds.length === 0}
        style={{
          width: "100%",
          background: meds.length === 0 ? t.surfaceAlt : `linear-gradient(135deg, ${t.accent}, #0891b2)`,
          border: "none", borderRadius: 12,
          padding: "15px 0",
          color: meds.length === 0 ? t.textMuted : "#fff",
          fontSize: 15, fontWeight: 600,
          cursor: meds.length === 0 ? "not-allowed" : "pointer",
          fontFamily: font,
          boxShadow: meds.length > 0 ? `0 8px 24px ${t.accentGlow}` : "none",
          transition: "all 0.2s",
        }}
      >
        {meds.length === 0 ? "Add medications to check" : `Analyze ${meds.length} Medication${meds.length > 1 ? "s" : ""} →`}
      </button>

      <p style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
        This tool is for informational purposes only and does not replace professional medical advice.
      </p>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function ResultsScreen({ t, result, meds, pricingTab, setPricingTab, onBack, onResources }) {
  const risk = getRiskLevel(result.score);
  const colorKey = risk.color;
  const fgColor = t[colorKey];
  const bgColor = t[colorKey + "Dim"];

  // Animated score fill
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = result.score;
    const timer = setInterval(() => {
      start += 2;
      if (start >= end) { setDisplayScore(end); clearInterval(timer); }
      else setDisplayScore(start);
    }, 16);
    return () => clearInterval(timer);
  }, [result.score]);

  const circumference = 2 * Math.PI * 42;
  const strokeDash = (displayScore / 100) * circumference;

  return (
    <div style={{ padding: "24px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 20, fontFamily: font }}>
        ← Edit medications
      </button>

      {/* Score card */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 20, padding: "28px 24px", textAlign: "center",
        marginBottom: 20, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${fgColor}, transparent)` }} />

        <div style={{ marginBottom: 16 }}>
          <svg width="110" height="110" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke={t.border} strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={fgColor} strokeWidth="8"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.05s linear" }}
            />
            <text x="50" y="45" textAnchor="middle" fill={t.text} fontSize="20" fontWeight="700" fontFamily="DM Sans">{displayScore}</text>
            <text x="50" y="60" textAnchor="middle" fill={t.textMuted} fontSize="9" fontFamily="DM Sans">/ 100</text>
          </svg>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: bgColor, borderRadius: 20, padding: "6px 16px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 14 }}>{risk.emoji}</span>
          <span style={{ color: fgColor, fontWeight: 700, fontSize: 14 }}>{risk.label}</span>
        </div>

        <div style={{ color: t.textSub, fontSize: 13, lineHeight: 1.5 }}>
          Based on <strong style={{ color: t.text }}>{result.medCount} medication{result.medCount !== 1 ? "s" : ""}</strong> analyzed
        </div>
      </div>

      {/* Flags */}
      {result.flags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Risk Factors Detected</div>
          {result.flags.map((f, i) => {
            const fg = t[f.type];
            const bg = t[f.type + "Dim"];
            return (
              <div key={i} style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderLeft: `3px solid ${fg}`,
                borderRadius: 10, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</span>
                <span style={{ background: bg, color: fg, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{f.detail}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* No flags */}
      {result.flags.length === 0 && (
        <div style={{
          background: t.successDim, border: `1px solid ${t.success}33`,
          borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontWeight: 600, color: t.success, fontSize: 14 }}>No major risk factors found</div>
            <div style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>Consider a clinical review for a thorough assessment.</div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background: t.surfaceAlt, borderRadius: 10, padding: "10px 14px", marginBottom: 24,
        fontSize: 12, color: t.textMuted, lineHeight: 1.5,
      }}>
        ⚠️ This score is for informational use only. Only a licensed clinician can evaluate true medication safety.
      </div>

      {/* Pricing CTA */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 20, padding: "24px 20px", marginBottom: 20,
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, marginBottom: 6 }}>
            Get an Official Clinical Review
          </div>
          <p style={{ color: t.textSub, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            A licensed pharmacist will review every medication, identify interactions, and work with your physician on a deprescribing plan.
          </p>
        </div>

        {/* Toggle tabs */}
        <div style={{
          display: "flex", background: t.surfaceAlt, borderRadius: 12, padding: 4,
          marginBottom: 20,
        }}>
          {[["monthly", "Monthly"], ["onetime", "One-Time"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPricingTab(key)}
              style={{
                flex: 1, border: "none", borderRadius: 9, padding: "9px 0",
                background: pricingTab === key ? t.accent : "transparent",
                color: pricingTab === key ? "#fff" : t.textSub,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font,
                transition: "all 0.2s", position: "relative",
              }}
            >
              {label}
              {key === "monthly" && <span style={{
                position: "absolute", top: -8, right: 8,
                background: t.success, color: "#fff",
                fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                letterSpacing: 0.5, textTransform: "uppercase",
              }}>Best</span>}
            </button>
          ))}
        </div>

        {pricingTab === "monthly" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, fontWeight: 400 }}>$29</span>
              <span style={{ color: t.textSub, fontSize: 14 }}>/month</span>
            </div>
            <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 16 }}>Cancel anytime</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", textAlign: "left" }}>
              {[
                "Full medication safety review",
                "Ongoing monitoring & adjustments",
                "Direct pharmacist messaging",
                "Caregiver app access",
                "Monthly score updates",
                "Physician coordination included",
              ].map(item => (
                <li key={item} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: t.success, fontSize: 14 }}>✓</span>
                  <span style={{ color: t.textSub }}>{item}</span>
                </li>
              ))}
            </ul>
            <button style={{
              width: "100%",
              background: `linear-gradient(135deg, ${t.accent}, #0891b2)`,
              border: "none", borderRadius: 12, padding: "14px 0",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: font,
              boxShadow: `0 8px 24px ${t.accentGlow}`,
            }}>
              Start Monthly Plan →
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, fontWeight: 400 }}>$79</span>
              <span style={{ color: t.textSub, fontSize: 14 }}> one-time</span>
            </div>
            <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 16 }}>Single comprehensive review</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", textAlign: "left" }}>
              {[
                "One-time full medication review",
                "Written clinical report",
                "Interaction & risk analysis",
                "Physician-ready recommendations",
              ].map(item => (
                <li key={item} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: t.success, fontSize: 14 }}>✓</span>
                  <span style={{ color: t.textSub }}>{item}</span>
                </li>
              ))}
            </ul>
            <button style={{
              width: "100%",
              background: `linear-gradient(135deg, ${t.accent}, #0891b2)`,
              border: "none", borderRadius: 12, padding: "14px 0",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: font,
              boxShadow: `0 8px 24px ${t.accentGlow}`,
            }}>
              Request One-Time Review →
            </button>
            <button
              onClick={() => setPricingTab("monthly")}
              style={{
                width: "100%", background: "none", border: "none",
                color: t.accent, fontSize: 12, marginTop: 10, cursor: "pointer", fontFamily: font,
              }}
            >
              Switch to monthly for ongoing monitoring ↓
            </button>
          </div>
        )}
      </div>

      {/* Resource nudge */}
      <div
        onClick={onResources}
        style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: "16px", cursor: "pointer",
          display: "flex", gap: 14, alignItems: "center",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: t.accentDim, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>▶</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Learn from Dr. Canterbury</div>
          <div style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>Videos on polypharmacy, deprescribing & caregiver advocacy</div>
        </div>
        <span style={{ color: t.textMuted, marginLeft: "auto" }}>›</span>
      </div>
    </div>
  );
}

// ─── Resources Screen ─────────────────────────────────────────────────────────
function ResourcesScreen({ t, activeVideo, setActiveVideo }) {
  const tagColorMap = { accent: [t.accentDim, t.accent], success: [t.successDim, t.success], warning: [t.warningDim, t.warning], danger: [t.dangerDim, t.danger] };

  return (
    <div style={{ padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, margin: "0 0 4px" }}>
          Resource Center
        </h2>
        <p style={{ color: t.textSub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Expert talks and guides from Dr. DeLon Canterbury on polypharmacy and deprescribing.
        </p>
      </div>

      {/* Dr. Canterbury bio card */}
      <div style={{
        background: `linear-gradient(135deg, ${t.surfaceAlt}, ${t.surface})`,
        border: `1px solid ${t.border}`,
        borderRadius: 16, padding: "18px", marginBottom: 24,
        display: "flex", gap: 14, alignItems: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${t.accent}44, ${t.accentDim})`,
          border: `2px solid ${t.accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>👨‍⚕️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. DeLon Canterbury</div>
          <div style={{ color: t.accent, fontSize: 12, fontWeight: 500 }}>MD · Geriatric Medicine</div>
          <div style={{ color: t.textSub, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
            Nationally recognized expert in polypharmacy, deprescribing, and medication safety for older adults.
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
        {VIDEOS.length} Videos & Talks
      </div>

      {VIDEOS.map(video => {
        const [tagBg, tagFg] = tagColorMap[video.tagColor] || tagColorMap.accent;
        const isActive = activeVideo === video.id;

        return (
          <div
            key={video.id}
            onClick={() => setActiveVideo(isActive ? null : video.id)}
            style={{
              background: t.surface,
              border: `1px solid ${isActive ? t.accent : t.border}`,
              borderRadius: 14, padding: "16px",
              marginBottom: 12, cursor: "pointer",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: isActive ? `0 0 0 1px ${t.accent}33, 0 4px 20px ${t.accentGlow}` : "none",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Thumbnail placeholder */}
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: isActive ? t.accentDim : t.surfaceAlt,
                border: `1px solid ${isActive ? t.accent : t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, transition: "all 0.2s",
              }}>
                {isActive ? "▶" : video.thumb}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, flex: 1 }}>{video.title}</div>
                  <span style={{ background: tagBg, color: tagFg, borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 }}>
                    {video.tag}
                  </span>
                </div>
                <div style={{ color: t.accent, fontSize: 11, fontWeight: 500, marginBottom: 6 }}>{video.subtitle} · {video.year}</div>
                <div style={{ color: t.textSub, fontSize: 12, lineHeight: 1.5 }}>{video.desc}</div>
              </div>
            </div>

            {/* Expanded: Video embed placeholder */}
            {isActive && (
              <div style={{
                marginTop: 14,
                background: t.surfaceAlt,
                border: `1px solid ${t.border}`,
                borderRadius: 10, height: 180,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 8,
                animation: "fadeIn 0.2s ease",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: t.accentDim, border: `1px solid ${t.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, color: t.accent,
                }}>▶</div>
                <div style={{ color: t.textSub, fontSize: 13, fontWeight: 500 }}>YouTube embed goes here</div>
                <div style={{ color: t.textMuted, fontSize: 11 }}>Paste Dr. Canterbury's video URL to activate</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Footer note */}
      <div style={{
        marginTop: 8, padding: "14px 16px",
        background: t.surfaceAlt, borderRadius: 12,
        color: t.textMuted, fontSize: 12, lineHeight: 1.5, textAlign: "center",
      }}>
        More videos added regularly. Subscribe to LessMeds for the latest content from Dr. Canterbury.
      </div>
    </div>
  );
}
