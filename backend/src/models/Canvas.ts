import mongoose, { Schema, Document } from 'mongoose';

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

export interface ICanvas extends Document {
    fileId: string;
    elements: CanvasElement[];
    viewportTransform: number[];
    backgroundColor: string;
    createdAt: Date;
    updatedAt: Date;
}

const CanvasSchema = new Schema<ICanvas>(
    {
        fileId: { type: String, required: true, unique: true },
        elements: { type: [Schema.Types.Mixed], default: [] },
        viewportTransform: { type: [Number], default: [1, 0, 0, 1, 0, 0] },
        backgroundColor: { type: String, default: '#1a1a2e' },
    },
    { timestamps: true }
);

CanvasSchema.index({ fileId: 1 });

export const Canvas = mongoose.model<ICanvas>('Canvas', CanvasSchema);
