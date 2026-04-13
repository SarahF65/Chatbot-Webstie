import { pool } from "./db.js";

export async function saveSession(sessionId, data) {
  await pool.query(
    `
    INSERT INTO sessions (id, data)
    VALUES ($1, $2)
    ON CONFLICT (id)
    DO UPDATE SET data = EXCLUDED.data
    `,
    [sessionId, data]
  );
}