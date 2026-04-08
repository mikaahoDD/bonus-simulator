import { useState, useMemo } from "react";

const DEFAULTS = {
  baseSalary: 5000,
  threshold: 8000,
  bonusPct: 30,
  billing: 12000,
  sideRate: 26,
  overhead: 1100,
  monthlyHours: 158,
};

const B = {
  lemon: "#e6ff99",
  sea: "#537f7b",
  turq: "#caebed",
  beige: "#f9f7ef",
  dark: "#1a2e2c",
  acc: "#3d5f5c",
};

const card = {
  background: "#fff",
  borderRadius: 10,
  padding: "20px 18px",
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const sectionHeader = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#aaa",
};

const fmt = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const Slider = ({ label, value, onChange, min, max, step, unit = "\u20AC", color = B.sea }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const bg = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #ddd ${pct}%, #ddd 100%)`;
  return (
    <div style={{ marginBottom: 24 }}>
      {label ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: B.dark, letterSpacing: "0.02em", textTransform: "uppercase" }}>{label}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "monospace" }}>{fmt(value)} {unit}</span>
        </div>
      ) : (
        <div style={{ textAlign: "right", marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "monospace" }}>{fmt(value)} {unit}</span>
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 6, appearance: "none", WebkitAppearance: "none", borderRadius: 3, outline: "none", cursor: "pointer", accentColor: color, background: bg }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", marginTop: 3 }}>
        <span>{fmt(min)} {unit}</span><span>{fmt(max)} {unit}</span>
      </div>
    </div>
  );
};

const Row = ({ label, value, hl, sub }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: sub ? "5px 0 5px 18px" : "9px 0",
    borderBottom: hl ? "none" : "1px solid rgba(0,0,0,0.05)",
    background: hl ? B.lemon : "transparent",
    borderRadius: hl ? 6 : 0,
    margin: hl ? "6px -10px" : 0,
    paddingLeft: hl ? 10 : sub ? 18 : 0,
    paddingRight: hl ? 10 : 0,
  }}>
    <span style={{ fontSize: sub ? 12 : 13, color: sub ? "#777" : B.dark, fontWeight: hl ? 700 : sub ? 400 : 500 }}>{label}</span>
    <span style={{ fontSize: hl ? 18 : 14, fontWeight: hl ? 800 : 600, fontFamily: "monospace", color: hl ? B.dark : B.acc }}>
      {typeof value === "string" ? value : fmt(value) + " \u20AC"}
    </span>
  </div>
);

