import axios from 'axios';

const API_BASE = '/api';

export interface FileItem {
    _id: string;
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    canvasId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CanvasElement {
    id: string;
    type: 'rectangle' | 'circle' | 'line' | 'freehand' | 'text' | 'code' | 'image';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: number[];
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    text?: string;
    code?: string;
    language?: string;
    output?: string;
    fontSize?: number;
    fontFamily?: string;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
}

export interface CanvasState {
    _id: string;
    fileId: string;
    elements: CanvasElement[];
    viewportTransform: number[];
    backgroundColor: string;
}

export interface CodeExecutionResult {
    output: string;
    stderr: string;
    exitCode: number;
    executionTime: string;
}

// File API
export const filesApi = {
    getAll: () => axios.get<FileItem[]>(`${API_BASE}/files`).then(r => r.data),
    getByParent: (parentId: string | null) =>
        axios.get<FileItem[]>(`${API_BASE}/files/parent/${parentId || 'null'}`).then(r => r.data),
    create: (data: { name: string; type: 'file' | 'folder'; parentId?: string }) =>
        axios.post<FileItem>(`${API_BASE}/files`, data).then(r => r.data),
    update: (id: string, data: { name: string }) =>
        axios.put<FileItem>(`${API_BASE}/files/${id}`, data).then(r => r.data),
    delete: (id: string) => axios.delete(`${API_BASE}/files/${id}`),
};

// Canvas API
export const canvasApi = {
    get: (fileId: string) =>
        axios.get<CanvasState>(`${API_BASE}/canvas/${fileId}`).then(r => r.data),
    save: (fileId: string, data: Partial<CanvasState>) =>
        axios.put<CanvasState>(`${API_BASE}/canvas/${fileId}`, data).then(r => r.data),
    addElement: (fileId: string, element: CanvasElement) =>
        axios.post<CanvasState>(`${API_BASE}/canvas/${fileId}/element`, element).then(r => r.data),
    updateElement: (fileId: string, elementId: string, updates: Partial<CanvasElement>) =>
        axios.put<CanvasState>(`${API_BASE}/canvas/${fileId}/element/${elementId}`, updates).then(r => r.data),
    deleteElement: (fileId: string, elementId: string) =>
        axios.delete(`${API_BASE}/canvas/${fileId}/element/${elementId}`),
};

// Code Execution API
export const codeApi = {
    execute: (code: string, language: string, stdin?: string) =>
        axios.post<CodeExecutionResult>(`${API_BASE}/code/execute`, { code, language, stdin }).then(r => r.data),
    getLanguages: () => axios.get(`${API_BASE}/code/languages`).then(r => r.data),
};
