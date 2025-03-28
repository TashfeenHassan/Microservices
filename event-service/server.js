const express = require("express");
const pool = require("./db");
const amqp = require("amqplib"); // Import RabbitMQ
require("dotenv").config();

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

let channel, connection;

// 🎯 Connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        amqp.connect('amqp://rabbitmq', function(error, connection) {
            if (error) {
                console.error('RabbitMQ Connection Error:', error);
                return;
            }
            console.log('Connected to RabbitMQ');
        }); // Change if using a remote RabbitMQ server
        channel = await connection.createChannel();
        await channel.assertQueue("events"); // Declare the queue

        console.log("🐰 RabbitMQ Connected & Queue Initialized");
    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
    }
}

// 📌 Run RabbitMQ connection
connectRabbitMQ();

// 📌 Get All Events
app.get("/events", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM events");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 Get Event by ID
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

// 📌 Create an Event
app.post("/events", async (req, res) => {
    const { name, date, location } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO events (name, date, location) VALUES ($1, $2, $3) RETURNING *",
            [name, date, location]
        );

        const event = result.rows[0];

        // 📨 Publish event notification to RabbitMQ
        channel.sendToQueue("events", Buffer.from(JSON.stringify({ 
            event_id: event.id, 
            name, 
            date, 
            location, 
            action: "CREATED" 
        })));

        console.log("📨 Event Created & Sent to RabbitMQ:", event);

        res.status(201).json(event);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 Update an Event
app.put("/events/:id", async (req, res) => {
    const { id } = req.params;
    const { name, date, location } = req.body;

    try {
        const eventId = parseInt(id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const result = await pool.query(
            "UPDATE events SET name = $1, date = $2, location = $3 WHERE id = $4 RETURNING *",
            [name, date, location, eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        const updatedEvent = result.rows[0];

        // 📨 Publish event update notification to RabbitMQ
        channel.sendToQueue("events", Buffer.from(JSON.stringify({
            event_id: updatedEvent.id,
            name,
            date,
            location,
            action: "UPDATED"
        })));

        console.log("📨 Event Updated & Sent to RabbitMQ:", updatedEvent);

        res.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 🚀 Start Server
app.listen(8003, () => console.log("🎟 Event Service running on port 8003"));

