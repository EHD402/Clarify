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
    <main>
      <header>
        <PDFUpload />
        <ul>
            {documents.map((doc) => (
                <li key={doc.id}>
                    <Button variant="outline" onClick={() => navigate(`/display/${doc.id}`)}>{doc.name}</Button>
                </li>
            ))}
        </ul>
      </header>
    </main>
  );
}

export default App;
