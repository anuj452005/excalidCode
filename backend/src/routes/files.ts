import { Router, Request, Response } from 'express';
import { File } from '../models/File.js';
import { Canvas } from '../models/Canvas.js';
import { v4 as uuidv4 } from 'crypto';

const router = Router();

// Get all files and folders (tree structure)
router.get('/', async (req: Request, res: Response) => {
    try {
        const files = await File.find().sort({ type: -1, name: 1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Get files by parent ID
router.get('/parent/:parentId', async (req: Request, res: Response) => {
    try {
        const { parentId } = req.params;
        const files = await File.find({
            parentId: parentId === 'null' ? null : parentId
        }).sort({ type: -1, name: 1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Create a new file or folder
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, type, parentId } = req.body;

        const file = new File({
            name,
            type,
            parentId: parentId || null,
            canvasId: type === 'file' ? crypto.randomUUID() : undefined,
        });

        await file.save();

        // If it's a file, create an empty canvas for it
        if (type === 'file' && file.canvasId) {
            await Canvas.create({
                fileId: file.canvasId,
                elements: [],
            });
        }

        res.status(201).json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create file' });
    }
});

// Update file/folder name
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const file = await File.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// Delete file/folder (and children if folder)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = await File.findById(id);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // If it's a folder, recursively delete children
        if (file.type === 'folder') {
            await deleteChildrenRecursive(id);
        }

        // Delete associated canvas if it's a file
        if (file.type === 'file' && file.canvasId) {
            await Canvas.deleteOne({ fileId: file.canvasId });
        }

        await File.findByIdAndDelete(id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Helper function to delete children recursively
async function deleteChildrenRecursive(parentId: string) {
    const children = await File.find({ parentId });

    for (const child of children) {
        if (child.type === 'folder') {
            await deleteChildrenRecursive(child._id.toString());
        }
        if (child.type === 'file' && child.canvasId) {
            await Canvas.deleteOne({ fileId: child.canvasId });
        }
        await File.findByIdAndDelete(child._id);
    }
}

export default router;
