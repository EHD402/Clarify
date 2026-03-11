import { Page, Document, pdfjs } from 'react-pdf';
import { useState } from 'react';
import { useParams } from "react-router-dom";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PDFDisplay() {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);

    const { id } = useParams();

    async function load() {
        const documentId = Number(id);
        if (!documentId) return;

        
    }

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    return (
        <Document file={""} onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} />
        </Document>
    )
}