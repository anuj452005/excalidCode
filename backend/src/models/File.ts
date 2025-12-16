import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    canvasId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['file', 'folder'], required: true },
        parentId: { type: String, default: null },
        canvasId: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries
FileSchema.index({ parentId: 1 });
FileSchema.index({ type: 1 });

export const File = mongoose.model<IFile>('File', FileSchema);
