import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setResult(data);

      if (data.status === "error" && data.error_line) {
        markErrorLine(data.error_line);
      }
    } catch (error) {
      setResult({
        status: "error",
        message: "Backend bağlantı hatası.",
        error_line: "-",
        suggestion: "Backend çalışıyor mu kontrol et.",
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
        headers: { "Content-Type": "application/json" },
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

  const isError = result?.status === "error";
  const isSuccess = result?.status === "success";
  const isFixed = result?.status === "fixed";

  return (
    <div className="appShell">
      <div className="glow glowOne"></div>
      <div className="glow glowTwo"></div>

      <header className="header">
        <div>
          <div className="badge">AI Agent • Code Security Scanner</div>
          <h1>AI Code Analyzer</h1>
          <p>Python kodlarını güvenlik, karmaşıklık ve kalite açısından analiz eder.</p>
        </div>

        <div className="statusBox">
          <span className="statusDot"></span>
          Decoder Agent Active
        </div>
      </header>

      <main className="dashboard">
        <section className="editorPanel">
          <div className="panelHeader">
            <span>main.py</span>
            <span className="smallText">Python Analysis Workspace</span>
          </div>

          <div className="editorBox">

            <div className="language-bar">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-select"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
              </select>
            </div>

            <Editor
              height="520px"
              language={selectedLanguage}
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

          <div className="buttons">
            <button className="actionButton analyzeButton" onClick={analyzeCode} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Code"}
            </button>

            {isError && (
              <button className="actionButton fixButton" onClick={fixCode} disabled={loading}>
                Fix the Code
              </button>
            )}
          </div>
        </section>

        <aside className="aiPanel">
          <div className="aiCard">
            <h3>AI Status</h3>
            <p className="metricValue">{loading ? "Running" : "Ready"}</p>
            <span className="smallText">Decoder-Agent-v1</span>
          </div>

          <div className="aiCard">
            <h3>Syntax Status</h3>
            <p className={isError ? "dangerText" : "successText"}>
              {isError ? "Error Found" : isSuccess ? "Valid Code" : "Waiting"}
            </p>
          </div>

          <div className="aiCard">
            <h3>Security Risk</h3>
            <p className="metricValue">
              {result?.security?.risk_level?.toUpperCase() || "-"}
            </p>
            <span className="smallText">
              Score: {result?.security?.risk_score ?? "-"}
            </span>
          </div>

          <div className="aiCard">
            <h3>Complexity</h3>
            <p className="metricValue">
              {result?.analysis?.complexity?.level?.toUpperCase() || "-"}
            </p>
            <span className="smallText">
              Score: {result?.analysis?.complexity?.score ?? "-"}
            </span>
          </div>
        </aside>
      </main>

      {isError && (
        <section className="resultCard errorCard">
          <h2>Syntax Error</h2>
          <p>{result.message}</p>
          <p><strong>Error Line:</strong> {result.error_line}</p>
          <p>{result.suggestion}</p>
        </section>
      )}

      {isFixed && (
        <section className="resultCard successCard">
          <h2>Applied Fixes</h2>
          <ul>
            {result.fixes?.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </section>
      )}

      {isSuccess && (
        <section className="resultGrid">
          <div className="resultCard">
            <h2>Summary</h2>
            <p>{result.summary}</p>
          </div>

          <div className="resultCard">
            <h2>Suggestions</h2>
            <ul>
              {result.suggestions?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;