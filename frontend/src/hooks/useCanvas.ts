import { useState, useCallback, useEffect } from 'react';
import { canvasApi, CanvasState, CanvasElement } from '../services/api';

export function useCanvas(fileId: string | null) {
    const [canvas, setCanvas] = useState<CanvasState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load canvas
    const loadCanvas = useCallback(async () => {
        if (!fileId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await canvasApi.get(fileId);
            setCanvas(data);
        } catch (err) {
            setError('Failed to load canvas');
            console.error('Load canvas error:', err);
        } finally {
            setLoading(false);
        }
    }, [fileId]);

    // Save canvas
    const saveCanvas = useCallback(async (elements: CanvasElement[], viewportTransform?: number[]) => {
        if (!fileId) return;

        try {
            const data = await canvasApi.save(fileId, {
                elements,
                viewportTransform,
            });
            setCanvas(data);
        } catch (err) {
            console.error('Save canvas error:', err);
        }
    }, [fileId]);

    // Add element
    const addElement = useCallback(async (element: CanvasElement) => {
        if (!fileId) return;

        try {
            const data = await canvasApi.addElement(fileId, element);
            setCanvas(data);
            return data;
        } catch (err) {
            console.error('Add element error:', err);
        }
    }, [fileId]);

    // Update element
    const updateElement = useCallback(async (elementId: string, updates: Partial<CanvasElement>) => {
        if (!fileId) return;

        try {
            const data = await canvasApi.updateElement(fileId, elementId, updates);
            setCanvas(data);
            return data;
        } catch (err) {
            console.error('Update element error:', err);
        }
    }, [fileId]);

    // Delete element
    const deleteElement = useCallback(async (elementId: string) => {
        if (!fileId) return;

        try {
            await canvasApi.deleteElement(fileId, elementId);
            setCanvas(prev => prev ? {
                ...prev,
                elements: prev.elements.filter(el => el.id !== elementId),
            } : null);
        } catch (err) {
            console.error('Delete element error:', err);
        }
    }, [fileId]);

    // Load on mount / fileId change
    useEffect(() => {
        loadCanvas();
    }, [loadCanvas]);

    return {
        canvas,
        loading,
        error,
        saveCanvas,
        addElement,
        updateElement,
        deleteElement,
        refreshCanvas: loadCanvas,
    };
}
