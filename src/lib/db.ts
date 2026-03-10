import Database from "@tauri-apps/plugin-sql";

export async function initDb() {
    const db = await Database.load("sqlite:project.db");

    await db.execute(`
       CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL
       ) 
    `);

    return db;
}

export async function getDb() {
    return await Database.load("sqlite:project.db");
}