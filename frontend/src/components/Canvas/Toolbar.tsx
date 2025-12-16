import {
    MousePointer2,
    Square,
    Circle,
    Minus,
    Pencil,
    Type,
    Code2,
    Image,
    Trash2,
    Undo2,
    Redo2,
    Download,
    Save
} from 'lucide-react';

export type ToolType = 'select' | 'rectangle' | 'circle' | 'line' | 'freehand' | 'text' | 'code' | 'image';

interface ToolbarProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onSave: () => void;
    onDelete: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
}

const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    { id: 'freehand', icon: <Pencil size={20} />, label: 'Freehand' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'code', icon: <Code2 size={20} />, label: 'Code Block' },
    { id: 'image', icon: <Image size={20} />, label: 'Image' },
];

export function Toolbar({
    activeTool,
    onToolChange,
    onSave,
    onDelete,
    onUndo,
    onRedo,
    onExport,
    canUndo,
    canRedo,
    hasSelection,
}: ToolbarProps) {
    return (
        <div className="toolbar">
            {/* Drawing Tools */}
            <div className="toolbar-group">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => onToolChange(tool.id)}
                        data-tooltip={tool.label}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>

            <div className="toolbar-divider" />

            {/* Edit Actions */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    data-tooltip="Undo"
                >
                    <Undo2 size={20} />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    data-tooltip="Redo"
                >
                    <Redo2 size={20} />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onDelete}
                    disabled={!hasSelection}
                    data-tooltip="Delete"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="toolbar-spacer" />

            {/* Save & Export */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={onSave}
                    data-tooltip="Save"
                >
                    <Save size={20} />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onExport}
                    data-tooltip="Export"
                >
                    <Download size={20} />
                </button>
            </div>
        </div>
    );
}
