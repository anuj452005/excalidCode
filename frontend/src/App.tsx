import { useState, useCallback, useEffect, useMemo } from 'react';
import { FileTree } from './components/Sidebar/FileTree';
import { Toolbar, ToolType } from './components/Canvas/Toolbar';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';
import { RichTextEditor } from './components/Editor/RichTextEditor';
import { PersistentCodeBlock } from './components/Editor/PersistentCodeBlock';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { useCanvas } from './hooks/useCanvas';
import { FileItem, CanvasElement } from './services/api';
import { Layers } from 'lucide-react';

function App() {
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [hasSelection, setHasSelection] = useState(false);
    const [textBlocks, setTextBlocks] = useState<Array<{ id: string; x: number; y: number; text: string }>>([]);

    // Command palette state
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [commandPosition, setCommandPosition] = useState({ x: 100, y: 100 });

    const {
        canvas,
        saveCanvas,
        addElement,
        updateElement,
        deleteElement,
    } = useCanvas(activeFile?.canvasId || null);

    const [elements, setElements] = useState<CanvasElement[]>([]);

    // Load elements when canvas changes
    useEffect(() => {
        if (canvas) {
            setElements(canvas.elements || []);
        }
    }, [canvas]);

    // Get persisted code blocks from elements
    const persistedCodeBlocks = useMemo(() => {
        return elements.filter(el => el.type === 'code');
    }, [elements]);

    // Handle "/" key for command palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input/editor
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.monaco-editor')) {
                return;
            }

            if (e.key === '/' && !commandPaletteOpen && activeFile) {
                e.preventDefault();
                // Position command palette at center of viewport
                const centerX = window.innerWidth / 2 - 150;
                const centerY = window.innerHeight / 3;
                setCommandPosition({ x: centerX, y: centerY });
                setCommandPaletteOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [commandPaletteOpen, activeFile]);

    const handleFileSelect = useCallback((file: FileItem) => {
        setActiveFile(file);
        setTextBlocks([]);
    }, []);

    const handleToolChange = useCallback((tool: ToolType) => {
        setActiveTool(tool);
    }, []);

    const handleElementsChange = useCallback((newElements: CanvasElement[]) => {
        setElements(newElements);
    }, []);

    // Handle command selection
    const handleCommand = useCallback(async (commandId: string, position: { x: number; y: number }) => {
        if (!activeFile?.canvasId) return;

        if (commandId === 'code') {
            const newCodeBlock: CanvasElement = {
                id: `code-${Date.now()}`,
                type: 'code',
                x: position.x,
                y: position.y,
                code: '// Write your code here\nconsole.log("Hello, World!");',
                language: 'javascript',
                output: '',
            };
            await addElement(newCodeBlock);
        } else if (commandId === 'text') {
            setTextBlocks(prev => [...prev, {
                id: `text-${Date.now()}`,
                x: position.x,
                y: position.y,
                text: '',
            }]);
        }
    }, [activeFile, addElement]);

    // Handle code block update
    const handleCodeBlockUpdate = useCallback(async (id: string, code: string, language: string, output: string, x: number, y: number) => {
        await updateElement(id, { code, language, output, x, y });
    }, [updateElement]);

    // Handle code block position change
    const handleCodeBlockPositionChange = useCallback(async (id: string, x: number, y: number) => {
        await updateElement(id, { x, y });
    }, [updateElement]);

    // Handle code block close/delete
    const handleCodeBlockClose = useCallback(async (id: string) => {
        await deleteElement(id);
    }, [deleteElement]);

    const handleSave = useCallback(async () => {
        if (!activeFile?.canvasId) return;

        await saveCanvas(elements);
        console.log('Canvas saved!');
    }, [activeFile, elements, saveCanvas]);

    const handleDelete = useCallback(() => {
        if ((window as any).deleteSelectedCanvasObjects) {
            (window as any).deleteSelectedCanvasObjects();
        }
    }, []);

    const handleUndo = useCallback(() => {
        // TODO: Implement undo
        console.log('Undo');
    }, []);

    const handleRedo = useCallback(() => {
        // TODO: Implement redo
        console.log('Redo');
    }, []);

    const handleExport = useCallback(() => {
        // TODO: Implement export
        console.log('Export');
    }, []);

    // Handle canvas click for text blocks (keep existing behavior for toolbar)
    useEffect(() => {
        const handleCanvasClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.canvas-container')) return;

            if (activeTool === 'code' && activeFile?.canvasId) {
                const rect = target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const newCodeBlock: CanvasElement = {
                    id: `code-${Date.now()}`,
                    type: 'code',
                    x,
                    y,
                    code: '// Write your code here\nconsole.log("Hello!");',
                    language: 'javascript',
                    output: '',
                };
                addElement(newCodeBlock);
                setActiveTool('select');
            }

            if (activeTool === 'text') {
                const rect = target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                setTextBlocks(prev => [...prev, {
                    id: `text-${Date.now()}`,
                    x,
                    y,
                    text: '',
                }]);
                setActiveTool('select');
            }
        };

        document.addEventListener('click', handleCanvasClick);
        return () => document.removeEventListener('click', handleCanvasClick);
    }, [activeTool, activeFile, addElement]);

    return (
        <div className="app">
            <FileTree
                activeFileId={activeFile?.canvasId || null}
                onFileSelect={handleFileSelect}
            />

            <div className="main-content">
                <Toolbar
                    activeTool={activeTool}
                    onToolChange={handleToolChange}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onExport={handleExport}
                    canUndo={false}
                    canRedo={false}
                    hasSelection={hasSelection}
                />

                {activeFile ? (
                    <div style={{ position: 'relative', flex: 1 }}>
                        <InfiniteCanvas
                            fileId={activeFile.canvasId || null}
                            activeTool={activeTool}
                            elements={elements.filter(el => el.type !== 'code')}
                            onElementsChange={handleElementsChange}
                            onSelectionChange={setHasSelection}
                        />

                        {/* Persistent Code Blocks */}
                        {persistedCodeBlocks.map(block => (
                            <PersistentCodeBlock
                                key={block.id}
                                id={block.id}
                                initialCode={block.code}
                                initialLanguage={block.language}
                                initialOutput={block.output}
                                x={block.x}
                                y={block.y}
                                onClose={() => handleCodeBlockClose(block.id)}
                                onUpdate={handleCodeBlockUpdate}
                                onPositionChange={handleCodeBlockPositionChange}
                            />
                        ))}

                        {/* Text Blocks */}
                        {textBlocks.map(block => (
                            <RichTextEditor
                                key={block.id}
                                id={block.id}
                                initialText={block.text}
                                x={block.x}
                                y={block.y}
                                onUpdate={(text) => {
                                    setTextBlocks(prev => prev.map(b =>
                                        b.id === block.id ? { ...b, text } : b
                                    ));
                                }}
                                onBlur={() => {
                                    // Remove empty text blocks
                                    const block2 = textBlocks.find(b => b.id === block.id);
                                    if (block2 && !block2.text.trim()) {
                                        setTextBlocks(prev => prev.filter(b => b.id !== block.id));
                                    }
                                }}
                            />
                        ))}

                        {/* Command Palette */}
                        <CommandPalette
                            isOpen={commandPaletteOpen}
                            position={commandPosition}
                            onClose={() => setCommandPaletteOpen(false)}
                            onSelectCommand={handleCommand}
                        />

                        {/* Hint for command palette */}
                        <div className="command-hint">
                            Press <kbd>/</kbd> to open command palette
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Layers className="empty-state-icon" />
                        <h3>No File Selected</h3>
                        <p>Create or select a file from the sidebar to start drawing</p>
                    </div>
                )}

                <div className="status-bar">
                    <div className="status-bar-left">
                        <div className="status-indicator">
                            <span className="status-dot" />
                            <span>Connected</span>
                        </div>
                        {activeFile && (
                            <span>Editing: {activeFile.name}</span>
                        )}
                    </div>
                    <div className="status-bar-right">
                        <span>{elements.length} elements</span>
                        <span>Tool: {activeTool}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
