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
        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
                {/* PDF panel */}
                <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20 p-3">
                    <Document
                    file={file}
                    onLoadSuccess={({ numPages }) =>
                        dispatch({ type: "setNumPages", payload: numPages })
                    }
                    >
                    <Page
                        pageNumber={state.page}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                    </Document>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                    Page {state.page} of {state.numPages || "—"}
                    </div>
                    <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => dispatch({ type: "left" })}
                        disabled={state.page <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => dispatch({ type: "right" })}
                        disabled={state.page >= state.numPages}
                    >
                        Next
                    </Button>
                    </div>
                </div>
                </section>

                {/* Notes panel */}
                <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col min-h-0">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Notes</h2>
                <Textarea
                    className="flex-1 min-h-0 w-full resize-none whitespace-pre-wrap break-words leading-6"
                    placeholder="Write your notes for this page..."
                />
                </section>
            </div>
            </div>
    )
}