(function() {
    'use strict';

    // ----- DOM refs -----
    const editor = document.getElementById('editor');
    const highlighting = document.getElementById('highlighting');
    const lineNumbers = document.getElementById('lineNumbers');
    const outputBox = document.getElementById('outputBox');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const statusText = document.getElementById('statusText');

    // ----- THEME SWITCHING (same as before) -----
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function getStoredTheme() {
        return localStorage.getItem('pph-theme') || null;
    }
    function setTheme(theme) {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('pph-theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        } else if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('pph-theme', 'light');
            themeToggleBtn.textContent = '🌙';
        } else {
            root.removeAttribute('data-theme');
            localStorage.removeItem('pph-theme');
            const systemTheme = getSystemTheme();
            themeToggleBtn.textContent = systemTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    function toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            setTheme('light');
        } else if (currentTheme === 'light') {
            setTheme('auto');
        } else {
            setTheme('dark');
        }
    }
    function initializeTheme() {
        const stored = getStoredTheme();
        if (stored === 'dark' || stored === 'light') {
            setTheme(stored);
        } else {
            setTheme('auto');
        }
    }
    initializeTheme();
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
        const root = document.documentElement;
        if (!root.hasAttribute('data-theme')) {
            themeToggleBtn.textContent = e.matches ? '☀️' : '🌙';
        }
    });
    themeToggleBtn.addEventListener('click', toggleTheme);

    // ----- Line numbers -----
    function updateLineNumbers() {
        const lines = editor.value.split('\n').length;
        let nums = '';
        for (let i = 1; i <= lines; i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums;
    }

    // ----- Syntax highlighting (JavaScript flavored) -----
    function updateHighlighting() {
        const code = editor.value;
        let escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        let result = '';
        let i = 0;
        const len = escaped.length;

        while (i < len) {
            // Comments: single line // or multi-line /* ... */
            if (escaped[i] === '/' && i + 1 < len && escaped[i+1] === '/') {
                let start = i;
                while (i < len && escaped[i] !== '\n') i++;
                result += '<span class="token comment">' + escaped.substring(start, i) + '</span>';
                continue;
            }
            if (escaped[i] === '/' && i + 1 < len && escaped[i+1] === '*') {
                let start = i;
                i += 2;
                while (i + 1 < len && !(escaped[i] === '*' && escaped[i+1] === '/')) i++;
                i += 2;
                result += '<span class="token comment">' + escaped.substring(start, i) + '</span>';
                continue;
            }

            // Strings (double, single, template)
            if (escaped[i] === '"' || escaped[i] === "'" || escaped[i] === '`') {
                let start = i;
                let quote = escaped[i];
                i++;
                while (i < len && escaped[i] !== quote) {
                    if (escaped[i] === '\\' && i + 1 < len) i += 2;
                    else i++;
                }
                if (i < len && escaped[i] === quote) i++;
                result += '<span class="token string">' + escaped.substring(start, i) + '</span>';
                continue;
            }

            // Numbers
            if (/[0-9]/.test(escaped[i])) {
                let start = i;
                while (i < len && /[0-9.]/.test(escaped[i])) i++;
                result += '<span class="token number">' + escaped.substring(start, i) + '</span>';
                continue;
            }

            // Identifiers / keywords
            if (/[a-zA-Z_]/.test(escaped[i])) {
                let start = i;
                while (i < len && /[a-zA-Z0-9_]/.test(escaped[i])) i++;
                let word = escaped.substring(start, i);
                const keywords = [
                    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
                    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
                    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
                    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
                    'await', 'async', 'let', 'static', 'get', 'set', 'of', 'from'
                ];
                const builtins = [
                    'console', 'log', 'error', 'warn', 'info', 'debug',
                    'Array', 'Object', 'String', 'Number', 'Boolean', 'Promise',
                    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
                    'JSON', 'parse', 'stringify', 'Math', 'Date', 'RegExp',
                    'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect'
                ];
                if (keywords.includes(word)) {
                    result += '<span class="token keyword">' + word + '</span>';
                } else if (builtins.includes(word)) {
                    result += '<span class="token function">' + word + '</span>';
                } else {
                    result += word;
                }
                continue;
            }

            // Operators
            if (/[+\-*/%=<>!&|^~]/.test(escaped[i])) {
                let start = i;
                while (i < len && /[+\-*/%=<>!&|^~]/.test(escaped[i])) i++;
                result += '<span class="token operator">' + escaped.substring(start, i) + '</span>';
                continue;
            }

            // Punctuation
            if (/[(),.[\]{}:;]/.test(escaped[i])) {
                result += '<span class="token punctuation">' + escaped[i] + '</span>';
                i++;
                continue;
            }

            result += escaped[i];
            i++;
        }

        highlighting.innerHTML = result;
    }

    function syncEditor() {
        updateLineNumbers();
        updateHighlighting();
    }

    editor.addEventListener('input', syncEditor);
    editor.addEventListener('scroll', () => {
        highlighting.scrollTop = editor.scrollTop;
        highlighting.scrollLeft = editor.scrollLeft;
        lineNumbers.scrollTop = editor.scrollTop;
    });

    // ----- Output helpers -----
    function clearOutput() {
        outputBox.innerHTML = '';
    }
    function appendOutput(text, className = '') {
        const div = document.createElement('div');
        div.textContent = text;
        if (className) div.className = className;
        outputBox.appendChild(div);
        outputBox.scrollTop = outputBox.scrollHeight;
    }
    function setOutputError(message) {
        clearOutput();
        const div = document.createElement('div');
        div.className = 'error';
        div.textContent = '⚠ ' + message;
        outputBox.appendChild(div);
    }
    function setStatus(text) {
        statusText.textContent = text;
    }

    // ----- Run JavaScript -----
    function runJavaScript(code) {
        clearOutput();
        setStatus('running…');

        // Capture console.log, console.error, etc.
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDebug = console.debug;

        const logs = [];

        function capture(method, args) {
            const msg = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            logs.push({ method, msg });
        }

        console.log = (...args) => { capture('log', args); originalLog(...args); };
        console.error = (...args) => { capture('error', args); originalError(...args); };
        console.warn = (...args) => { capture('warn', args); originalWarn(...args); };
        console.info = (...args) => { capture('info', args); originalInfo(...args); };
        console.debug = (...args) => { capture('debug', args); originalDebug(...args); };

        let result = null;
        let error = null;

        try {
            // Use async Function to support top-level await
            const asyncFn = new Function('return (async () => { ' + code + ' })();');
            result = asyncFn();
        } catch (e) {
            error = e;
        }

        // Handle async result or sync error
        if (error) {
            restoreConsoles();
            const errMsg = error.message || String(error);
            if (logs.length) {
                logs.forEach(({ method, msg }) => {
                    const cls = method === 'error' ? 'error' : '';
                    appendOutput(msg, cls);
                });
            }
            setOutputError('JS Error: ' + errMsg);
            setStatus('error');
            return;
        }

        // If result is a Promise, wait for it
        if (result && typeof result.then === 'function') {
            result
                .then((val) => {
                    restoreConsoles();
                    // show any captured logs
                    logs.forEach(({ method, msg }) => {
                        const cls = method === 'error' ? 'error' : '';
                        appendOutput(msg, cls);
                    });
                    if (val !== undefined) {
                        appendOutput('→ ' + JSON.stringify(val, null, 2), 'success');
                    }
                    if (logs.length === 0 && val === undefined) {
                        appendOutput('(no output)', 'dim');
                    }
                    setStatus('ready');
                })
                .catch((err) => {
                    restoreConsoles();
                    logs.forEach(({ method, msg }) => {
                        const cls = method === 'error' ? 'error' : '';
                        appendOutput(msg, cls);
                    });
                    setOutputError('JS Error: ' + (err.message || String(err)));
                    setStatus('error');
                });
        } else {
            // Sync result
            restoreConsoles();
            logs.forEach(({ method, msg }) => {
                const cls = method === 'error' ? 'error' : '';
                appendOutput(msg, cls);
            });
            if (result !== undefined && result !== null) {
                appendOutput('→ ' + JSON.stringify(result, null, 2), 'success');
            }
            if (logs.length === 0 && result === undefined) {
                appendOutput('(no output)', 'dim');
            }
            setStatus('ready');
        }

        function restoreConsoles() {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            console.debug = originalDebug;
        }
    }

    function handleRun() {
        const code = editor.value;
        runJavaScript(code);
    }

    // ----- Reset Example (JS flavor) -----
    function resetExample() {
        const example = `// Welcome to the JavaScript Console Playground!
        console.log("👋 Hello from JavaScript!");
        
        // Variables and types
        const name = "PPH learner";
        console.log(\`Welcome, \${name}!\`);
        
        // Arrays and methods
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(n => n * 2);
        console.log("Doubled:", doubled);
        
        // Async / await works too!
        (async () => {
            const result = await Promise.resolve("✨ Async works!");
            console.log(result);
            return "done";
        })();`;
        editor.value = example;
        syncEditor();
        clearOutput();
        appendOutput('› example loaded · press Run', 'dim');
        setStatus('idle');
    }

    // ----- Download -----
    function downloadCode() {
        const code = editor.value;
        if (!code.trim()) {
            appendOutput('⚠ No code to download!', 'dim');
            return;
        }
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'script.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        appendOutput('✓ Downloaded as script.js', 'success');
    }

    // ----- Keyboard shortcut -----
    editor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRun();
        }
    });

    // ----- Event listeners -----
    runBtn.addEventListener('click', handleRun);
    resetBtn.addEventListener('click', resetExample);
    downloadBtn.addEventListener('click', downloadCode);

    // ----- Init -----
    syncEditor();
    clearOutput();
    appendOutput('› ready · press Run or Ctrl+Enter', 'dim');
    setStatus('idle');
})();