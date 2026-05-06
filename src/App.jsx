import Editor from "@monaco-editor/react";
import { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeCode = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleCode = () => {
    setCode(`api_key = "sk-test-123456"
password = "12345"

def login(user):
    if password == "12345":
        return True
    return False

for i in range(5):
    print(i)`);
  };

  const riskColor =
    result?.security?.risk_level === "high"
      ? "#ef4444"
      : result?.security?.risk_level === "medium"
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "42px" }}>
        AI Code Analyzer
      </h1>

      <p style={{ textAlign: "center", color: "#94a3b8" }}>
        Python kodlarını güvenlik, karmaşıklık ve kalite açısından analiz eder.
      </p>

      <div style={{ marginTop: "25px", borderRadius: "12px", overflow: "hidden" }}>
        <Editor
          height="400px"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={loadSampleCode}
          style={{
            marginTop: "20px",
            marginRight: "12px",
            padding: "14px 28px",
            borderRadius: "10px",
            border: "1px solid #334155",
            backgroundColor: "#1e293b",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Load Sample Code
        </button>

        <button
          onClick={analyzeCode}
          style={{
            marginTop: "20px",
            padding: "14px 32px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Analyze Code
        </button>

        {loading && <p>Analyzing code...</p>}
      </div>

      {result && (
        <div style={{ marginTop: "35px" }}>
          <h2 style={{ textAlign: "center" }}>Analysis Result</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px" }}>
              <h3>Security Risk</h3>
              <p style={{ color: riskColor, fontSize: "24px", fontWeight: "bold" }}>
                {result.security?.risk_level?.toUpperCase()}
              </p>
              <p>Score: {result.security?.risk_score}</p>
            </div>

            <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px" }}>
              <h3>Complexity</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                {result.analysis?.complexity?.level?.toUpperCase()}
              </p>
              <p>Score: {result.analysis?.complexity?.score}</p>
            </div>

            <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px" }}>
              <h3>Code Metrics</h3>
              <p>Functions: {result.analysis?.function_count}</p>
              <p>Loops: {result.analysis?.loops}</p>
              <p>Lines: {result.analysis?.line_count}</p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "22px",
              borderRadius: "12px",
              marginTop: "20px",
            }}
          >
            <h3>Summary</h3>
            <p>{result.summary}</p>
          </div>

          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "22px",
              borderRadius: "12px",
              marginTop: "20px",
              border: "1px solid #334155",
            }}
          >
            <h3>AI Agent Recommendation</h3>
            <p>{result.agent_recommendation}</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            <div style={{ backgroundColor: "#1e293b", padding: "22px", borderRadius: "12px" }}>
              <h3>Detected Risks</h3>
              <p>
                <strong>Imports:</strong>{" "}
                {result.security?.imports?.join(", ") || "None"}
              </p>
              <p>
                <strong>Dangerous Calls:</strong>{" "}
                {result.security?.dangerous_calls?.join(", ") || "None"}
              </p>
              <p>
                <strong>Hardcoded Secrets:</strong>{" "}
                {result.security?.hardcoded_secrets?.join(", ") || "None"}
              </p>
            </div>

            <div style={{ backgroundColor: "#1e293b", padding: "22px", borderRadius: "12px" }}>
              <h3>Suggestions</h3>
              <ul>
                {result.suggestions?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;