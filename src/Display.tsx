import { useParams } from "react-router-dom";
import { getDb } from "./lib/db";
import { convertFileSrc } from "@tauri-apps/api/core";

import { Page, Document, pdfjs } from 'react-pdf';
import { useState, useEffect } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function Display() {
    const { id } = useParams<{ id: string }>();
    const [pdfPath, setPdfPath] = useState<string | null>();
    const [pageNumber, setPageNumber] = useState<number>(1);

    console.log("current id: " + id);

    async function getDocumentPath() {
        if (!id) return;

        const db = await getDb();

        const match =  await db.select("SELECT path FROM documents WHERE id = $1", [id]);

        const path = match.length > 0 ? match[0].path : null;

        if (path) setPdfPath(convertFileSrc(path));
        console.log(path)
    }

    useEffect(() => {
        getDocumentPath();
    }, [id]);

    return (
        <div>
            <Document file={pdfPath}>
                <Page pageNumber={pageNumber}  />
            </Document>
        </div>
    )
}