const SalaryChart = ({ baseSalary, threshold, bonusPct }) => {
  const W = 460, H = 220, PL = 50, PR = 16, PT = 16, PB = 32;
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {yTicks.map((v) => (
        <g key={"y" + v}>
          <line x1={PL} x2={W - PR} y1={yp(v)} y2={yp(v)} stroke="#eee" strokeWidth={1} />
          <text x={PL - 6} y={yp(v) + 3} textAnchor="end" fontSize={9} fill="#aaa" fontFamily="monospace">{(v / 1000).toFixed(0) + "k"}</text>
        </g>
      ))}
      {xTicks.map((v) => (
        <text key={"x" + v} x={xp(v)} y={H - 6} textAnchor="middle" fontSize={9} fill="#aaa" fontFamily="monospace">{(v / 1000).toFixed(0) + "k"}</text>
      ))}
      <line x1={xp(threshold)} x2={xp(threshold)} y1={PT} y2={H - PB} stroke={B.sea} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
      <text x={xp(threshold) + 4} y={PT + 10} fontSize={9} fill={B.sea} fontWeight={600} fontFamily="monospace">threshold</text>
      <line x1={xp(0)} x2={xp(maxBill)} y1={yp(baseSalary)} y2={yp(baseSalary)} stroke="#ccc" strokeWidth={1} strokeDasharray="6 4" />
      <text x={W - PR} y={yp(baseSalary) - 5} textAnchor="end" fontSize={9} fill="#aaa" fontFamily="monospace">base salary</text>
      <path d={areaPath} fill={B.turq} opacity={0.2} />
      {bonusPath && <path d={bonusPath} fill={B.lemon} opacity={0.45} />}
      <path d={linePath} stroke={B.sea} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <text x={W / 2} y={H} textAnchor="middle" fontSize={10} fill="#999">{`Billing \u20AC / mo`}</text>
      <text x={10} y={PT + ch / 2} textAnchor="middle" fontSize={10} fill="#999" transform={`rotate(-90, 10, ${PT + ch / 2})`}>{`Salary \u20AC`}</text>
      {bonusPts.length > 2 && (
        <text x={xp(threshold + 3500)} y={yp(baseSalary) - 10} fontSize={10} fill={B.dark} fontWeight={700}>bonus zone</text>
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
            <div style={{ fontSize: 9, fontWeight: 700, color: B.dark, fontFamily: "monospace" }}>{fmt(d.billing)}</div>
            <div style={{ position: "relative", width: "100%", height: Math.max(h, 0), borderRadius: 3, overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: Math.max(h, 0), background: B.turq, borderRadius: 3 }} />
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: Math.max(payH, 0), background: B.sea, borderRadius: "0 0 3px 3px" }} />
              <div style={{ position: "absolute", top: 0, width: "100%", height: Math.max(0, marginH), background: B.lemon, borderRadius: "3px 3px 0 0" }} />
            </div>
            <div style={{ fontSize: 9, color: "#888" }}>{d.label}</div>
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
    if (val < threshold) return "rgba(183,68,68,0.15)";
    const t = Math.min(val / maxVal, 1);
    return `rgba(83,127,123,${(0.1 + t * 0.5).toFixed(2)})`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ padding: "4px 6px", fontSize: 9, color: "#aaa", textAlign: "left", fontWeight: 600 }}>{"\u20AC/h \\ util%"}</th>
            {utilizations.map((u) => (
              <th key={u} style={{ padding: "4px 6px", fontSize: 9, color: "#aaa", textAlign: "center", fontWeight: 600 }}>{u + "%"}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate}>
              <td style={{ padding: "4px 6px", fontSize: 10, color: "#ccc", fontWeight: 600 }}>{rate + " \u20AC"}</td>
              {utilizations.map((u) => {
                const val = Math.round(rate * HOURS * (u / 100));
                const isActive = val === billing;
                return (
                  <td key={u}
                    onClick={() => onBillingChange(val)}
                    style={{
                      padding: "6px 4px", textAlign: "center", cursor: "pointer",
                      background: isActive ? B.lemon : cellColor(val),
                      borderRadius: 3, fontWeight: isActive ? 800 : 500,
                      color: isActive ? B.dark : val < threshold ? "#b44" : "#fff",
                      border: isActive ? `2px solid ${B.dark}` : "2px solid transparent",
                      transition: "all 0.15s",
                    }}>
                    {fmt(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 9, color: "#666", marginTop: 6, textAlign: "center" }}>
        {`Based on ${HOURS} h/mo \u00B7 Click a cell to set billing`}
      </div>
    </div>
  );
};

export default function BonusSimulator() {
  const [baseSalary, setBaseSalary] = useState(DEFAULTS.baseSalary);
  const [thresholdManual, setThresholdManual] = useState(DEFAULTS.threshold);
  const [autoThreshold, setAutoThreshold] = useState(true);
  const [bonusPct, setBonusPct] = useState(DEFAULTS.bonusPct);
  const [billing, setBilling] = useState(DEFAULTS.billing);
  const [sideRate, setSideRate] = useState(DEFAULTS.sideRate);
  const [overhead, setOverhead] = useState(DEFAULTS.overhead);

  const autoThresholdValue = Math.round((baseSalary * (1 + sideRate / 100) + overhead) / 100) * 100;
  const threshold = autoThreshold ? autoThresholdValue : thresholdManual;

  const calc = useMemo(() => {
    const bonus = billing > threshold ? ((billing - threshold) * bonusPct) / 100 : 0;
    const salary = baseSalary + bonus;
    const sideCosts = salary * (sideRate / 100);
    const totalCost = salary + sideCosts + overhead;
    const margin = billing - totalCost;
    const marginPct = billing > 0 ? (margin / billing) * 100 : 0;
    return { bonus, salary, sideCosts, totalCost, margin, marginPct };
  }, [baseSalary, threshold, bonusPct, billing, sideRate, overhead]);

  const scenarios = useMemo(() =>
    [0, 8000, 10000, 12000, 14000, 16500, 20000].map((b) => {
      const bon = b > threshold ? ((b - threshold) * bonusPct) / 100 : 0;
      const sal = baseSalary + bon;
      const cost = sal + sal * (sideRate / 100) + overhead;
      return { billing: b, salary: sal, cost, margin: b - cost, label: b === 0 ? "Bench" : fmt(b) };
    }),
  [baseSalary, threshold, bonusPct, sideRate, overhead]);

  return (
    <div style={{ minHeight: "100vh", background: B.beige, fontFamily: "system-ui, sans-serif", padding: "28px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ ...sectionHeader, letterSpacing: "0.15em", color: B.sea, marginBottom: 4 }}>Data Design Oy</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: B.dark, margin: 0 }}>Consultant Bonus Model</h1>
          <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Simulator</p>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* LEFT — Controls */}
          <div style={{ width: 380, flexShrink: 0 }}>
            <div style={card}>
              <div style={{ ...sectionHeader, marginBottom: 14 }}>Model Parameters</div>
              <Slider label="Base Salary" value={baseSalary} onChange={setBaseSalary} min={3500} max={7000} step={100} />

              <div style={{ background: B.beige, borderRadius: 8, padding: "12px 14px", marginBottom: 20, border: `1.5px solid ${B.turq}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.dark, textTransform: "uppercase", letterSpacing: "0.02em" }}>Threshold</span>
                  <button onClick={() => { setAutoThreshold(!autoThreshold); if (!autoThreshold) setThresholdManual(autoThresholdValue); }}
                    style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer", border: "none",
                      background: autoThreshold ? B.sea : "#ccc", color: autoThreshold ? "#fff" : "#555" }}>
                    {autoThreshold ? "AUTO" : "MANUAL"}
                  </button>
                </div>
                {autoThreshold ? (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: B.sea, fontFamily: "monospace" }}>{fmt(threshold) + " \u20AC"}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 4, lineHeight: 1.5 }}>
                      {`= base salary (${fmt(baseSalary)}) \u00D7 (1 + side costs ${sideRate}%) + overhead (${fmt(overhead)})`}
                      <br />
                      {"= breakeven billing where the company covers base salary costs"}
                    </div>
                  </div>
                ) : (
                  <Slider label="" value={thresholdManual} onChange={setThresholdManual} min={5000} max={16000} step={500} color={B.acc} />
                )}
              </div>

              <Slider label="Bonus % of excess" value={bonusPct} onChange={setBonusPct} min={10} max={50} step={1} unit="%" color="#d4a030" />
              <Slider label="Side Costs" value={sideRate} onChange={setSideRate} min={18} max={35} step={1} unit="%" color="#999" />
              <Slider label="Overhead / mo" value={overhead} onChange={setOverhead} min={500} max={2000} step={100} color="#999" />
            </div>

            <div style={{ background: B.dark, borderRadius: 10, padding: "20px 18px", marginBottom: 16, color: "#fff" }}>
              <div style={{ ...sectionHeader, color: B.turq, marginBottom: 10 }}>Monthly Billing</div>
              <Slider label="" value={billing} onChange={setBilling} min={0} max={25000} step={500} color={B.lemon} />
              <div style={{ marginTop: 4 }}>
                <BillingRateChart billing={billing} onBillingChange={setBilling} threshold={threshold} />
              </div>
            </div>
          </div>

          {/* RIGHT — Results & Charts */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={card}>
              <div style={{ ...sectionHeader, marginBottom: 10 }}>Calculation</div>
              <Row label="Billing" value={billing} />
              <Row label="Base Salary" value={baseSalary} sub />
              <Row label="Bonus" value={calc.bonus} sub />
              <Row hl label="Gross Salary" value={calc.salary} />
              <Row label="Side Costs" value={calc.sideCosts} sub />
              <Row label="Overhead" value={overhead} sub />
              <Row label="Total Employer Cost" value={calc.totalCost} />
              <div style={{ height: 6 }} />
              <Row hl label="Company Margin" value={`${fmt(calc.margin)} \u20AC (${calc.marginPct.toFixed(0)} %)`} />
              {calc.margin < 0 && (
                <div style={{ fontSize: 11, color: "#b44", marginTop: 6, fontWeight: 600, textAlign: "center" }}>
                  {"\u26A0 Negative margin"}
                </div>
              )}
            </div>

            <div style={card}>
              <div style={{ ...sectionHeader, marginBottom: 4 }}>Employee Perspective</div>
              <div style={{ fontSize: 12, color: B.dark, marginBottom: 8 }}>Gross salary relative to billing</div>
              <SalaryChart baseSalary={baseSalary} threshold={threshold} bonusPct={bonusPct} />
            </div>

            <div style={{ ...card, marginBottom: 0 }}>
              <div style={{ ...sectionHeader, marginBottom: 4 }}>Scenarios</div>
              <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#888", marginBottom: 4 }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.lemon, marginRight: 3, verticalAlign: -1 }} />Margin</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.sea, marginRight: 3, verticalAlign: -1 }} />Salary</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: B.turq, marginRight: 3, verticalAlign: -1 }} />Costs+OH</span>
              </div>
              <BarChart data={scenarios} />
              <div style={{ marginTop: 16, fontSize: 11, borderTop: "1px solid #eee", paddingTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 10 }}>
                  <thead>
                    <tr style={{ color: "#aaa", textTransform: "uppercase", fontSize: 9 }}>
                      <th style={{ textAlign: "left", padding: "3px 0" }}>Billing</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Salary</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Margin</th>
                      <th style={{ textAlign: "right", padding: "3px 0" }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", color: s.margin < 0 ? "#b44" : B.dark }}>
                        <td style={{ padding: "5px 0" }}>{s.label}</td>
                        <td style={{ textAlign: "right" }}>{fmt(s.salary)}</td>
                        <td style={{ textAlign: "right" }}>{fmt(s.margin)}</td>
                        <td style={{ textAlign: "right" }}>{s.billing > 0 ? ((s.margin / s.billing) * 100).toFixed(0) + " %" : "\u2013"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#bbb" }}>
          {`Data Design Oy \u00B7 Consultant Bonus Model \u00B7 ${new Date().getFullYear()}`}
        </div>
      </div>
    </div>
  );
}
