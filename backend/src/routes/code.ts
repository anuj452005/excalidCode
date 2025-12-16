import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Language mappings for Piston API
const languageMap: Record<string, { language: string; version: string }> = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    cpp: { language: 'cpp', version: '10.2.0' },
    c: { language: 'c', version: '10.2.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
    go: { language: 'go', version: '1.16.2' },
    rust: { language: 'rust', version: '1.68.2' },
    ruby: { language: 'ruby', version: '3.0.1' },
    php: { language: 'php', version: '8.2.3' },
};

// Get available languages
router.get('/languages', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${PISTON_API_URL}/runtimes`);
        res.json(response.data);
    } catch (error) {
        res.json(Object.keys(languageMap));
    }
});

// Execute code
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const { code, language, stdin } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language are required' });
        }

        const langConfig = languageMap[language.toLowerCase()];

        if (!langConfig) {
            return res.status(400).json({
                error: `Unsupported language: ${language}`,
                supportedLanguages: Object.keys(languageMap)
            });
        }

        const response = await axios.post(`${PISTON_API_URL}/execute`, {
            language: langConfig.language,
            version: langConfig.version,
            files: [{ content: code }],
            stdin: stdin || '',
        });

        const result = response.data;

        res.json({
            output: result.run?.output || '',
            stderr: result.run?.stderr || '',
            exitCode: result.run?.code || 0,
            executionTime: result.run?.time || '0',
        });
    } catch (error: any) {
        console.error('Code execution error:', error.message);
        res.status(500).json({
            error: 'Failed to execute code',
            details: error.response?.data || error.message
        });
    }
});

export default router;
