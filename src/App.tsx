import { useState, useEffect } from "react";
import PDFUpload from "@/components/PDFUpload";
import "./App.css";

import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./components/ui/dialog";

import { useNavigate } from "react-router-dom";
import { remove } from "@tauri-apps/plugin-fs";
import { Trash2 } from "lucide-react";

import { getDb } from "./lib/db";

type Document = {
    id: number;
    name: string;
    path: string;
};

function App() {
    const navigate = useNavigate();
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
            <div className="container mx-auto px-4 py-8">
                <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">My Documents</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload a PDF and open it to add notes per page.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <PDFUpload onSuccess={() => getDocuments().then(setDocuments)} />
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-6">
                        {documents.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <p className="text-sm text-muted-foreground">No documents yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Upload your first PDF to get started.
                                </p>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {documents.map((doc) => (
                                    <li key={doc.id} className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            className="flex-1 justify-start truncate"
                                            onClick={() => navigate(`/display/${doc.id}`)}
                                            title={doc.name}
                                        >
                                            {doc.name}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeleteTarget(doc)}
                                            title="Delete document"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
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
