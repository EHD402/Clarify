import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import PDFUpload from "@/components/PDFUpload";
import "./App.css";

import { Button } from "./components/ui/button";

import { useNavigate } from "react-router-dom";

import { getDb } from "./lib/db";

type Document = {
    id: number;
    name: string;
    path: string;
};

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  const navigate = useNavigate();

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function getDocuments() {
    const db = await getDb();
    return await db.select<{ id: number; name: string; path: string }[]>(
        "SELECT * FROM documents"
    );
}
    const [documents, setDocuments] = useState<Document[]>([]);

    useEffect(() => {
        getDocuments().then(setDocuments);
    }, []);

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
              <PDFUpload />
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
                  <li key={doc.id}>
                    <Button
                      variant="outline"
                      className="w-full justify-start truncate"
                      onClick={() => navigate(`/display/${doc.id}`)}
                      title={doc.name}
                    >
                      {doc.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
