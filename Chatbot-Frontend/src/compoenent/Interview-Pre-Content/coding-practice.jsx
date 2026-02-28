"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

const starter = {
  HTML: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Playground</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
            font-size: 16px;
            transition: background 0.3s;
        }
        button:hover {
            background: #5a67d8;
        }
        .demo-input {
            margin: 15px 0;
            padding: 10px;
            width: 100%;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, HTML Playground!</h1>
        <p>Try changing the text below and click Run to see updates:</p>
        <input type="text" class="demo-input" value="Type something here..." 
               oninput="this.nextElementSibling.textContent = 'You typed: ' + this.value">
        <p id="output">You typed: Type something here...</p>
        <button onclick="alert('Button clicked! Try editing this code.')">
            Click Me!
        </button>
    </div>
</body>
</html>`,

  JS: `// JavaScript Demo: Basic Variables and Operations
let name = "Shubham";
console.log("Welcome, " + name);

let a = 5, b = 3;
console.log(a + b);
`,

  PY: `# Python Demo: Basic Variables and Operations
name = "Shubham"
print("Welcome,", name)

a, b = 5, 3
print(a + b)
`,
};

export default function CodingPracticePage() {
  const [mode, setMode] = useState("HTML");
  const [code, setCode] = useState(starter.HTML);
  const [output, setOutput] = useState("");
  const iframeRef = useRef(null);
  const [pyReady, setPyReady] = useState(false);
  const pyodideRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // Switch starter code when tab changes
  useEffect(() => {
    setOutput("");
    if (mode === "HTML") setCode(starter.HTML);
    if (mode === "JS") setCode(starter.JS);
    if (mode === "PY") setCode(starter.PY);
    
    // Reset iframe
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
  }, [mode]);

  // Listen to messages from iframe (console logs & errors)
  useEffect(() => {
    function onMessage(e) {
      const data = e.data || {};
      if (data && data.__playground) {
        const { type, payload } = data;
        if (type === "log") {
          setOutput((o) => (o ? o + "\n" : "") + payload);
        } else if (type === "error") {
          setOutput((o) => (o ? o + "\n" : "") + "Error: " + payload);
        } else if (type === "clear") {
          setOutput("");
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Load Pyodide when Python mode is requested
  useEffect(() => {
    let aborted = false;
    async function initPyodide() {
      if (pyodideRef.current) {
        setPyReady(true);
        return;
      }
      setOutput((o) => (o ? o + "\n" : "") + "Loading Python runtime (Pyodide) ...");
      try {
        // Check if pyodide is already loaded
        if (window.loadPyodide) {
          const pyodide = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
          });
          if (!aborted) {
            pyodideRef.current = pyodide;
            setPyReady(true);
            setOutput((o) => (o ? o + "\n" : "") + "✅ Pyodide ready. You can run Python code!");
          }
          return;
        }

        // Load pyodide script
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
        
        script.onload = async () => {
          if (aborted) return;
          try {
            const pyodide = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
            });
            pyodideRef.current = pyodide;
            setPyReady(true);
            setOutput((o) => (o ? o + "\n" : "") + "✅ Pyodide ready. You can run Python code!");
          } catch (err) {
            setOutput((o) => (o ? o + "\n" : "") + "❌ Failed to initialize Pyodide: " + err);
          }
        };
        
        script.onerror = () => {
          setOutput((o) => (o ? o + "\n" : "") + "❌ Failed to load Pyodide script");
        };
        
        document.head.appendChild(script);
      } catch (err) {
        setOutput((o) => (o ? o + "\n" : "") + "❌ Error loading Pyodide: " + err);
      }
    }

    if (mode === "PY") {
      initPyodide();
    }
    
    return () => {
      aborted = true;
    };
  }, [mode]);

  // Clear output and iframe
  function clearOutputAndIframe() {
    setOutput("");
    if (iframeRef.current) {
      try {
        iframeRef.current.srcdoc = "";
      } catch (e) {
        // ignore
      }
    }
  }

  // Run HTML: render srcDoc in iframe
  function runHTML(userCode) {
    setIsRunning(true);
    clearOutputAndIframe();
    
    // Create a complete HTML document with the user's code
    const html = userCode;
    
    // Set iframe srcdoc with a slight delay to ensure rendering
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html;
      }
      setOutput("✅ HTML rendered successfully in preview pane.");
      setIsRunning(false);
    }, 100);
  }

  // Run JavaScript
  function runJS(userCode) {
    setIsRunning(true);
    clearOutputAndIframe();
    
    const wrapped = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>JS Playground</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            background: #1a202c;
            color: #e2e8f0;
            padding: 20px;
            margin: 0;
        }
        .output {
            background: #2d3748;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            border-left: 4px solid #4299e1;
        }
    </style>
</head>
<body>
    <h2>JavaScript Output</h2>
    <div class="output" id="consoleOutput"></div>
    
    <script>
        // Override console methods to capture output
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        const consoleOutput = document.getElementById('consoleOutput');
        
        function captureConsole(method, args) {
            const message = Array.from(args).map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            const div = document.createElement('div');
            div.textContent = \`\${method}: \${message}\`;
            div.style.color = method === 'error' ? '#fc8181' : 
                             method === 'warn' ? '#f6ad55' : '#68d391';
            div.style.margin = '5px 0';
            div.style.fontFamily = 'monospace';
            consoleOutput.appendChild(div);
            
            // Send to parent window
            parent.postMessage({
                __playground: true,
                type: method === 'error' ? 'error' : 'log',
                payload: message
            }, "*");
            
            // Also log to original console
            originalConsole[method].apply(console, args);
        }
        
        console.log = (...args) => captureConsole('log', args);
        console.error = (...args) => captureConsole('error', args);
        console.warn = (...args) => captureConsole('warn', args);
        console.info = (...args) => captureConsole('info', args);
        
        // Clear previous output
        parent.postMessage({ __playground: true, type: 'clear', payload: '' }, "*");
        
        // Execute user code with error handling
        try {
            ${userCode}
        } catch (error) {
            console.error('Execution Error:', error.message);
        }
    </script>
</body>
</html>`;
    
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = wrapped;
      }
      setIsRunning(false);
    }, 100);
  }

  // Run Python using pyodide
  async function runPython(userCode) {
    setIsRunning(true);
    setOutput("");
    
    if (!pyodideRef.current) {
      setOutput("⏳ Python runtime is loading... Please wait a moment.");
      setIsRunning(false);
      return;
    }
    
    try {
      const pyodide = pyodideRef.current;
      
      // Clear previous output
      setOutput("Running Python code...\n");
      
      // Redirect Python's print to our output
      pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
      
      // Execute user code
      const result = await pyodide.runPythonAsync(userCode);
      
      // Get output from stdout
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      const stderr = pyodide.runPython("sys.stderr.getvalue()");
      
      let finalOutput = "";
      if (stderr) {
        finalOutput += "❌ Errors:\n" + stderr + "\n";
      }
      if (stdout) {
        finalOutput += "✅ Output:\n" + stdout;
      }
      if (result && !stdout && !stderr) {
        finalOutput += "Result: " + String(result);
      }
      
      setOutput(finalOutput || "✅ Code executed successfully (no output).");
    } catch (error) {
      setOutput("❌ Error:\n" + error.toString());
    } finally {
      setIsRunning(false);
    }
  }

  // Handle run button click
  function handleRun() {
    if (!code.trim()) {
      setOutput("Please write some code first!");
      return;
    }
    
    setOutput("Running...");
    
    if (mode === "HTML") {
      runHTML(code);
    } else if (mode === "JS") {
      runJS(code);
    } else if (mode === "PY") {
      runPython(code);
    }
  }

  // Reset to starter code
  function handleReset() {
    if (mode === "HTML") setCode(starter.HTML);
    if (mode === "JS") setCode(starter.JS);
    if (mode === "PY") setCode(starter.PY);
    setOutput("Reset to starter code.");
    
    // Clear iframe
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-gray-100">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 py-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Interactive Code Playground
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Edit code in HTML, JavaScript, or Python. Click Run to see results instantly.
        </p>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor + controls */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {["HTML", "JS", "PY"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mode === m
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {m === "PY" ? "Python" : m === "JS" ? "JavaScript" : "HTML/CSS"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>

              <button
                onClick={handleRun}
                disabled={isRunning || (mode === "PY" && !pyReady)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold shadow-lg transition ${
                  isRunning || (mode === "PY" && !pyReady)
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                }`}
              >
                <Play className="w-4 h-4" />
                {isRunning ? "Running..." : "Run Code"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                Editor ({mode === "PY" ? "Python" : mode === "JS" ? "JavaScript" : "HTML/CSS"})
              </label>
              <div className="text-xs text-slate-400">
                {mode === "PY" && (
                  pyReady ? (
                    <span className="text-green-400">✅ Python ready</span>
                  ) : (
                    <span className="text-yellow-400">⏳ Loading Python...</span>
                  )
                )}
              </div>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[400px] p-4 bg-[#0b1220] text-slate-100 font-mono text-sm rounded-lg border border-slate-700 resize-none outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              spellCheck="false"
              placeholder={`Edit your ${mode === "PY" ? "Python" : mode === "JS" ? "JavaScript" : "HTML/CSS"} code here...`}
            />
            
            <div className="mt-3 text-xs text-slate-400">
              <p>
                💡 <strong>Demo:</strong> {mode === "HTML" ? "Edit the HTML/CSS to see instant changes" : 
                  mode === "JS" ? "Modify the variables and see output" : 
                  "Change the Python variables and run to see results"}
              </p>
            </div>
          </div>
        </section>

        {/* Right: Preview / Terminal */}
        <section className="space-y-4">
          {/* Preview area */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-300">
                Live Preview {mode === "HTML" ? "(HTML/CSS/JS)" : mode === "JS" ? "(JavaScript Output)" : ""}
              </div>
              <div className="text-xs text-slate-400">
                {mode === "PY" ? "Python runs in terminal only" : "Interactive output"}
              </div>
            </div>
            <div className="w-full h-64 bg-white rounded-lg overflow-hidden border border-slate-900">
              <iframe
                ref={iframeRef}
                title="playground-preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>
            {mode === "PY" && (
              <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  <strong>Note:</strong> Python runs in the terminal below. The preview pane is for HTML/JavaScript output only.
                </p>
              </div>
            )}
          </div>

          {/* Terminal output */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-green-300">Terminal Output</div>
                <div className="text-xs px-2 py-1 bg-slate-800 rounded">
                  {mode === "PY" ? "Python" : mode === "JS" ? "JavaScript Console" : "Execution Logs"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOutput("")}
                  className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Clear
                </button>
              </div>
            </div>
            <pre className="h-48 overflow-auto text-sm font-mono text-slate-100 bg-[#0a0f1a] p-4 rounded-lg border border-slate-800 whitespace-pre-wrap">
              {output || (mode === "HTML" ? "HTML will render in the preview above. Run to see it!" : 
                mode === "JS" ? "JavaScript output will appear here after running." : 
                "Python output will appear here after running.")}
            </pre>
            <div className="mt-3 text-xs text-slate-400">
              <p>
                {mode === "PY" ? 
                  "Python runs in browser using Pyodide (WASM). First run may take a moment to load." :
                  "Console logs, errors, and execution results appear here."}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-8 text-xs text-slate-500">
        <div className="border-t border-slate-800 pt-4">
          <p>
            <strong>Features:</strong> HTML/CSS/JS run in sandboxed iframe • JavaScript captures console output • 
            Python runs via Pyodide (WebAssembly) • All code executes in your browser
          </p>
          <p className="mt-2">
            <strong>Try:</strong> Edit the HTML text and colors • Modify JavaScript variables • Change Python variables
          </p>
        </div>
      </footer>
    </div>
  );
}