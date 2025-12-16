import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { ToolType } from './Toolbar';
import { CanvasElement } from '../../services/api';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface InfiniteCanvasProps {
    fileId: string | null;
    activeTool: ToolType;
    elements: CanvasElement[];
    onElementsChange: (elements: CanvasElement[]) => void;
    onSelectionChange: (hasSelection: boolean) => void;
}

export function InfiniteCanvas({
    fileId,
    activeTool,
    elements,
    onElementsChange,
    onSelectionChange,
}: InfiniteCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(100);
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const currentShapeRef = useRef<fabric.Object | null>(null);

    // Initialize Fabric canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: '#0a0a0f',
            selection: true,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;

        // Handle resize
        const handleResize = () => {
            if (!container) return;
            canvas.setDimensions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
            canvas.renderAll();
        };

        // Initial resize after mount to ensure correct dimensions
        requestAnimationFrame(handleResize);

        window.addEventListener('resize', handleResize);

        // Use ResizeObserver for more reliable resize detection
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        // Pan with mouse wheel + alt or middle click
        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let newZoom = canvas.getZoom() * (0.999 ** delta);

            if (newZoom > 5) newZoom = 5;
            if (newZoom < 0.1) newZoom = 0.1;

            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
            setZoom(Math.round(newZoom * 100));
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Selection events
        canvas.on('selection:created', () => onSelectionChange(true));
        canvas.on('selection:updated', () => onSelectionChange(true));
        canvas.on('selection:cleared', () => onSelectionChange(false));

        // Object modification
        canvas.on('object:modified', () => {
            saveElements();
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            canvas.dispose();
        };
    }, []);

    // Load elements when fileId changes
    useEffect(() => {
        if (!fabricRef.current || !fileId) return;

        const canvas = fabricRef.current;
        canvas.clear();
        canvas.backgroundColor = '#0a0a0f';

        elements.forEach(el => {
            const obj = elementToFabricObject(el);
            if (obj) {
                canvas.add(obj);
            }
        });

        canvas.renderAll();
    }, [fileId, elements]);

    // Handle tool changes
    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;

        // Reset drawing mode
        canvas.isDrawingMode = activeTool === 'freehand';
        canvas.selection = activeTool === 'select';

        if (activeTool === 'freehand') {
            canvas.freeDrawingBrush.color = '#6366f1';
            canvas.freeDrawingBrush.width = 3;
        }

        // Set cursor based on tool
        const cursors: Record<ToolType, string> = {
            select: 'default',
            rectangle: 'crosshair',
            circle: 'crosshair',
            line: 'crosshair',
            freehand: 'crosshair',
            text: 'text',
            code: 'crosshair',
            image: 'crosshair',
        };
        canvas.defaultCursor = cursors[activeTool];
    }, [activeTool]);

    // Drawing handlers
    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;

        const handleMouseDown = (opt: fabric.IEvent) => {
            if (activeTool === 'select' || activeTool === 'freehand') return;

            const pointer = canvas.getPointer(opt.e);
            isDrawingRef.current = true;
            startPointRef.current = { x: pointer.x, y: pointer.y };

            let shape: fabric.Object | null = null;

            switch (activeTool) {
                case 'rectangle':
                    shape = new fabric.Rect({
                        left: pointer.x,
                        top: pointer.y,
                        width: 0,
                        height: 0,
                        fill: 'transparent',
                        stroke: '#6366f1',
                        strokeWidth: 2,
                        rx: 8,
                        ry: 8,
                    });
                    break;
                case 'circle':
                    shape = new fabric.Circle({
                        left: pointer.x,
                        top: pointer.y,
                        radius: 0,
                        fill: 'transparent',
                        stroke: '#6366f1',
                        strokeWidth: 2,
                    });
                    break;
                case 'line':
                    shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                        stroke: '#6366f1',
                        strokeWidth: 2,
                    });
                    break;
            }

            if (shape) {
                canvas.add(shape);
                currentShapeRef.current = shape;
            }
        };

        const handleMouseMove = (opt: fabric.IEvent) => {
            if (!isDrawingRef.current || !startPointRef.current || !currentShapeRef.current) return;

            const pointer = canvas.getPointer(opt.e);
            const shape = currentShapeRef.current;
            const start = startPointRef.current;

            switch (activeTool) {
                case 'rectangle':
                    const rect = shape as fabric.Rect;
                    if (pointer.x < start.x) {
                        rect.set({ left: pointer.x });
                    }
                    if (pointer.y < start.y) {
                        rect.set({ top: pointer.y });
                    }
                    rect.set({
                        width: Math.abs(pointer.x - start.x),
                        height: Math.abs(pointer.y - start.y),
                    });
                    break;
                case 'circle':
                    const circle = shape as fabric.Circle;
                    const radius = Math.sqrt(
                        Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2)
                    ) / 2;
                    circle.set({ radius });
                    break;
                case 'line':
                    const line = shape as fabric.Line;
                    line.set({ x2: pointer.x, y2: pointer.y });
                    break;
            }

            canvas.renderAll();
        };

        const handleMouseUp = () => {
            if (!isDrawingRef.current) return;

            isDrawingRef.current = false;
            startPointRef.current = null;
            currentShapeRef.current = null;

            saveElements();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [activeTool]);

    // Freehand drawing complete
    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;

        const handlePathCreated = () => {
            saveElements();
        };

        canvas.on('path:created', handlePathCreated);

        return () => {
            canvas.off('path:created', handlePathCreated);
        };
    }, []);

    const saveElements = useCallback(() => {
        if (!fabricRef.current) return;

        const canvas = fabricRef.current;
        const objects = canvas.getObjects();

        const newElements: CanvasElement[] = objects.map((obj, index) => {
            return fabricObjectToElement(obj, `el-${Date.now()}-${index}`);
        });

        onElementsChange(newElements);
    }, [onElementsChange]);

    const handleZoomIn = () => {
        if (!fabricRef.current) return;
        const newZoom = Math.min(fabricRef.current.getZoom() * 1.2, 5);
        fabricRef.current.setZoom(newZoom);
        setZoom(Math.round(newZoom * 100));
    };

    const handleZoomOut = () => {
        if (!fabricRef.current) return;
        const newZoom = Math.max(fabricRef.current.getZoom() / 1.2, 0.1);
        fabricRef.current.setZoom(newZoom);
        setZoom(Math.round(newZoom * 100));
    };

    const handleZoomReset = () => {
        if (!fabricRef.current) return;
        fabricRef.current.setZoom(1);
        fabricRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(100);
    };

    const deleteSelected = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const activeObjects = canvas.getActiveObjects();

        activeObjects.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
        saveElements();
    }, [saveElements]);

    // Expose delete function
    useEffect(() => {
        (window as any).deleteSelectedCanvasObjects = deleteSelected;
        return () => {
            delete (window as any).deleteSelectedCanvasObjects;
        };
    }, [deleteSelected]);

    return (
        <div ref={containerRef} className="canvas-container">
            <div className="canvas-grid" />
            <canvas ref={canvasRef} />

            {/* Zoom Controls */}
            <div className="zoom-controls">
                <button className="zoom-btn" onClick={handleZoomOut} data-tooltip="Zoom Out">
                    <ZoomOut size={18} />
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button className="zoom-btn" onClick={handleZoomIn} data-tooltip="Zoom In">
                    <ZoomIn size={18} />
                </button>
                <button className="zoom-btn" onClick={handleZoomReset} data-tooltip="Reset Zoom">
                    <Maximize2 size={18} />
                </button>
            </div>
        </div>
    );
}

