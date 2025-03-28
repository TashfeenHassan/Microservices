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
        }); // Change for remote RabbitMQ
        channel = await connection.createChannel();
        await channel.assertQueue("notifications"); // Declare the queue

        console.log("🐰 RabbitMQ Connected & Queue Initialized");

        // 📌 Subscribe to Booking Notifications
        channel.consume("notifications", async (msg) => {
            const data = JSON.parse(msg.content.toString());
            console.log("📩 New Notification:", data);

            // Save notification in PostgreSQL
            try {
                await pool.query(
                    "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
                    [data.user_id, data.message]
                );
                channel.ack(msg); // Acknowledge the message
            } catch (err) {
                console.error("Error saving notification:", err);
            }
        });
    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
    }
}

// 📌 Run RabbitMQ connection
connectRabbitMQ();

// 📌 Get Notifications for a User
app.get("/notifications/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query("SELECT * FROM notifications WHERE user_id = $1", [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// 🚀 Start Server
app.listen(8004, () => console.log("📩 Notification Service running on port 8004"));
