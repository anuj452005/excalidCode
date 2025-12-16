import { useState, useEffect } from 'react';
import {
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    Plus,
    FolderPlus,
    Trash2,
    Edit2,
    Check,
    X
} from 'lucide-react';
import { filesApi, FileItem } from '../../services/api';

interface FileTreeProps {
    activeFileId: string | null;
    onFileSelect: (file: FileItem) => void;
}

export function FileTree({ activeFileId, onFileSelect }: FileTreeProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder'; parentId: string | null } | null>(null);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const data = await filesApi.getAll();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!newName.trim() || !isCreating || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const file = await filesApi.create({
                name: newName.trim(),
                type: isCreating.type,
                parentId: isCreating.parentId || undefined,
            });

            setFiles(prev => [...prev, file]);
            setIsCreating(null);
            setNewName('');

            if (isCreating.type === 'file') {
                onFileSelect(file);
            }
        } catch (error) {
            console.error('Failed to create:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRename = async (id: string) => {
        if (!editName.trim()) return;

        try {
            const updated = await filesApi.update(id, { name: editName.trim() });
            setFiles(prev => prev.map(f => f._id === id ? updated : f));
            setEditingId(null);
            setEditName('');
        } catch (error) {
            console.error('Failed to rename:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await filesApi.delete(id);
            setFiles(prev => prev.filter(f => f._id !== id && f.parentId !== id));
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const buildTree = (parentId: string | null = null): FileItem[] => {
        return files
            .filter(f => f.parentId === parentId)
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    };

    const renderItem = (item: FileItem, level: number = 0) => {
        const isExpanded = expandedFolders.has(item._id);
        const children = item.type === 'folder' ? buildTree(item._id) : [];
        const isEditing = editingId === item._id;
        const isActive = activeFileId === item.canvasId;

        return (
            <div key={item._id}>
                <div
                    className={`file-item ${item.type} ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                    onClick={() => {
                        if (item.type === 'folder') {
                            toggleFolder(item._id);
                        } else {
                            onFileSelect(item);
                        }
                    }}
                >
                    {item.type === 'folder' && (
                        <span className="folder-toggle">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    )}

                    <span className="file-item-icon">
                        {item.type === 'folder' ? <Folder size={16} /> : <File size={16} />}
                    </span>

                    {isEditing ? (
                        <input
                            type="text"
                            className="file-item-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRename(item._id);
                                }
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingId(null);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    ) : (
                        <span className="file-item-name">{item.name}</span>
                    )}

                    <div className="file-item-actions">
                        {isEditing ? (
                            <>
                                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleRename(item._id); }}>
                                    <Check size={14} />
                                </button>
                                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                {item.type === 'folder' && (
                                    <>
                                        <button
                                            className="icon-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFolders(prev => new Set(prev).add(item._id));
                                                setIsCreating({ type: 'file', parentId: item._id });
                                            }}
                                            data-tooltip="New File"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <button
                                            className="icon-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFolders(prev => new Set(prev).add(item._id));
                                                setIsCreating({ type: 'folder', parentId: item._id });
                                            }}
                                            data-tooltip="New Folder"
                                        >
                                            <FolderPlus size={14} />
                                        </button>
                                    </>
                                )}
                                <button
                                    className="icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(item._id);
                                        setEditName(item.name);
                                    }}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {item.type === 'folder' && isExpanded && (
                    <div className="folder-children">
                        {children.map(child => renderItem(child, level + 1))}
                        {isCreating && isCreating.parentId === item._id && renderCreateInput(level + 1)}
                    </div>
                )}
            </div>
        );
    };

    const renderCreateInput = (level: number = 0) => (
        <div
            className="file-item"
            style={{ paddingLeft: `${12 + level * 16}px` }}
        >
            <span className="file-item-icon">
                {isCreating?.type === 'folder' ? <Folder size={16} /> : <File size={16} />}
            </span>
            <input
                type="text"
                className="file-item-input"
                placeholder={`New ${isCreating?.type}...`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreate();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsCreating(null);
                    }
                }}
                autoFocus
            />
            <div className="file-item-actions" style={{ display: 'flex' }}>
                <button className="icon-btn" onClick={handleCreate}>
                    <Check size={14} />
                </button>
                <button className="icon-btn" onClick={() => setIsCreating(null)}>
                    <X size={14} />
                </button>
            </div>
        </div>
    );

    const rootItems = buildTree(null);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <h1>ExcaliCode</h1>
                </div>
                <div className="sidebar-actions">
                    <button
                        className="icon-btn"
                        data-tooltip="New File"
                        onClick={() => setIsCreating({ type: 'file', parentId: null })}
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        className="icon-btn"
                        data-tooltip="New Folder"
                        onClick={() => setIsCreating({ type: 'folder', parentId: null })}
                    >
                        <FolderPlus size={18} />
                    </button>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="file-tree">
                    {rootItems.map(item => renderItem(item))}
                    {isCreating && isCreating.parentId === null && renderCreateInput()}

                    {files.length === 0 && !isCreating && (
                        <div className="empty-state" style={{ padding: '20px' }}>
                            <p style={{ fontSize: '13px' }}>No files yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
