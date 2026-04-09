import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const DEFAULTS = {
  baseSalary: 5000,
  threshold: 8000,
  bonusPct: 25,
  billing: 12000,
  sideRate: 25,
  overhead: 1100,
  monthlyHours: 158,
};

const B = {
  lemon: "#e6ff99",
  lemonDark: "#c8e040",
  sea: "#537f7b",
  turq: "#caebed",
  beige: "#f5f2ea",
  cream: "#faf8f3",
  dark: "#1a2e2c",
  acc: "#3d5f5c",
  warm: "#e8e0d0",
};

const fonts = {
  display: "'DM Serif Display', Georgia, serif",
  body: "'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const card = {
  background: "#fff",
  borderRadius: 14,
  padding: "24px 22px",
  marginBottom: 20,
  boxShadow: "0 2px 12px rgba(26,46,44,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  transition: "box-shadow 0.3s ease, transform 0.3s ease",
};

const cardHover = {
  boxShadow: "0 8px 30px rgba(26,46,44,0.1), 0 2px 8px rgba(0,0,0,0.06)",
  transform: "translateY(-1px)",
};

const sectionHeader = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#a09888",
  fontFamily: fonts.body,
};

const fmt = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// --- Hoverable card wrapper ---

const Card = ({ children, style = {}, className = "" }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={className}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...card, ...style, ...(hovered ? cardHover : {}) }}>
      {children}
    </div>
  );
};

// --- URL state persistence ---

const URL_KEYS = ["baseSalary", "bonusPct", "billing", "sideRate", "overhead", "threshold", "thresholdMode"];

const readUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  const state = {};
  URL_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val !== null) {
      state[key] = key === "thresholdMode" ? val : Number(val);
    }
  });
  return state;
};

const writeUrlState = (state) => {
  const params = new URLSearchParams();
  const isDefault = (key, val) => {
    if (key === "thresholdMode") return val === "multiplier";
    if (key === "threshold") return false;
    return DEFAULTS[key] === val;
  };
  Object.entries(state).forEach(([key, val]) => {
    if (!isDefault(key, val)) {
      params.set(key, String(val));
    }
  });
  const qs = params.toString();
  const url = window.location.pathname + (qs ? "?" + qs : "");
  window.history.replaceState(null, "", url);
};

// --- Animated number ---

const AnimatedValue = ({ value, format = fmt, suffix = "" }) => {
  const ref = useRef(null);
  const prevRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;
    if (from === to || !ref.current) return;
    const duration = 280;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      if (ref.current) ref.current.textContent = format(Math.round(current)) + suffix;
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, format, suffix]);

  return <span ref={ref}>{format(Math.round(value)) + suffix}</span>;
};

// --- Slider with inline input ---

