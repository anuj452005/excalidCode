import { useState, useEffect, useRef, useCallback } from 'react';
import { Code2, Type, Image, Terminal } from 'lucide-react';

interface Command {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const commands: Command[] = [
    { id: 'code', name: '/code', description: 'Add a code execution block', icon: <Code2 size={18} /> },
    { id: 'text', name: '/text', description: 'Add a rich text block', icon: <Type size={18} /> },
    { id: 'image', name: '/image', description: 'Add an image', icon: <Image size={18} /> },
];

interface CommandPaletteProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    onSelectCommand: (commandId: string, position: { x: number; y: number }) => void;
}

export function CommandPalette({ isOpen, position, onClose, onSelectCommand }: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const paletteRef = useRef<HTMLDivElement>(null);

    const filteredCommands = commands.filter(cmd =>
        cmd.name.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase())
    );

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelectCommand(filteredCommands[selectedIndex].id, position);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filteredCommands, selectedIndex, position, onSelectCommand, onClose]);

    const handleSelect = (commandId: string) => {
        onSelectCommand(commandId, position);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={paletteRef}
            className="command-palette"
            style={{ left: position.x, top: position.y }}
        >
            <div className="command-palette-header">
                <Terminal size={16} />
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setSelectedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    className="command-palette-input"
                />
            </div>
            <div className="command-palette-list">
                {filteredCommands.map((cmd, index) => (
                    <button
                        key={cmd.id}
                        className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(cmd.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <span className="command-icon">{cmd.icon}</span>
                        <div className="command-info">
                            <span className="command-name">{cmd.name}</span>
                            <span className="command-desc">{cmd.description}</span>
                        </div>
                    </button>
                ))}
                {filteredCommands.length === 0 && (
                    <div className="command-empty">No commands found</div>
                )}
            </div>
        </div>
    );
}
