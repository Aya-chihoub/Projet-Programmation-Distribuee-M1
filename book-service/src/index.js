const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bookstore",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const { rows } = await client.query("SELECT COUNT(*) FROM books");
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO books (title, author, price, stock) VALUES
        ('Clean Code', 'Robert C. Martin', 29.99, 15),
        ('Design Patterns', 'Gang of Four', 39.99, 10),
        ('The Pragmatic Programmer', 'David Thomas', 34.99, 8),
        ('Refactoring', 'Martin Fowler', 44.99, 12),
        ('Domain-Driven Design', 'Eric Evans', 49.99, 5)
      `);
      console.log("Seeded 5 books into database");
    }
  } finally {
    client.release();
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "book-service" });
});

app.get("/api/books", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM books ORDER BY id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const { title, author, price, stock } = req.body;
    if (!title || !author || price == null) {
      return res.status(400).json({ error: "title, author, and price are required" });
    }
    const { rows } = await pool.query(
      "INSERT INTO books (title, author, price, stock) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, author, price, stock || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const { title, author, price, stock } = req.body;
    const { rows } = await pool.query(
      `UPDATE books SET
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock)
      WHERE id = $5 RETURNING *`,
      [title, author, price, stock, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM books WHERE id = $1 RETURNING *", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted", book: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`book-service running on port ${PORT} (PostgreSQL)`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
