import { useParams, useNavigate } from "react-router-dom";
import { getDb } from "./lib/db";
import { readFile } from "@tauri-apps/plugin-fs";

import { Page, Document, pdfjs } from 'react-pdf';
import { useState, useReducer, useEffect, useMemo, useRef } from 'react';

import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { ChevronLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "./lib/theme";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function Display() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [docName, setDocName] = useState("");
    const [state, dispatch] = useReducer(handleNavigation, { page: 1, numPages: 0 });
    const [note, setNote] = useState("");
    const [pdfWidth, setPdfWidth] = useState(0);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = pdfContainerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => setPdfWidth(entry.contentRect.width));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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
        const match: any = await db.select("SELECT name, path FROM documents WHERE id = $1", [id]);

        if (match.length > 0) {
            setDocName(match[0].name);
            const bytes = await readFile(match[0].path);
            setPdfData(bytes);
        }
    }

    async function loadNote(page: number) {
        if (!id) return;
        const db = await getDb();
        const result: any[] = await db.select(
            "SELECT content FROM notes WHERE document_id = $1 AND page = $2",
            [Number(id), page]
        );
        setNote(result.length > 0 ? result[0].content : "");
    }

    function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const content = e.target.value;
        setNote(content);
        if (!id) return;
        getDb().then(db =>
            db.execute(
                `INSERT INTO notes (document_id, page, content) VALUES ($1, $2, $3)
                 ON CONFLICT(document_id, page) DO UPDATE SET content = excluded.content`,
                [Number(id), state.page, content]
            )
        );
    }

    useEffect(() => {
        getDocumentPath();
        dispatch({ type: "reset" });
    }, [id]);

    useEffect(() => {
        loadNote(state.page);
    }, [id, state.page]);

    const file = useMemo(() => {
        if (!pdfData) return null;
        return { data: new Uint8Array(pdfData) };
    }, [pdfData]);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Nav */}
            <nav className="border-b bg-card shadow-sm shrink-0">
                <div className="container mx-auto px-6 py-4 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Documents</p>
                        <h1 className="font-semibold truncate leading-tight">
                            {docName || "Loading…"}
                        </h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggle}>
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
            </nav>

            {/* Content */}
            <div className="flex-1 container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 h-[calc(100vh-8rem)]">
                    {/* PDF panel */}
                    <section className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col min-h-0">
                        <div ref={pdfContainerRef} className="flex-1 min-h-0 overflow-auto rounded-xl bg-muted/30 p-4">
                            <Document
                                file={file}
                                onLoadSuccess={({ numPages }) =>
                                    dispatch({ type: "setNumPages", payload: numPages })
                                }
                            >
                                <Page
                                    pageNumber={state.page}
                                    width={pdfWidth > 0 ? pdfWidth : undefined}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Page {state.page} of {state.numPages || "—"}
                            </span>
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
                    <section className="rounded-2xl border bg-card shadow-sm p-4 flex flex-col min-h-0">
                        <h2 className="text-sm font-medium text-muted-foreground mb-3">
                            Notes — Page {state.page}
                        </h2>
                        <Textarea
                            className="flex-1 min-h-0 w-full resize-none whitespace-pre-wrap break-words leading-6"
                            placeholder="Write your notes for this page…"
                            value={note}
                            onChange={handleNoteChange}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}
