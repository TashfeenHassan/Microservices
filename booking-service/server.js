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
        connection = await amqp.connect("amqp://localhost"); // Change this if using a remote RabbitMQ server
        channel = await connection.createChannel();
        await channel.assertQueue("notifications"); // Declare the queue

        console.log("🐰 RabbitMQ Connected & Queue Initialized");
    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
    }
}

// 📌 Run RabbitMQ connection
connectRabbitMQ();

// 🎟 Create Booking API
app.post("/bookings", async (req, res) => {
    const { user_id, event_id } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO bookings (user_id, event_id) VALUES ($1, $2) RETURNING *",
            [user_id, event_id]
        );

        // 📨 Publish notification to RabbitMQ queue
        const notification = {
            booking_id: result.rows[0].id,
            user_id,
            event_id,
            status: "CONFIRMED",
        };

        channel.sendToQueue("notifications", Buffer.from(JSON.stringify(notification)));
        console.log("📨 Sent Notification:", notification);

        res.status(201).json({ message: "Booking confirmed", booking: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📜 Get Bookings API
app.get("/bookings/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM bookings WHERE user_id = $1",
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user" });
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// 🚀 Start Server
app.listen(8002, () => console.log("🎟 Booking Service running on port 8002"));

