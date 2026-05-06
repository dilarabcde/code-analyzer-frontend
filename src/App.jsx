import { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);

  const analyzeCode = async () => {
    try {
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
    }
  };

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
      <h1 style={{ fontSize: "40px" }}>
        AI Code Analyzer
      </h1>

      <textarea
        rows="15"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Python kodunu buraya yaz..."
        style={{
          width: "100%",
          marginTop: "20px",
          padding: "20px",
          borderRadius: "10px",
          fontSize: "16px",
          backgroundColor: "#1e293b",
          color: "white",
          border: "none",
        }}
      />

      <button
        onClick={analyzeCode}
        style={{
          marginTop: "20px",
          padding: "15px 30px",
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

      {result && (
        <div
          style={{
            marginTop: "30px",
            backgroundColor: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h2>Analysis Result</h2>

          <p>
            <strong>Risk Level:</strong>{" "}
            {result.security?.risk_level}
          </p>

          <p>
            <strong>Complexity:</strong>{" "}
            {result.analysis?.complexity?.level}
          </p>

          <p>
            <strong>Summary:</strong>{" "}
            {result.summary}
          </p>

          <h3>Suggestions</h3>

          <ul>
            {result.suggestions?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;