// Helper: Convert CanvasElement to Fabric object
function elementToFabricObject(el: CanvasElement): fabric.Object | null {
    const baseOptions = {
        left: el.x,
        top: el.y,
        fill: el.fill || 'transparent',
        stroke: el.stroke || '#6366f1',
        strokeWidth: el.strokeWidth || 2,
        angle: el.rotation || 0,
        scaleX: el.scaleX || 1,
        scaleY: el.scaleY || 1,
    };

    switch (el.type) {
        case 'rectangle':
            return new fabric.Rect({
                ...baseOptions,
                width: el.width || 100,
                height: el.height || 100,
                rx: 8,
                ry: 8,
            });
        case 'circle':
            return new fabric.Circle({
                ...baseOptions,
                radius: el.radius || 50,
            });
        case 'line':
            if (el.points && el.points.length >= 4) {
                return new fabric.Line(el.points.slice(0, 4), baseOptions);
            }
            break;
        case 'freehand':
            if (el.points) {
                const pathStr = `M ${el.points.join(' L ')}`;
                return new fabric.Path(pathStr, baseOptions);
            }
            break;
        case 'text':
            return new fabric.IText(el.text || 'Text', {
                ...baseOptions,
                fontSize: el.fontSize || 16,
                fontFamily: el.fontFamily || 'Inter',
                fill: el.fill || '#f8fafc',
            });
    }
    return null;
}

// Helper: Convert Fabric object to CanvasElement
function fabricObjectToElement(obj: fabric.Object, id: string): CanvasElement {
    const base: CanvasElement = {
        id,
        type: 'rectangle',
        x: obj.left || 0,
        y: obj.top || 0,
        fill: obj.fill as string,
        stroke: obj.stroke as string,
        strokeWidth: obj.strokeWidth,
        rotation: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
    };

    if (obj.type === 'rect') {
        const rect = obj as fabric.Rect;
        return { ...base, type: 'rectangle', width: rect.width, height: rect.height };
    }
    if (obj.type === 'circle') {
        const circle = obj as fabric.Circle;
        return { ...base, type: 'circle', radius: circle.radius };
    }
    if (obj.type === 'line') {
        const line = obj as fabric.Line;
        return { ...base, type: 'line', points: [line.x1!, line.y1!, line.x2!, line.y2!] };
    }
    if (obj.type === 'path') {
        return { ...base, type: 'freehand' };
    }
    if (obj.type === 'i-text' || obj.type === 'text') {
        const text = obj as fabric.IText;
        return {
            ...base,
            type: 'text',
            text: text.text,
            fontSize: text.fontSize,
            fontFamily: text.fontFamily,
        };
    }

    return base;
}
