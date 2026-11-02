import React, { useState } from "react";

export default function WeatherDemo() {
  // -----------------------------
  // State
  // -----------------------------
  const [provider, setProvider] = useState("meteo_global");
  const [consoleLines, setConsoleLines] = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [token, setToken] = useState(null);
  const [payments, setPayments] = useState(0);
  const [premiumCalls, setPremiumCalls] = useState(0);
  const [riskScore, setRiskScore] = useState(null);
  const [decision, setDecision] = useState(null);

  // -----------------------------
  // Helpers
  // -----------------------------
  const logAgent = (msg) => {
    setConsoleLines((prev) => [...prev, `[Agent] ${msg}`]);
  };

  const logAPI = (msg) => {
    setConsoleLines((prev) => [...prev, `[API] ${msg}`]);
  };

  const logX402 = (msg) => {
    setConsoleLines((prev) => [...prev, `[x402] ${msg}`]);
  };

  const logDashboard = (msg) => {
    setDashboard((prev) => [...prev, msg]);
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // -----------------------------
  // Simulated API + x402 logic
  // -----------------------------
  const callWeatherRiskAPI = (providedToken) => {
    if (!providedToken || !token || providedToken !== token.value) {
      const newInvoice = {
        id: "inv_" + Math.random().toString(36).slice(2, 8),
        amount: 0.25,
        currency: "USD",
        description: `Weather risk score from provider ${provider}`,
      };
      setInvoice(newInvoice);

      logAPI(`402 Payment Required (invoice ${newInvoice.id})`);
      logDashboard(`402 issued by ${provider} for premium weather data.`);

      return { status: 402, invoice: newInvoice };
    }

    // Valid token → return premium data
    const score = Math.floor(60 + Math.random() * 40);
    setRiskScore(score);
    setPremiumCalls((p) => p + 1);

    logAPI(`200 OK (risk_score=${score})`);
    logDashboard(`Premium weather data served by ${provider}.`);

    return {
      status: 200,
      data: {
        risk_score: score,
        risk_level: score >= 75 ? "HIGH" : "ELEVATED",
      },
    };
  };

  const payInvoice = (invoiceId) => {
    if (!invoice || invoice.id !== invoiceId) {
      logX402("No matching invoice.");
      return { status: "error" };
    }

    const newToken = {
      value: "tok_" + Math.random().toString(36).slice(2, 8),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    setToken(newToken);
    setPayments((p) => p + 1);

    logX402(`Invoice ${invoiceId} settled. Token issued: ${newToken.value}`);
    logDashboard(`x402 settlement for ${invoiceId}. Token ${newToken.value}.`);

    return {
      status: "settled",
      token: newToken.value,
    };
  };

  // -----------------------------
  // Full Agent Flow
  // -----------------------------
  const runDemo = async () => {
    setConsoleLines([]);
    setDashboard([]);
    setInvoice(null);
    setToken(null);
    setPayments(0);
    setPremiumCalls(0);
    setRiskScore(null);
    setDecision(null);

    logAgent(`Starting weather risk evaluation using provider: ${provider}`);
    await sleep(600);

    logAgent("Requesting /weather/risk...");
    const first = callWeatherRiskAPI(null);

    if (first.status === 402) {
      await sleep(700);
      logAgent(
        `Received 402. Invoice ${first.invoice.id} for $${first.invoice.amount}.`
      );

      await sleep(700);
      logAgent("Paying invoice via x402...");
      const payResp = payInvoice(first.invoice.id);

      if (payResp.status !== "settled") {
        logAgent("Payment failed.");
        return;
      }

      await sleep(700);
      logAgent("Retrying with token...");
      const second = callWeatherRiskAPI(payResp.token);

      if (second.status === 200) {
        const score = second.data.risk_score;
        const level = second.data.risk_level;

        await sleep(700);

        if (score >= 75) {
          setDecision("REROUTE SHIPMENT");
          logAgent(`Decision: REROUTE (risk ${score}, ${level})`);
          logDashboard("Agent decision: REROUTE SHIPMENT.");
        } else {
          setDecision("PROCEED AS PLANNED");
          logAgent(`Decision: PROCEED (risk ${score}, ${level})`);
          logDashboard("Agent decision: PROCEED AS PLANNED.");
        }
      }
    }

    logAgent("Flow complete.");
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", color: "#fff", background: "#0b0f19", minHeight: "100vh" }}>
      <h2>🌤️ Agentic Data Marketplace — Weather Demo (React)</h2>
      <p>Agent → 402 → x402 → Token → Premium Weather Risk → Decision</p>

      {/* Provider Selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>Select Provider:</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="meteo_global">MeteoGlobal</option>
          <option value="skycast_pro">SkyCast Pro</option>
          <option value="climate_insights">Climate Insights</option>
          <option value="stormwatch_ai">StormWatch AI</option>
        </select>
      </div>

      <button
        onClick={runDemo}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          background: "#1a4fff",
          color: "#fff",
          border: "none",
          marginBottom: 20,
        }}
      >
        Run Full Demo
      </button>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Agent Console */}
        <div style={{ flex: 1, background: "#111", padding: 12, borderRadius: 8 }}>
          <h3>Agent Console</h3>
          <div
            style={{
              background: "#000",
              padding: 10,
              borderRadius: 6,
              height: 300,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {consoleLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        {/* Dashboard */}
        <div style={{ flex: 1, background: "#111", padding: 12, borderRadius: 8 }}>
          <h3>Dashboard</h3>

          <p><strong>Provider:</strong> {provider}</p>
          <p><strong>Payments:</strong> {payments}</p>
          <p><strong>Premium Calls:</strong> {premiumCalls}</p>
          <p><strong>Risk Score:</strong> {riskScore ?? "—"}</p>
          <p><strong>Decision:</strong> {decision ?? "—"}</p>

          <div
            style={{
              background: "#000",
              padding: 10,
              borderRadius: 6,
              height: 200,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {dashboard.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
