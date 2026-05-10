import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const clearEditorHighlights = () => {
    const editor = editorRef.current;
    if (!editor) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
  };

  const markErrorLine = (errorLine) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco || !errorLine) return;

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(errorLine, 1, errorLine, 1),
        options: {
          isWholeLine: true,
          className: "errorLine",
          glyphMarginClassName: "errorGlyph",
        },
      },
    ]);

    editor.revealLineInCenter(errorLine);
  };

  const analyzeCode = async () => {
    clearEditorHighlights();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setResult(data);

      if (data.status === "error" && data.error_line) {
        markErrorLine(data.error_line);
      }
    } catch (error) {
      console.error(error);
      setResult({
        status: "error",
        message: "Backend bağlantı hatası.",
        error_line: "-",
        suggestion: "Backend çalışıyor mu kontrol et: uvicorn main:app --reload --port 8001",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixCode = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8001/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.fixed_code) {
        setCode(data.fixed_code);
        clearEditorHighlights();
      }

      setResult({
        status: "fixed",
        fixes: data.fixes,
      });
    } catch (error) {
      console.error(error);
      setResult({
        status: "error",
        message: "Fix işlemi başarısız oldu.",
        error_line: "-",
        suggestion: "Backend /fix endpointini kontrol et.",
      });
    } finally {
      setLoading(false);
    }
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
        backgroundColor: "#020f2f",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "42px" }}>
        AI Code Analyzer
      </h1>

      <p style={{ textAlign: "center", color: "#bfc9d9" }}>
        Python kodlarını güvenlik, karmaşıklık ve kalite açısından analiz eder.
      </p>

      <div
        style={{
          marginTop: "30px",
          border: "1px solid #23395d",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Editor
          height="400px"
          defaultLanguage="python"
          value={code}
          onChange={(value) => {
            setCode(value || "");
            clearEditorHighlights();
          }}
          theme="vs-dark"
          beforeMount={(monaco) => {
            monacoRef.current = monaco;
          }}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            glyphMargin: true,
            automaticLayout: true,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={analyzeCode}
          disabled={loading}
          style={{
            padding: "14px 28px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "#3b82f6",
            color: "white",
            fontSize: "18px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Analyze Code
        </button>

        {result?.status === "error" && (
          <button
            onClick={fixCode}
            disabled={loading}
            style={{
              padding: "14px 28px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#16a34a",
              color: "white",
              fontSize: "18px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Fix the Code
          </button>
        )}
      </div>

      {loading && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Processing code...
        </p>
      )}

      {result?.status === "error" && (
        <div
          style={{
            marginTop: "30px",
            backgroundColor: "#450a0a",
            border: "1px solid #ef4444",
            padding: "22px",
            borderRadius: "12px",
          }}
        >
          <h2>Syntax Error</h2>
          <p>{result.message}</p>
          <p>
            <strong>Error Line:</strong> {result.error_line}
          </p>
          <p>{result.suggestion}</p>
        </div>
      )}

      {result?.status === "fixed" && (
        <div
          style={{
            marginTop: "30px",
            backgroundColor: "#052e16",
            border: "1px solid #22c55e",
            padding: "22px",
            borderRadius: "12px",
          }}
        >
          <h2>Applied Fixes</h2>
          <ul>
            {result.fixes?.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.status === "success" && (
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

          <div style={{ backgroundColor: "#1e293b", padding: "22px", borderRadius: "12px", marginTop: "20px" }}>
            <h3>Summary</h3>
            <p>{result.summary}</p>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "22px", borderRadius: "12px", marginTop: "20px" }}>
            <h3>Suggestions</h3>
            <ul>
              {result.suggestions?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;