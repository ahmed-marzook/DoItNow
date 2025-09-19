import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "doitnow.db";
const TODO_TABLE = "todos";

let databasePromise: Promise<SQLiteDatabase> | null = null;

type TodoRow = {
  id: number;
  text: string;
  isCompleted: number;
  createdAt: number;
  updatedAt: number;
};

export type OfflineTodo = {
  id: number;
  text: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
};

async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await db.execAsync(
        `
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ${TODO_TABLE} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          isCompleted INTEGER NOT NULL DEFAULT 0,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
      `.trim()
      );
      return db;
    })();
  }

  return databasePromise;
}

function mapRowToTodo(row: TodoRow): OfflineTodo {
  return {
    id: row.id,
    text: row.text,
    isCompleted: row.isCompleted === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function initializeOfflineDatabase(): Promise<void> {
  await getDatabase();
}

export async function getOfflineTodos(): Promise<OfflineTodo[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TodoRow>(
    `SELECT id, text, isCompleted, createdAt, updatedAt FROM ${TODO_TABLE} ORDER BY createdAt DESC;`
  );

  return rows.map(mapRowToTodo);
}

export async function addOfflineTodo(text: string): Promise<OfflineTodo> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Todo text cannot be empty.");
  }

  const db = await getDatabase();
  const timestamp = Date.now();

  const result = await db.runAsync(
    `INSERT INTO ${TODO_TABLE} (text, isCompleted, createdAt, updatedAt) VALUES (?, 0, ?, ?);`,
    trimmedText,
    timestamp,
    timestamp
  );

  const insertedId = result.lastInsertRowId;

  if (insertedId === null) {
    throw new Error("Failed to insert todo.");
  }

  return {
    id: insertedId,
    text: trimmedText,
    isCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export type UpdateOfflineTodoOptions = {
  text?: string;
  isCompleted?: boolean;
};

export async function updateOfflineTodo(
  id: number,
  updates: UpdateOfflineTodoOptions
): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const parameters: (string | number)[] = [];

  if (typeof updates.text === "string") {
    const trimmedText = updates.text.trim();

    if (!trimmedText) {
      throw new Error("Todo text cannot be empty.");
    }

    setClauses.push("text = ?");
    parameters.push(trimmedText);
  }

  if (typeof updates.isCompleted === "boolean") {
    setClauses.push("isCompleted = ?");
    parameters.push(updates.isCompleted ? 1 : 0);
  }

  if (setClauses.length === 0) {
    return;
  }

  setClauses.push("updatedAt = ?");
  parameters.push(Date.now());
  parameters.push(id);

  await db.runAsync(
    `UPDATE ${TODO_TABLE} SET ${setClauses.join(", ")} WHERE id = ?;`,
    ...parameters
  );
}

export async function deleteOfflineTodo(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${TODO_TABLE} WHERE id = ?;`, id);
}

export async function clearOfflineTodos(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${TODO_TABLE};`);
}
