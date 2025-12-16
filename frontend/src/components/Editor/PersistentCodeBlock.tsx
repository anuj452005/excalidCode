import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, X, Loader2, GripVertical, Check } from 'lucide-react';
import { codeApi } from '../../services/api';

interface PersistentCodeBlockProps {
    id: string;
    initialCode?: string;
    initialLanguage?: string;
    initialOutput?: string;
    x: number;
    y: number;
    onClose: () => void;
    onUpdate: (id: string, code: string, language: string, output: string, x: number, y: number) => void;
    onPositionChange: (id: string, x: number, y: number) => void;
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

export function PersistentCodeBlock({
    id,
    initialCode = '// Write your code here\nconsole.log("Hello, World!");',
    initialLanguage = 'javascript',
    initialOutput = '',
    x: initialX,
    y: initialY,
    onClose,
    onUpdate,
    onPositionChange,
}: PersistentCodeBlockProps) {
    const [code, setCode] = useState(initialCode);
    const [language, setLanguage] = useState(initialLanguage);
    const [output, setOutput] = useState(initialOutput);
    const [isRunning, setIsRunning] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSaved, setIsSaved] = useState(true);
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);

    // Update parent when code/language changes
    useEffect(() => {
        if (!isSaved) {
            const timer = setTimeout(() => {
                onUpdate(id, code, language, output, position.x, position.y);
                setIsSaved(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [code, language, output, position, id, onUpdate, isSaved]);

    const handleCodeChange = (value: string | undefined) => {
        setCode(value || '');
        setIsSaved(false);
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value);
        setIsSaved(false);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setIsError(false);

        try {
            const result = await codeApi.execute(code, language);
            const outputText = result.stderr ? `Error:\n${result.stderr}` : result.output;
            setOutput(outputText);
            setIsError(!!result.stderr);
            setIsSaved(false);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to execute code';
            setOutput(errorMsg);
            setIsError(true);
        } finally {
            setIsRunning(false);
        }
    };

    // Drag handling
    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            elemX: position.x,
            elemY: position.y,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragRef.current) return;
            const dx = moveEvent.clientX - dragRef.current.startX;
            const dy = moveEvent.clientY - dragRef.current.startY;
            const newX = dragRef.current.elemX + dx;
            const newY = dragRef.current.elemY + dy;
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            setIsDragging(false);
            if (dragRef.current) {
                // Calculate final position from ref data to avoid stale closure issue
                const dx = upEvent.clientX - dragRef.current.startX;
                const dy = upEvent.clientY - dragRef.current.startY;
                const finalX = dragRef.current.elemX + dx;
                const finalY = dragRef.current.elemY + dy;
                onPositionChange(id, finalX, finalY);
            }
            dragRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`persistent-code-block ${isDragging ? 'dragging' : ''}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="code-block-header">
                <div
                    className="drag-handle"
                    onMouseDown={handleDragStart}
                >
                    <GripVertical size={16} />
                </div>

                <div className="code-block-language">
                    <select value={language} onChange={handleLanguageChange}>
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>
                </div>

                <div className="code-block-status">
                    {isSaved ? (
                        <span className="saved-indicator"><Check size={12} /> Saved</span>
                    ) : (
                        <span className="unsaved-indicator">Unsaved</span>
                    )}
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
                    onChange={handleCodeChange}
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
