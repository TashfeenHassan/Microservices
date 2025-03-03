const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

// 📌 Get All Events
app.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events");
  res.json(result.rows);
});

// 📌 Create an Event
app.post("/events", async (req, res) => {
  const { name, date, location } = req.body;
  const result = await pool.query(
    "INSERT INTO events (name, date, location) VALUES ($1, $2, $3) RETURNING *",
    [name, date, location]
  );
  res.status(201).json(result.rows[0]);
});
app.get("/events/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
app.put("/events/:id", async (req, res) => {
    const { id } = req.params;
    const { name, date, location } = req.body;

    try {
        // Ensure ID is an integer
        const eventId = parseInt(id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Update event
        const result = await pool.query(
            "UPDATE events SET name = $1, date = $2, location = $3 WHERE id = $4 RETURNING *",
            [name, date, location, eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Server error" });
    }
});



app.listen(8003, () => console.log("Event Service running on port 8003"));
