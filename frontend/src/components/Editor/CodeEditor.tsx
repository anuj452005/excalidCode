import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, X, Loader2 } from 'lucide-react';
import { codeApi } from '../../services/api';

interface CodeEditorProps {
    id: string;
    initialCode?: string;
    initialLanguage?: string;
    x: number;
    y: number;
    onClose: () => void;
    onUpdate: (code: string, language: string, output: string) => void;
}

const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'php', name: 'PHP' },
];

export function CodeEditor({
    id,
    initialCode = '// Write your code here\nconsole.log("Hello, World!");',
    initialLanguage = 'javascript',
    x,
    y,
    onClose,
    onUpdate,
}: CodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [language, setLanguage] = useState(initialLanguage);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleRun = async () => {
        setIsRunning(true);
        setIsError(false);

        try {
            const result = await codeApi.execute(code, language);
            const outputText = result.stderr ? `Error:\n${result.stderr}` : result.output;
            setOutput(outputText);
            setIsError(!!result.stderr);
            onUpdate(code, language, outputText);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to execute code';
            setOutput(errorMsg);
            setIsError(true);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div
            className="code-block"
            style={{ left: x, top: y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="code-block-header">
                <div className="code-block-language">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>
                </div>

                <div className="code-block-actions">
                    <button
                        className={`run-btn ${isRunning ? 'running' : ''}`}
                        onClick={handleRun}
                        disabled={isRunning}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 size={14} className="spinner" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                Run
                            </>
                        )}
                    </button>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="code-block-editor">
                <Editor
                    height="200px"
                    defaultLanguage={language}
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        padding: { top: 8 },
                    }}
                />
            </div>

            {output && (
                <div className={`code-block-output ${isError ? 'error' : 'success'}`}>
                    <pre>{output}</pre>
                </div>
            )}
        </div>
    );
}
