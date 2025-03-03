const express = require("express");
const pool = require("./db");
const redis = require("redis");
require("dotenv").config();

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

// 🔥 Connect to Redis
const redisClient = redis.createClient();
redisClient.connect();

// 📌 Subscribe to Booking Notifications
redisClient.subscribe("notifications", async (message) => {
    const data = JSON.parse(message);
    console.log("📩 New Notification:", data);

    // Save notification in PostgreSQL
    try {
        await pool.query(
            "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
            [data.user_id, data.message]
        );
    } catch (err) {
        console.error("Error saving notification:", err);
    }
});

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

app.listen(8004, () => console.log("Notification Service running on port 8004"));
 