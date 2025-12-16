import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
    id: string;
    initialText?: string;
    x: number;
    y: number;
    onUpdate: (text: string) => void;
    onBlur: () => void;
}

export function RichTextEditor({
    id,
    initialText = '',
    x,
    y,
    onUpdate,
    onBlur,
}: RichTextEditorProps) {
    const [text, setText] = useState(initialText);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            const newText = editorRef.current.innerText;
            setText(newText);
            onUpdate(newText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle formatting shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline');
                    break;
            }
        }

        // Handle escape to blur
        if (e.key === 'Escape') {
            editorRef.current?.blur();
        }
    };

    return (
        <div
            className="text-block"
            style={{ left: x, top: y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                ref={editorRef}
                className="text-block-content"
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                style={{
                    direction: 'ltr',
                    textAlign: 'left',
                    unicodeBidi: 'embed',
                    writingMode: 'horizontal-tb'
                }}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                dangerouslySetInnerHTML={{ __html: initialText }}
            />
        </div>
    );
}
