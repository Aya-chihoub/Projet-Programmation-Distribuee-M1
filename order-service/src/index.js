const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "postgres", 
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bookstore",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Improved initDB with internal error handling
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Orders table ensured in database");
  } finally {
    client.release();
  }
}

// Health check for Kubernetes Liveness/Readiness probes
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

// GET all orders
app.get("/api/orders", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new order
app.post("/api/orders", async (req, res) => {
  const { book_id, customer_name, quantity } = req.body;
  
  try {
    // Call Aya's book-service using K8s internal DNS
    const bookResponse = await axios.get(`http://book-service:3000/api/books/${book_id}`);
    
    if (bookResponse.data) {
      const { rows } = await pool.query(
        "INSERT INTO orders (book_id, customer_name, quantity) VALUES ($1, $2, $3) RETURNING *",
        [book_id, customer_name, quantity || 1]
      );
      res.status(201).json(rows[0]);
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      res.status(404).json({ error: "Cannot order: Book does not exist" });
    } else {
      console.error("Communication error:", err.message);
      res.status(500).json({ error: "Communication error with book-service or database" });
    }
  }
});

const PORT = 3001;

// NEW STARTUP LOGIC: Retry connection until Database is ready
async function startServer() {
  let connected = false;
  let attempts = 0;

  while (!connected) {
    try {
      attempts++;
      console.log(`Connection attempt ${attempts} to Database...`);
      await initDB();
      connected = true;
      app.listen(PORT, () => {
        console.log(` Order-service is live on port ${PORT}`);
      });
    } catch (err) {
      console.error(`❌ DB not ready (Attempt ${attempts}): ${err.message}`);
      console.log("Retrying in 5 seconds...");
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

startServer();