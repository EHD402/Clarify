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

export default function PDFUpload() {
    const [filePath, setFilePath] = useState<string | null>(null);
    const [name, setName] = useState("");

    async function handleChooseFile() {
        const selected = await open({
            multiple: false,
            filters: [{ name: "PDF", extensions: ["pdf"] }]
        })

        if (selected) setFilePath(selected);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!filePath) return;

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
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Add new PDF</Button>
            </DialogTrigger>

            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            Add new PDF
                        </DialogTitle>
                        <DialogDescription>
                            Provide the information for logging in
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
                                placeholder="Enter new document name"
                                required
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="file">PDF</Label>
                            <Button type="button" variant="outline" onClick={handleChooseFile}>Choose PDF</Button>
                            <span>{filePath ?? "No file selected"}</span>
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={!filePath || !name}>Add PDF</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}