import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import prettier from "prettier/standalone";
import babelParser from "prettier/plugins/babel";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectResult, setProjectResult] = useState(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const handleSingleFileUpload = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.name.endsWith(".py")) {
    alert("Lütfen sadece .py uzantılı Python dosyası yükleyin.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    setCode(e.target.result);
    clearEditorHighlights();
  };

  reader.readAsText(file);
};

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
        body: JSON.stringify({
          code,
          language: selectedLanguage,
        }),        
      });

      const data = await response.json();
      if (data.fixed_code) {
        setCode(data.fixed_code);
        clearEditorHighlights();
      }
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
    if (selectedLanguage === "javascript") {
      try {
        const formattedCode = await prettier.format(code, {
          parser: "babel",
          plugins: [babelParser],
          semi: true,
        });

        setCode(formattedCode);
        clearEditorHighlights();
        setResult({
          status: "fixed",
          message: "JavaScript kodu Prettier ile otomatik düzenlendi.",
        });

        return;
      } catch (error) {
        setResult({
          status: "error",
          message: "JavaScript kodu otomatik düzeltilemedi. Syntax hatası çok büyük olabilir.",
          suggestion: error.message,
        });

        return;
      }
    }

    try {
    const response = await fetch("http://127.0.0.1:8001/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: selectedLanguage,
      }),
    });

    const data = await response.json();

    if (data.fixed_code) {
      setCode(data.fixed_code);
      clearEditorHighlights();
    }

    setResult(data);
      
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
  const analyzeProject = async () => {
  if (projectFiles.length === 0) {
    setProjectResult({
      status: "error",
      message: "Lütfen analiz edilecek .py dosyalarını seç."
    });
    return;
  }

  setLoading(true);
  setProjectResult(null);

  const formData = new FormData();

  projectFiles.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await fetch("http://127.0.0.1:8001/analyze-project", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setProjectResult(data);
  } catch (error) {
    setProjectResult({
      status: "error",
      message: "Project analyzer backend bağlantı hatası."
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
          <p>Kodları güvenlik, karmaşıklık ve kalite açısından analiz eder.</p>
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
            <span className="smallText">Multi-Language Analysis Workspace</span>
          </div>

          <div className="editorBox">
            
            <div className="editorTopBar">
            <div className="languageSelector">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
              </select>
            </div>

            <label className="uploadButton">
              Upload Code File
              <input
                type="file"
                accept=".py,.js,.java,.cpp,.cc,.cxx,.go"
                onChange={handleSingleFileUpload}
                hidden
              />
            </label>
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
          {result && ( //analizsonucu gelince kartları gösterecek
          // yukarıdaki result varsa ekranda gösterecek
            <div className="agentPipelineCard">
              <h3>AI Agent Pipeline</h3>

              <div className="pipelineSteps">

                <div className="pipelineStep">
                  <span className="stepNumber">1</span>
                  <div>
                    <strong>Syntax Agent</strong>
                    <p>Kodun syntax analizi yapıldı.</p>
                  </div>
                </div>

                <div className="pipelineStep">
                  <span className="stepNumber">2</span>
                  <div>
                    <strong>Security Agent</strong>
                    <p>Güvenlik riskleri tarandı.</p>
                  </div>
                </div>

                <div className="pipelineStep">
                  <span className="stepNumber">3</span>
                  <div>
                    <strong>Complexity Agent</strong>
                    <p>Karmaşıklık hesaplandı.</p>
                  </div>
                </div>

                <div className="pipelineStep">
                  <span className="stepNumber">4</span>
                  <div>
                    <strong>Fix Agent</strong>
                    <p>Otomatik düzeltme sistemi çalıştırıldı.</p>
                  </div>
                </div>

              </div>
            </div>
          )}
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
      <section className="projectUploadPanel">
        <div className="projectHeader">
          <div>
            <h2>Project Understanding Mode</h2>
            <p>Birden fazla Python dosyası yükle, sistem projenin ne yaptığını analiz etsin.</p>
          </div>

          <span className="projectBadge">Codebase Analyzer</span>
        </div>

        <div className="uploadBox">
          <input
            type="file"
            multiple
            accept=".py"
            onChange={(e) => setProjectFiles(Array.from(e.target.files))}
            className="fileInput"
          />

          <button
            className="actionButton analyzeButton"
            onClick={analyzeProject}
            disabled={loading}
          >
            Analyze Project
          </button>
        </div>

        {projectFiles.length > 0 && (
          <div className="fileList">
            {projectFiles.map((file, index) => (
              <span key={index} className="fileChip">
                {file.name}
              </span>
            ))}
          </div>
        )}

        {projectResult && (
          <div className={projectResult.status === "error" ? "projectResult errorCard" : "projectResult"}>
            <h3>Project Analysis Result</h3>

            {projectResult.message && <p>{projectResult.message}</p>}

            {projectResult.project_summary && (
              <p>{projectResult.project_summary}</p>
            )}
            {projectResult.most_complex_file && (
              <div className="insightCard">
                <h4>Most Complex File</h4>
                <p><strong>{projectResult.most_complex_file.filename}</strong></p>
                <p>Complexity: {projectResult.most_complex_file.complexity}</p>
                <p>Lines: {projectResult.most_complex_file.line_count}</p>
                <p>Functions: {projectResult.most_complex_file.function_count}</p>
              </div>
            )}

            {projectResult.dependency_graph && (
              <div className="insightCard">
                <h4>Dependency Graph</h4>

                {Object.entries(projectResult.dependency_graph).map(([file, deps]) => (
                  <p key={file}>
                    <strong>{file}</strong>
                    {" → "}
                    {deps.length > 0 ? deps.join(", ") : "No internal dependency"}
                  </p>
                ))}
              </div>
            )}

            {projectResult.file_reports && (
              <div className="projectFilesGrid">
                {projectResult.file_reports.map((file, index) => (
                  <div key={index} className="projectFileCard">
                    <h4>{file.filename}</h4>
                    <p>Status: {file.status}</p>
                    <p>Lines: {file.line_count ?? "-"}</p>
                    <p>Functions: {file.function_count ?? "-"}</p>
                    <p>Risk: {file.risk_level ?? "-"}</p>
                    <p>Complexity: {file.complexity ?? "-"}</p>
                    <p className="file-purpose">
                      {file.purpose}
                    </p>
                    {file.llm_analysis && (
                      <div className="llmBox">
                        <h4>AI Analysis</h4>
                        <p>{file.llm_analysis}</p>
                      </div>
                    )}                    
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

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