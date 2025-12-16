import { Router, Request, Response } from 'express';
import { Canvas } from '../models/Canvas.js';

const router = Router();

// Get canvas by file ID
router.get('/:fileId', async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        let canvas = await Canvas.findOne({ fileId });

        if (!canvas) {
            // Create a new canvas if it doesn't exist
            canvas = await Canvas.create({
                fileId,
                elements: [],
            });
        }

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch canvas' });
    }
});

// Save canvas state
router.put('/:fileId', async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const { elements, viewportTransform, backgroundColor } = req.body;

        const canvas = await Canvas.findOneAndUpdate(
            { fileId },
            {
                elements,
                viewportTransform,
                backgroundColor,
            },
            { new: true, upsert: true }
        );

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save canvas' });
    }
});

// Add element to canvas
router.post('/:fileId/element', async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const element = req.body;

        const canvas = await Canvas.findOneAndUpdate(
            { fileId },
            { $push: { elements: element } },
            { new: true }
        );

        if (!canvas) {
            return res.status(404).json({ error: 'Canvas not found' });
        }

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add element' });
    }
});

// Update element in canvas
router.put('/:fileId/element/:elementId', async (req: Request, res: Response) => {
    try {
        const { fileId, elementId } = req.params;
        const updates = req.body;

        const canvas = await Canvas.findOne({ fileId });

        if (!canvas) {
            return res.status(404).json({ error: 'Canvas not found' });
        }

        const elementIndex = canvas.elements.findIndex(el => el.id === elementId);

        if (elementIndex === -1) {
            return res.status(404).json({ error: 'Element not found' });
        }

        canvas.elements[elementIndex] = { ...canvas.elements[elementIndex], ...updates };
        await canvas.save();

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update element' });
    }
});

// Delete element from canvas
router.delete('/:fileId/element/:elementId', async (req: Request, res: Response) => {
    try {
        const { fileId, elementId } = req.params;

        const canvas = await Canvas.findOneAndUpdate(
            { fileId },
            { $pull: { elements: { id: elementId } } },
            { new: true }
        );

        if (!canvas) {
            return res.status(404).json({ error: 'Canvas not found' });
        }

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete element' });
    }
});

export default router;