const Slider = ({ label, value, onChange, min, max, step, unit = "\u20AC", color = B.sea }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(value));
  const inputRef = useRef(null);

  const pct = ((value - min) / (max - min)) * 100;
  const bg = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, ${B.warm} ${pct}%, ${B.warm} 100%)`;

  const commitInput = () => {
    const n = Number(inputVal);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };

  const startEditing = () => {
    setInputVal(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const valueDisplay = editing ? (
    <input ref={inputRef} type="text" value={inputVal}
      onChange={(e) => setInputVal(e.target.value)}
      onBlur={commitInput}
      onKeyDown={(e) => { if (e.key === "Enter") commitInput(); if (e.key === "Escape") setEditing(false); }}
      style={{ fontSize: 18, fontWeight: 600, color, fontFamily: fonts.mono, width: 90, textAlign: "right",
        border: `1.5px solid ${color}`, borderRadius: 6, padding: "2px 6px", outline: "none", background: "rgba(255,255,255,0.5)" }} />
  ) : (
    <span onClick={startEditing}
      style={{ fontSize: 18, fontWeight: 600, color, fontFamily: fonts.mono, cursor: "text",
        borderBottom: `1px dashed ${color}30`, transition: "border-color 0.2s" }}>
      {fmt(value)} {unit}
    </span>
  );

  return (
    <div style={{ marginBottom: 22 }}>
      {label ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: B.dark, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fonts.body }}>{label}</span>
          {valueDisplay}
        </div>
      ) : (
        <div style={{ textAlign: "right", marginBottom: 6 }}>{valueDisplay}</div>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 5, appearance: "none", WebkitAppearance: "none", borderRadius: 4, outline: "none", cursor: "pointer", accentColor: color, background: bg }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#b0a898", marginTop: 4, fontFamily: fonts.mono }}>
        <span>{fmt(min)} {unit}</span><span>{fmt(max)} {unit}</span>
      </div>
    </div>
  );
};

// --- Row with animated values ---

const Row = ({ label, value, hl, sub }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: sub ? "5px 0 5px 18px" : "10px 0",
    borderBottom: hl ? "none" : "1px solid rgba(26,46,44,0.05)",
    background: hl ? `linear-gradient(135deg, ${B.lemon}90, ${B.lemon}50)` : "transparent",
    borderRadius: hl ? 8 : 0,
    margin: hl ? "6px -10px" : 0,
    paddingLeft: hl ? 12 : sub ? 18 : 0,
    paddingRight: hl ? 12 : 0,
    transition: "background 0.3s ease",
  }}>
    <span style={{ fontSize: sub ? 12 : 13, color: sub ? "#8a8070" : B.dark, fontWeight: hl ? 700 : sub ? 400 : 500, fontFamily: fonts.body }}>{label}</span>
    <span style={{ fontSize: hl ? 17 : 13, fontWeight: hl ? 800 : 600, fontFamily: fonts.mono, color: hl ? B.dark : B.acc }}>
      {typeof value === "string" ? value : <><AnimatedValue value={value} /> {"\u20AC"}</>}
    </span>
  </div>
);

// --- Donut chart ---

const DonutChart = ({ salary, sideCosts, holidayReserve, overhead, margin, billing }) => {
  if (billing <= 0) return null;
  const segments = [
    { label: "Salary", value: salary, color: B.sea },
    { label: "Side Costs", value: sideCosts, color: B.turq },
    { label: "Holiday Reserve", value: holidayReserve, color: "#a8d8d0" },
    { label: "Overhead", value: overhead, color: B.warm },
    { label: "Margin", value: Math.max(0, margin), color: B.lemon },
  ];
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const R = 60, r = 38, cx = 80, cy = 70;
  let angle = -Math.PI / 2;

  const arcs = segments.map((seg) => {
    const frac = seg.value / total;
    if (frac <= 0) return null;
    const startAngle = angle;
    const endAngle = angle + frac * 2 * Math.PI;
    angle = endAngle;
    const largeArc = frac > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(startAngle), iy1 = cy + r * Math.sin(startAngle);
    const ix2 = cx + r * Math.cos(endAngle), iy2 = cy + r * Math.sin(endAngle);
    const d = `M${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${largeArc},0 ${ix1},${iy1} Z`;
    return { ...seg, d, frac };
  }).filter(Boolean);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
      <svg viewBox="0 0 160 140" style={{ width: 140, flexShrink: 0 }}>
        {arcs.map((a) => (
          <path key={a.label} d={a.d} fill={a.color} stroke="#fff" strokeWidth={1.5} style={{ transition: "d 0.3s ease" }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={8} fill="#a09888" fontFamily={fonts.body}>billing</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fontSize={12} fill={B.dark} fontWeight={700} fontFamily={fonts.mono}>{fmt(billing)}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {arcs.map((a) => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: fonts.body }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
            <span style={{ color: B.dark, fontWeight: 500 }}>{a.label}</span>
            <span style={{ color: "#a09888", fontFamily: fonts.mono, fontSize: 10 }}>{(a.frac * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Salary chart with billing indicator ---

const SalaryChart = ({ baseSalary, threshold, bonusPct, billing }) => {
  const W = 800, H = 340, PL = 65, PR = 20, PT = 24, PB = 40;
  const cw = W - PL - PR, ch = H - PT - PB;
  const maxBill = 25000;
  const pts = [];
  for (let b = 0; b <= maxBill; b += 500) {
    const bon = b > threshold ? ((b - threshold) * bonusPct) / 100 : 0;
    pts.push({ b, s: baseSalary + bon });
  }
  const maxS = Math.max(pts[pts.length - 1].s, baseSalary * 1.8);
  const xp = (v) => PL + (v / maxBill) * cw;
  const yp = (v) => PT + ch - (v / maxS) * ch;

  const linePath = pts.map((p, i) =>
    (i === 0 ? "M" : "L") + xp(p.b).toFixed(1) + "," + yp(p.s).toFixed(1)
  ).join(" ");

  const areaPath = linePath + ` L${xp(maxBill).toFixed(1)},${yp(0).toFixed(1)} L${xp(0).toFixed(1)},${yp(0).toFixed(1)} Z`;

  const bonusPts = pts.filter((p) => p.b >= threshold);
  let bonusPath = "";
  if (bonusPts.length > 1) {
    bonusPath = bonusPts.map((p, i) =>
      (i === 0 ? "M" : "L") + xp(p.b).toFixed(1) + "," + yp(p.s).toFixed(1)
    ).join(" ");
    bonusPath += ` L${xp(maxBill).toFixed(1)},${yp(baseSalary).toFixed(1)} L${xp(threshold).toFixed(1)},${yp(baseSalary).toFixed(1)} Z`;
  }

  const yTicks = [];
  const ySt = maxS <= 8000 ? 1000 : 2000;
  for (let v = 0; v <= maxS; v += ySt) yTicks.push(v);
  const xTicks = [0, 5000, 10000, 15000, 20000, 25000];

  const curBonus = billing > threshold ? ((billing - threshold) * bonusPct) / 100 : 0;
  const curSalary = baseSalary + curBonus;
  const bx = xp(Math.min(billing, maxBill));
  const by = yp(curSalary);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {yTicks.map((v) => (
        <g key={"y" + v}>
          <line x1={PL} x2={W - PR} y1={yp(v)} y2={yp(v)} stroke={B.warm} strokeWidth={1} />
          <text x={PL - 8} y={yp(v) + 3} textAnchor="end" fontSize={9} fill="#b0a898" fontFamily={fonts.mono}>{(v / 1000).toFixed(0) + "k"}</text>
        </g>
      ))}
      {xTicks.map((v) => (
        <text key={"x" + v} x={xp(v)} y={H - 8} textAnchor="middle" fontSize={9} fill="#b0a898" fontFamily={fonts.mono}>{(v / 1000).toFixed(0) + "k"}</text>
      ))}
      <line x1={xp(threshold)} x2={xp(threshold)} y1={PT} y2={H - PB} stroke={B.sea} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
      <text x={xp(threshold) + 5} y={PT + 12} fontSize={9} fill={B.sea} fontWeight={600} fontFamily={fonts.mono}>threshold</text>
      <line x1={xp(0)} x2={xp(maxBill)} y1={yp(baseSalary)} y2={yp(baseSalary)} stroke={B.warm} strokeWidth={1} strokeDasharray="6 4" />
      <text x={W - PR} y={yp(baseSalary) - 6} textAnchor="end" fontSize={9} fill="#b0a898" fontFamily={fonts.mono}>base salary</text>
      <path d={areaPath} fill={B.turq} opacity={0.15} />
      {bonusPath && <path d={bonusPath} fill={B.lemon} opacity={0.4} />}
      <path d={linePath} stroke={B.sea} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <line x1={bx} x2={bx} y1={PT} y2={H - PB} stroke={B.dark} strokeWidth={1} strokeDasharray="3 2" opacity={0.3} />
      <circle cx={bx} cy={by} r={6} fill={B.lemon} stroke={B.dark} strokeWidth={2} />
      <rect x={bx - 34} y={by - 24} width={68} height={18} rx={4} fill={B.dark} opacity={0.9} />
      <text x={bx} y={by - 12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700} fontFamily={fonts.mono}>
        {fmt(Math.round(curSalary))} {"\u20AC"}
      </text>
      <text x={W / 2} y={H - 0} textAnchor="middle" fontSize={9} fill="#b0a898" fontFamily={fonts.body}>{`Billing \u20AC / mo`}</text>
      <text x={8} y={PT + ch / 2} textAnchor="middle" fontSize={9} fill="#b0a898" fontFamily={fonts.body} transform={`rotate(-90, 8, ${PT + ch / 2})`}>{`Salary \u20AC`}</text>
      {bonusPts.length > 2 && (
        <text x={xp(threshold + 3500)} y={yp(baseSalary) - 12} fontSize={10} fill={B.dark} fontWeight={700} fontFamily={fonts.body}>bonus zone</text>
      )}
    </svg>
  );
};

const BarChart = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.billing || 1));
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 150, marginTop: 12 }}>
      {data.map((d, i) => {
        const h = (d.billing / maxVal) * 130;
        const payH = (d.salary / maxVal) * 130;
        const marginH = ((d.billing - d.cost) / maxVal) * 130;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: B.dark, fontFamily: fonts.mono }}>{fmt(d.billing)}</div>
            <div style={{ position: "relative", width: "100%", height: Math.max(h, 0), borderRadius: 4, overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: Math.max(h, 0), background: B.turq, borderRadius: 4 }} />
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: Math.max(payH, 0), background: B.sea, borderRadius: "0 0 4px 4px" }} />
              <div style={{ position: "absolute", top: 0, width: "100%", height: Math.max(0, marginH), background: B.lemon, borderRadius: "4px 4px 0 0" }} />
            </div>
            <div style={{ fontSize: 8, color: "#a09888", fontFamily: fonts.mono }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const BillingRateChart = ({ billing, onBillingChange, threshold }) => {
  const HOURS = DEFAULTS.monthlyHours;
  const rates = [50, 75, 100, 125, 150, 175, 200];
  const utilizations = [50, 60, 70, 80, 90, 100];
  const maxVal = rates[rates.length - 1] * HOURS * (utilizations[utilizations.length - 1] / 100);

  const cellColor = (val) => {
    if (val < threshold) return "rgba(183,68,68,0.12)";
    const t = Math.min(val / maxVal, 1);
    return `rgba(83,127,123,${(0.1 + t * 0.5).toFixed(2)})`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.mono, fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ padding: "4px 6px", fontSize: 9, color: "#8a8a7a", textAlign: "left", fontWeight: 600 }}>{"\u20AC/h \\ util%"}</th>
            {utilizations.map((u) => (
              <th key={u} style={{ padding: "4px 6px", fontSize: 9, color: "#8a8a7a", textAlign: "center", fontWeight: 600 }}>{u + "%"}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate}>
              <td style={{ padding: "4px 6px", fontSize: 10, color: "#888", fontWeight: 600 }}>{rate + " \u20AC"}</td>
              {utilizations.map((u) => {
                const val = Math.round(rate * HOURS * (u / 100));
                const isActive = val === billing;
                return (
                  <td key={u}
                    onClick={() => onBillingChange(val)}
                    style={{
                      padding: "6px 4px", textAlign: "center", cursor: "pointer",
                      background: isActive ? B.lemon : cellColor(val),
                      borderRadius: 4, fontWeight: isActive ? 800 : 500,
                      color: isActive ? B.dark : val < threshold ? "#b44" : "#fff",
                      border: isActive ? `2px solid ${B.dark}` : "2px solid transparent",
                      transition: "all 0.2s ease",
                    }}>
                    {fmt(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 9, color: "#8a8a7a", marginTop: 6, textAlign: "center", fontFamily: fonts.body }}>
        {`Based on ${HOURS} h/mo \u00B7 Click a cell to set billing`}
      </div>
    </div>
  );
};

// --- Waterfall chart ---

const WaterfallChart = ({ baseSalary, bonusPct, threshold, sideRate, overhead, holidayReserve, billing }) => {
  const bon = billing > threshold ? ((billing - threshold) * bonusPct) / 100 : 0;
  const sal = baseSalary + bon;
  const side = sal * (sideRate / 100);
  const margin = billing - sal - side - holidayReserve - overhead;

  const steps = [
    { label: "Billing", value: billing, running: billing, type: "total" },
    { label: "Base Salary", value: -baseSalary, running: billing - baseSalary, type: "sub" },
    { label: "Bonus", value: -bon, running: billing - baseSalary - bon, type: "sub" },
    { label: "Side Costs", value: -side, running: billing - sal - side, type: "sub" },
    { label: "Holiday Res.", value: -holidayReserve, running: billing - sal - side - holidayReserve, type: "sub" },
    { label: "Overhead", value: -overhead, running: margin, type: "sub" },
    { label: "Margin", value: margin, running: margin, type: "result" },
  ];

  const W = 800, H = 280, PL = 10, PR = 10, PT = 30, PB = 50;
  const cw = W - PL - PR, ch = H - PT - PB;
  const barCount = steps.length;
  const barW = cw / barCount * 0.55;
  const gap = cw / barCount;
  const maxVal = billing * 1.05;

  const yp = (v) => PT + ch - (Math.max(0, v) / maxVal) * ch;
  const barX = (i) => PL + gap * i + (gap - barW) / 2;

  // Y ticks
  const yTicks = [];
  const ySt = maxVal <= 10000 ? 2000 : maxVal <= 20000 ? 4000 : 5000;
  for (let v = 0; v <= maxVal; v += ySt) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={yp(v)} y2={yp(v)} stroke={B.warm} strokeWidth={0.5} />
        </g>
      ))}
      {steps.map((s, i) => {
        let top, bot, color;
        if (s.type === "total") {
          top = yp(s.value);
          bot = yp(0);
          color = B.turq;
        } else if (s.type === "result") {
          top = yp(Math.max(0, s.value));
          bot = yp(Math.max(0, 0));
          color = s.value >= 0 ? B.lemon : "#e88";
        } else {
          const prevRunning = steps[i - 1].running;
          top = yp(prevRunning);
          bot = yp(s.running);
          color = s.label === "Base Salary" || s.label === "Bonus" ? B.sea : B.warm;
        }
        const barHeight = Math.abs(bot - top);
        const barTop = Math.min(top, bot);

        return (
          <g key={s.label}>
            <rect x={barX(i)} y={barTop} width={barW} height={Math.max(barHeight, 1)} rx={3} fill={color} opacity={0.7} />
            {/* Connector line to next */}
            {i < steps.length - 1 && s.type !== "total" && (
              <line x1={barX(i) + barW} x2={barX(i + 1)} y1={yp(s.running)} y2={yp(s.running)} stroke="#ccc" strokeWidth={1} strokeDasharray="3 2" />
            )}
            {s.type === "total" && i < steps.length - 1 && (
              <line x1={barX(i) + barW} x2={barX(i + 1)} y1={yp(s.running)} y2={yp(s.running)} stroke="#ccc" strokeWidth={1} strokeDasharray="3 2" />
            )}
            {/* Value label */}
            <text x={barX(i) + barW / 2} y={barTop - 5} textAnchor="middle" fontSize={9} fill={B.dark} fontWeight={600} fontFamily={fonts.mono}>
              {s.type === "sub" ? "\u2212" + fmt(Math.round(Math.abs(s.value))) : fmt(Math.round(Math.abs(s.value)))}
            </text>
            {/* Bottom label */}
            <text x={barX(i) + barW / 2} y={H - PB + 14} textAnchor="middle" fontSize={8} fill="#b0a898" fontFamily={fonts.body}>{s.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// --- Annual cumulative chart ---

const AnnualCumulativeChart = ({ yearly }) => {
  const W = 900, H = 280, PL = 70, PR = 20, PT = 24, PB = 36;
  const cw = W - PL - PR, ch = H - PT - PB;
  const months = yearly.months;

  let cumBilling = 0, cumCost = 0;
  const cumData = months.map((m) => {
    cumBilling += m.billing;
    cumCost += m.cost;
    return { label: m.label, billing: cumBilling, cost: cumCost, margin: cumBilling - cumCost };
  });

  const maxVal = Math.max(cumData[11].billing, cumData[11].cost) * 1.05;
  const minMargin = Math.min(0, ...cumData.map((d) => d.margin));
  const minVal = Math.min(0, minMargin * 1.2);

  const xp = (i) => PL + (i / 11) * cw;
  const yp = (v) => PT + ch - ((v - minVal) / (maxVal - minVal)) * ch;

  const billingLine = cumData.map((d, i) => (i === 0 ? "M" : "L") + xp(i).toFixed(1) + "," + yp(d.billing).toFixed(1)).join(" ");
  const costLine = cumData.map((d, i) => (i === 0 ? "M" : "L") + xp(i).toFixed(1) + "," + yp(d.cost).toFixed(1)).join(" ");
  const marginLine = cumData.map((d, i) => (i === 0 ? "M" : "L") + xp(i).toFixed(1) + "," + yp(d.margin).toFixed(1)).join(" ");

  const yTicks = [];
  const range = maxVal - minVal;
  const ySt = range <= 80000 ? 20000 : range <= 160000 ? 40000 : 50000;
  for (let v = Math.ceil(minVal / ySt) * ySt; v <= maxVal; v += ySt) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {yTicks.map((v) => (
        <g key={"y" + v}>
          <line x1={PL} x2={W - PR} y1={yp(v)} y2={yp(v)} stroke={B.warm} strokeWidth={1} />
          <text x={PL - 8} y={yp(v) + 3} textAnchor="end" fontSize={9} fill="#b0a898" fontFamily={fonts.mono}>{(v / 1000).toFixed(0) + "k"}</text>
        </g>
      ))}
      {minVal < 0 && <line x1={PL} x2={W - PR} y1={yp(0)} y2={yp(0)} stroke="#ccc" strokeWidth={1} strokeDasharray="4 3" />}
      {cumData.map((d, i) => (
        <text key={i} x={xp(i)} y={H - 6} textAnchor="middle" fontSize={9} fill={d.label === "Jul" ? "#b44" : "#b0a898"} fontFamily={fonts.mono}>{d.label}</text>
      ))}
      <path d={billingLine} stroke={B.sea} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <path d={costLine} stroke="#b44" strokeWidth={2} fill="none" strokeLinejoin="round" strokeDasharray="6 3" />
      <path d={marginLine} stroke={B.lemonDark} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <circle cx={xp(11)} cy={yp(cumData[11].billing)} r={3.5} fill={B.sea} />
      <circle cx={xp(11)} cy={yp(cumData[11].cost)} r={3.5} fill="#b44" />
      <circle cx={xp(11)} cy={yp(cumData[11].margin)} r={3.5} fill={B.lemonDark} />
      <circle cx={xp(6)} cy={yp(cumData[6].billing)} r={3} fill="none" stroke="#b44" strokeWidth={1.5} />
      {/* Legend */}
      <line x1={PL + 5} x2={PL + 20} y1={PT + 2} y2={PT + 2} stroke={B.sea} strokeWidth={2} />
      <text x={PL + 24} y={PT + 5} fontSize={9} fill={B.dark} fontFamily={fonts.body}>Billing</text>
      <line x1={PL + 70} x2={PL + 85} y1={PT + 2} y2={PT + 2} stroke="#b44" strokeWidth={2} strokeDasharray="4 2" />
      <text x={PL + 89} y={PT + 5} fontSize={9} fill={B.dark} fontFamily={fonts.body}>Costs</text>
      <line x1={PL + 125} x2={PL + 140} y1={PT + 2} y2={PT + 2} stroke={B.lemonDark} strokeWidth={2} />
      <text x={PL + 144} y={PT + 5} fontSize={9} fill={B.dark} fontFamily={fonts.body}>Margin</text>
    </svg>
  );
};

// --- Styles ---

const globalStyles = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.5s ease-out both; }
.fade-up-1 { animation-delay: 0.05s; }
.fade-up-2 { animation-delay: 0.1s; }
.fade-up-3 { animation-delay: 0.15s; }
.fade-up-4 { animation-delay: 0.2s; }
.fade-up-5 { animation-delay: 0.25s; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
  .no-print, .print-hide { display: none !important; }
  .fade-up { animation: none !important; }
  .main-columns { display: block !important; }
  .right-column { max-width: 600px !important; margin: 0 auto !important; }
}
`;

export default function BonusSimulator() {
  const urlState = useRef(readUrlState()).current;

  const [baseSalary, setBaseSalary] = useState(urlState.baseSalary ?? DEFAULTS.baseSalary);
  const [thresholdManual, setThresholdManual] = useState(urlState.threshold ?? DEFAULTS.threshold);
  const [thresholdMode, setThresholdMode] = useState(urlState.thresholdMode ?? "multiplier"); // "multiplier" | "cost" | "manual"
  const [bonusPct, setBonusPct] = useState(urlState.bonusPct ?? DEFAULTS.bonusPct);
  const [billing, setBilling] = useState(urlState.billing ?? DEFAULTS.billing);
  const [sideRate, setSideRate] = useState(urlState.sideRate ?? DEFAULTS.sideRate);
  const [overhead, setOverhead] = useState(urlState.overhead ?? DEFAULTS.overhead);

  const holidayReserve = baseSalary * (1 + sideRate / 100) / 12;

  const multiplierThreshold = Math.round(baseSalary * 1.6 / 100) * 100;
  const costThreshold = Math.round((baseSalary * (1 + sideRate / 100) + holidayReserve + overhead) / 100) * 100;
  const threshold = thresholdMode === "multiplier" ? multiplierThreshold : thresholdMode === "cost" ? costThreshold : thresholdManual;

  useEffect(() => {
    writeUrlState({ baseSalary, bonusPct, billing, sideRate, overhead,
      ...(thresholdMode === "manual" ? { threshold: thresholdManual } : {}),
      thresholdMode,
    });
  }, [baseSalary, bonusPct, billing, sideRate, overhead, thresholdMode, thresholdManual]);

  const calc = useMemo(() => {
    const bonus = billing > threshold ? ((billing - threshold) * bonusPct) / 100 : 0;
    const salary = baseSalary + bonus;
    const sideCosts = salary * (sideRate / 100);
    const baseSideCosts = baseSalary * (sideRate / 100);
    const bonusSideCosts = bonus * (sideRate / 100);
    const totalCost = salary + sideCosts + holidayReserve + overhead;
    const margin = billing - totalCost;
    const marginPct = billing > 0 ? (margin / billing) * 100 : 0;
    return { bonus, salary, sideCosts, baseSideCosts, bonusSideCosts, holidayReserve, totalCost, margin, marginPct };
  }, [baseSalary, threshold, bonusPct, billing, sideRate, overhead, holidayReserve]);

  const scenarios = useMemo(() =>
    [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000].map((b) => {
      const bon = b > threshold ? ((b - threshold) * bonusPct) / 100 : 0;
      const sal = baseSalary + bon;
      const cost = sal + sal * (sideRate / 100) + holidayReserve + overhead;
      return { billing: b, salary: sal, cost, margin: b - cost, label: b === 0 ? "Bench" : fmt(b) };
    }),
  [baseSalary, threshold, bonusPct, sideRate, overhead, holidayReserve]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const yearly = useMemo(() => {
    const months = MONTHS.map((label, i) => {
      const mBilling = i === 6 ? 0 : billing;
      const bon = mBilling > threshold ? ((mBilling - threshold) * bonusPct) / 100 : 0;
      const sal = baseSalary + bon;
      const sideCosts = sal * (sideRate / 100);
      const cost = sal + sideCosts + holidayReserve + overhead;
      return { label, billing: mBilling, baseSalary, salary: sal, bonus: bon, holidayReserve, cost, margin: mBilling - cost };
    });
    const totals = months.reduce((acc, m) => ({
      billing: acc.billing + m.billing,
      baseSalary: acc.baseSalary + m.baseSalary,
      salary: acc.salary + m.salary,
      bonus: acc.bonus + m.bonus,
      holidayReserve: acc.holidayReserve + m.holidayReserve,
      cost: acc.cost + m.cost,
      margin: acc.margin + m.margin,
    }), { billing: 0, baseSalary: 0, salary: 0, bonus: 0, holidayReserve: 0, cost: 0, margin: 0 });
    return { months, totals };
  }, [baseSalary, threshold, bonusPct, billing, sideRate, overhead, holidayReserve]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div style={{ minHeight: "100vh",
      background: `${B.beige} url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`,
      fontFamily: fonts.body, padding: "32px 24px" }}>
      <style>{globalStyles}</style>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* HEADER */}
        <div className="fade-up" style={{ marginBottom: 36, textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${B.lemon}30 0%, transparent 70%)`,
            pointerEvents: "none" }} />
          <div style={{ ...sectionHeader, letterSpacing: "0.2em", color: B.sea, marginBottom: 6, fontSize: 11 }}>Data Design Oy</div>
          <h1 style={{ fontSize: 34, fontWeight: 400, color: B.dark, margin: 0, fontFamily: fonts.display, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            Consultant Bonus Model
          </h1>
          <p style={{ fontSize: 13, color: "#a09888", marginTop: 6, fontFamily: fonts.body, fontWeight: 300 }}>Interactive simulator for compensation planning</p>
          <button className="no-print" onClick={handlePrint}
            style={{ marginTop: 14, fontSize: 11, fontWeight: 600, padding: "8px 22px", borderRadius: 24,
              cursor: "pointer", border: `1.5px solid ${B.sea}`, background: "#fff", color: B.sea,
              fontFamily: fonts.body, transition: "all 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            Print / PDF
          </button>
        </div>

        <div className="main-columns" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>

          {/* LEFT — Controls */}
          <div style={{ width: 390, flexShrink: 0 }}>
            <Card className="fade-up fade-up-1 print-hide">
              <div style={{ ...sectionHeader, marginBottom: 16 }}>Model Parameters</div>
              <Slider label="Base Salary" value={baseSalary} onChange={setBaseSalary} min={3000} max={7000} step={100} />

              <div style={{ background: `linear-gradient(135deg, ${B.cream}, ${B.beige})`, borderRadius: 10, padding: "14px 16px", marginBottom: 22, border: `1px solid ${B.turq}60` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: B.dark, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: fonts.body }}>Threshold</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[{ key: "multiplier", label: "1.6\u00D7" }, { key: "cost", label: "COST" }, { key: "manual", label: "MANUAL" }].map((m) => (
                      <button key={m.key} onClick={() => { setThresholdMode(m.key); if (m.key === "manual") setThresholdManual(threshold); }}
                        style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 16, cursor: "pointer", border: "none",
                          background: thresholdMode === m.key ? B.sea : B.warm, color: thresholdMode === m.key ? "#fff" : "#777",
                          fontFamily: fonts.body, transition: "all 0.2s ease" }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {thresholdMode === "manual" ? (
                  <Slider label="" value={thresholdManual} onChange={setThresholdManual} min={5000} max={16000} step={500} color={B.acc} />
                ) : (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: B.sea, fontFamily: fonts.mono }}>{fmt(threshold) + " \u20AC"}</div>
                    <div style={{ fontSize: 10, color: "#a09888", marginTop: 4, lineHeight: 1.6, fontFamily: fonts.body }}>
                      {thresholdMode === "multiplier"
                        ? `= base salary (${fmt(baseSalary)}) \u00D7 1.6`
                        : `= base salary (${fmt(baseSalary)}) \u00D7 (1 + side costs ${sideRate}%) + holiday reserve (${fmt(Math.round(holidayReserve))}) + overhead (${fmt(overhead)})`}
                      <br />
                      {thresholdMode === "multiplier"
                        ? "= fixed multiplier, same relative threshold for all salary levels"
                        : `= breakeven billing to cover base salary costs (${(threshold / baseSalary).toFixed(1)}\u00D7 base salary)`}
                    </div>
                  </div>
                )}
              </div>

              <Slider label="Bonus % of excess" value={bonusPct} onChange={setBonusPct} min={10} max={50} step={1} unit="%" color="#d4a030" />
              <div style={{ borderTop: `1px solid ${B.warm}`, margin: "4px 0 22px" }} />
              <div style={{ ...sectionHeader, marginBottom: 16 }}>Employer Costs</div>
              <Slider label="Side Costs" value={sideRate} onChange={setSideRate} min={18} max={35} step={1} unit="%" color="#999" />
              <div style={{ background: `linear-gradient(135deg, ${B.cream}, #f0ede6)`, borderRadius: 8, padding: "10px 14px", marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: B.dark, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: fonts.body }}>Holiday Pay Reserve</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: B.acc, fontFamily: fonts.mono }}>{fmt(Math.round(holidayReserve))} {"\u20AC"}</span>
                </div>
                <div style={{ fontSize: 10, color: "#a09888", lineHeight: 1.5, fontFamily: fonts.body }}>
                  {`= ${fmt(baseSalary)} \u00D7 (1 + ${sideRate}%) / 12`}
                </div>
              </div>
              <Slider label="Overhead / mo" value={overhead} onChange={setOverhead} min={500} max={3000} step={100} color="#999" />
              <div style={{ fontSize: 10, color: "#a09888", lineHeight: 1.5, marginTop: -12, marginBottom: 8, fontFamily: fonts.body }}>
                Premises, IT/software, travel, marketing, admin & other operating costs.
              </div>
            </Card>

            <div className="fade-up fade-up-2 print-hide" style={{
              background: `linear-gradient(145deg, ${B.dark}, #243e3b)`,
              borderRadius: 14, padding: "22px 20px", marginBottom: 20, color: "#fff",
              boxShadow: "0 4px 20px rgba(26,46,44,0.2)" }}>
              <div style={{ ...sectionHeader, color: B.turq, marginBottom: 12 }}>Monthly Billing & Allocation</div>
              <Slider label="" value={billing} onChange={setBilling} min={0} max={25000} step={500} color={B.lemon} />
              <div style={{ marginTop: 4 }}>
                <BillingRateChart billing={billing} onBillingChange={setBilling} threshold={threshold} />
              </div>
            </div>
          </div>

          {/* RIGHT — Results & Charts */}
          <div className="right-column" style={{ flex: 1, minWidth: 0 }}>
            <Card className="fade-up fade-up-2">
              <div style={{ ...sectionHeader, marginBottom: 12 }}>Calculation</div>
              <Row label="Billing" value={billing} />
              <Row label="Base Salary" value={baseSalary} sub />
              <Row label="Bonus" value={calc.bonus} sub />
              <Row hl label="Gross Salary" value={calc.salary} />
              <Row label="Side Costs" value={calc.sideCosts} sub />
              <div style={{ paddingLeft: 30, borderBottom: "1px solid rgba(26,46,44,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10, color: "#b0a898", fontFamily: fonts.mono }}>
                  <span style={{ fontFamily: fonts.body }}>on base salary</span>
                  <span>{fmt(Math.round(calc.baseSideCosts))} {"\u20AC"}</span>
                </div>
                {calc.bonusSideCosts > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10, color: "#b0a898", fontFamily: fonts.mono }}>
                    <span style={{ fontFamily: fonts.body }}>on bonus</span>
                    <span>{fmt(Math.round(calc.bonusSideCosts))} {"\u20AC"}</span>
                  </div>
                )}
              </div>
              <Row label="Holiday Pay Reserve" value={calc.holidayReserve} sub />
              <Row label="Overhead" value={overhead} sub />
              <Row label="Total Employer Cost" value={calc.totalCost} />
              <div style={{ height: 6 }} />
              <Row hl label="Company Margin" value={`${fmt(calc.margin)} \u20AC (${calc.marginPct.toFixed(0)} %)`} />
              {calc.margin < 0 && (
                <div style={{ fontSize: 11, color: "#b44", marginTop: 8, fontWeight: 600, textAlign: "center", fontFamily: fonts.body }}>
                  {"\u26A0 Negative margin"}
                </div>
              )}
              <DonutChart salary={calc.salary} sideCosts={calc.sideCosts} holidayReserve={calc.holidayReserve} overhead={overhead} margin={calc.margin} billing={billing} />
              <div style={{ borderTop: `1px solid ${B.warm}`, marginTop: 14, paddingTop: 12 }}>
                <div style={{ ...sectionHeader, marginBottom: 4 }}>Where Does Billing Go?</div>
                <WaterfallChart baseSalary={baseSalary} bonusPct={bonusPct} threshold={threshold} sideRate={sideRate} overhead={overhead} holidayReserve={holidayReserve} billing={billing} />
              </div>
            </Card>

            <Card className="fade-up fade-up-3">
              <div style={{ ...sectionHeader, marginBottom: 4 }}>Employee Perspective</div>
              <div style={{ fontSize: 12, color: B.dark, marginBottom: 10, fontFamily: fonts.body, fontWeight: 400 }}>Gross salary relative to billing</div>
              <SalaryChart baseSalary={baseSalary} threshold={threshold} bonusPct={bonusPct} billing={billing} />
            </Card>

            <Card className="fade-up fade-up-4">
              <div style={{ ...sectionHeader, marginBottom: 6 }}>Scenarios</div>
              <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#a09888", marginBottom: 6, fontFamily: fonts.body }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.lemon, marginRight: 4, verticalAlign: -1 }} />Margin</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.sea, marginRight: 4, verticalAlign: -1 }} />Salary</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.turq, marginRight: 4, verticalAlign: -1 }} />Costs+OH</span>
              </div>
              <BarChart data={scenarios.filter((s) => s.billing % 2000 === 0)} />
              <div style={{ marginTop: 16, fontSize: 11, borderTop: `1px solid ${B.warm}`, paddingTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.mono, fontSize: 10 }}>
                  <thead>
                    <tr style={{ color: "#a09888", textTransform: "uppercase", fontSize: 9 }}>
                      <th style={{ textAlign: "left", padding: "3px 0" }}>Billing</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Salary</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Margin</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${B.warm}40`, color: s.margin < 0 ? "#b44" : B.dark }}>
                        <td style={{ padding: "5px 0" }}>{s.label}</td>
                        <td style={{ textAlign: "right" }}>{fmt(s.salary)}</td>
                        <td style={{ textAlign: "right" }}>{fmt(s.margin)}</td>
                        <td style={{ textAlign: "right" }}>{s.billing > 0 ? ((s.margin / s.billing) * 100).toFixed(0) + " %" : "\u2013"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>

        <Card className="fade-up fade-up-5 print-hide" style={{ marginTop: 28, overflowX: "auto" }}>
          <div style={{ ...sectionHeader, marginBottom: 4 }}>Annual Overview</div>
          <div style={{ fontSize: 12, color: B.dark, marginBottom: 12, fontFamily: fonts.body, fontWeight: 400 }}>July = no billing (holiday). Costs are paid every month.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fonts.mono, fontSize: 10, minWidth: 700 }}>
            <thead>
              <tr style={{ color: "#a09888", textTransform: "uppercase", fontSize: 9 }}>
                <th style={{ textAlign: "left", padding: "3px 6px" }}></th>
                {yearly.months.map((m) => (
                  <th key={m.label} style={{ textAlign: "right", padding: "3px 4px", color: m.label === "Jul" ? "#b44" : "#a09888" }}>{m.label}</th>
                ))}
                <th style={{ textAlign: "right", padding: "3px 6px", borderLeft: `2px solid ${B.warm}` }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "Billing", field: "billing" },
                { key: "Base Salary", field: "baseSalary" },
                { key: "Bonus", field: "bonus" },
                { key: "Total Salary", field: "salary", hl: true },
                { key: "Holiday Reserve", field: "holidayReserve" },
                { key: "Employer Cost", field: "cost" },
                { key: "Margin", field: "margin", hl: true },
              ].map((row) => (
                <tr key={row.key} style={{
                  borderBottom: `1px solid ${B.warm}40`,
                  background: row.hl ? `linear-gradient(135deg, ${B.lemon}70, ${B.lemon}30)` : "transparent",
                  fontWeight: row.hl ? 700 : 400,
                }}>
                  <td style={{ padding: "5px 6px", fontWeight: 600, color: B.dark, fontSize: 10, fontFamily: fonts.body }}>{row.key}</td>
                  {yearly.months.map((m) => {
                    const val = m[row.field];
                    return (
                      <td key={m.label} style={{
                        textAlign: "right", padding: "5px 4px",
                        color: row.field === "margin" && val < 0 ? "#b44" : m.label === "Jul" ? "#b0a898" : B.dark,
                      }}>
                        {fmt(Math.round(val))}
                      </td>
                    );
                  })}
                  <td style={{
                    textAlign: "right", padding: "5px 6px", fontWeight: 700, borderLeft: `2px solid ${B.warm}`,
                    color: row.field === "margin" && yearly.totals[row.field] < 0 ? "#b44" : B.dark,
                  }}>
                    {fmt(Math.round(yearly.totals[row.field]))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <div style={{ ...sectionHeader, marginBottom: 10 }}>Cumulative Annual</div>
            <AnnualCumulativeChart yearly={yearly} />
          </div>

          <div style={{ fontSize: 10, color: "#a09888", marginTop: 12, lineHeight: 1.6, fontFamily: fonts.body }}>
            Note: In practice, bonuses are paid based on the previous month's billing. The monthly breakdown above shows bonuses in the month they are earned. Annual totals remain the same.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, fontSize: 12, color: B.acc, fontWeight: 700, fontFamily: fonts.mono }}>
            Annual margin: {fmt(Math.round(yearly.totals.margin))} {"\u20AC"}
            {yearly.totals.billing > 0 ? ` (${(yearly.totals.margin / yearly.totals.billing * 100).toFixed(1)} %)` : ""}
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#b0a898", fontFamily: fonts.body, fontWeight: 300 }}>
          {`Data Design Oy \u00B7 Consultant Bonus Model \u00B7 ${new Date().getFullYear()}`}
        </div>
      </div>
    </div>
  );
}
