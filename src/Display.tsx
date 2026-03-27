import { useParams } from "react-router-dom";
import { getDb } from "./lib/db";
import { readFile } from "@tauri-apps/plugin-fs";

import { Page, Document, pdfjs } from 'react-pdf';
import { useState, useReducer, useEffect, useMemo } from 'react';

import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function Display() {
    const { id } = useParams<{ id: string }>();
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [state, dispatch] = useReducer(handleNavigation, { page: 1, numPages: 0 });

    type State = { page: number; numPages: number };
    type Action =
    | { type: "left" }
    | { type: "right" }
    | { type: "setNumPages"; payload: number }
    | { type: "reset" };

    function handleNavigation(state: State, action: Action): State {
    switch (action.type) {
        case "left":
        return { ...state, page: Math.max(1, state.page - 1) };
        case "right":
        return {
            ...state,
            page: Math.min(state.numPages || state.page, state.page + 1),
        };
        case "setNumPages":
        return {
            ...state,
            numPages: action.payload,
            page: Math.min(state.page, Math.max(1, action.payload)),
        };
        case "reset":
        return { page: 1, numPages: 0 };
        default:
        return state;
    }
    }

    async function getDocumentPath() {
        if (!id) return;

        const db = await getDb();

        const match: any =  await db.select("SELECT path FROM documents WHERE id = $1", [id]);

        const path = match.length > 0 ? match[0].path : null;

        if (path) {
            const bytes = await readFile(path);
            setPdfData(bytes);
        }
    }

    useEffect(() => {
        getDocumentPath();
    }, [id]);

    const file = useMemo(() => {
        if (!pdfData) return null;
        return { data: new Uint8Array(pdfData) };
    }, [pdfData]);


    return (
        <div className="container mx-auto flex">
            <div className="flex-1">
                <Document 
                    file={ file }
                    onLoadSuccess={({ numPages }) =>
                        dispatch({ type: "setNumPages", payload: numPages })
                    }
                >
                    <Page pageNumber={state.page}  
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
                <Button onClick={() => dispatch({ type: "left" })} disabled={state.page <= 1}>Left</Button>
                <Button onClick={() => dispatch({ type: "right" })} disabled={state.page >= state.numPages}>Right</Button>
            </div>
            <div className="flex-1">
                <Textarea 
                    className="w-full h-full resize-none"
                    placeholder="No text written yet..." 
                />
            </div>
        </div>
    )
}