import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { mkdir, copyFile } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import { getDb } from "@/lib/db";

export default function PDFUpload({ onSuccess }: { onSuccess?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filePath, setFilePath] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        if (!next) {
            setFilePath(null);
            setName("");
            setError(null);
        }
        setIsOpen(next);
    }

    async function handleChooseFile() {
        const selected = await open({
            multiple: false,
            filters: [{ name: "PDF", extensions: ["pdf"] }]
        });

        if (selected) setFilePath(selected);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!filePath) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const appDataPath = await appLocalDataDir();
            const pdfDir = await join(appDataPath, "pdf");
            await mkdir(pdfDir, { recursive: true });

            const fileName = filePath.split(/[\\/]/).pop()!;
            const destPath = await join(pdfDir, fileName);
            await copyFile(filePath, destPath);

            const db = await getDb();
            await db.execute(
                "INSERT INTO documents (name, path) VALUES ($1, $2)",
                [name, destPath]
            );

            setIsOpen(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload PDF. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const fileName = filePath ? filePath.split(/[\\/]/).pop() : null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Add new PDF</Button>
            </DialogTrigger>

            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add new PDF</DialogTitle>
                        <DialogDescription>
                            Choose a PDF file and give it a name.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="title">Name</Label>
                            <Input
                                id="title"
                                name="title"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter document name"
                                required
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="file">PDF</Label>
                            <Button type="button" variant="outline" onClick={handleChooseFile}>
                                Choose PDF
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {fileName ?? "No file selected"}
                            </span>
                        </Field>
                    </FieldGroup>

                    {error && (
                        <p className="text-sm text-destructive mt-3">{error}</p>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={!filePath || !name || isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add PDF"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
