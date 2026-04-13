import { useState, useEffect } from "react";
import PDFUpload from "@/components/PDFUpload";
import "./App.css";

import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./components/ui/dialog";

import { useNavigate } from "react-router-dom";
import { remove } from "@tauri-apps/plugin-fs";
import { FileText, Trash2, Sun, Moon } from "lucide-react";

import { getDb } from "./lib/db";
import { useTheme } from "./lib/theme";

type Document = {
    id: number;
    name: string;
    path: string;
};

function App() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function getDocuments() {
        const db = await getDb();
        return await db.select<Document[]>("SELECT * FROM documents");
    }

    useEffect(() => {
        getDocuments().then(setDocuments);
    }, []);

    async function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const db = await getDb();
            await db.execute("DELETE FROM notes WHERE document_id = $1", [deleteTarget.id]);
            await db.execute("DELETE FROM documents WHERE id = $1", [deleteTarget.id]);
            await remove(deleteTarget.path);
            setDeleteTarget(null);
            getDocuments().then(setDocuments);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Nav */}
            <nav className="border-b bg-card shadow-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-xl font-semibold tracking-tight text-primary">Clarify</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggle}>
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <PDFUpload onSuccess={() => getDocuments().then(setDocuments)} />
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="container mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
                    <p className="text-muted-foreground mt-1">
                        Upload a PDF and take notes on each page.
                    </p>
                </div>

                {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-card p-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                            <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">No documents yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload your first PDF to get started.
                        </p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                            <li key={doc.id}>
                                <div
                                    className="group relative flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150"
                                    onClick={() => navigate(`/display/${doc.id}`)}
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="flex-1 font-medium truncate" title={doc.name}>
                                        {doc.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}
                                        title="Delete document"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete document?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete "{deleteTarget?.name}" and all its notes. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

export default App;
