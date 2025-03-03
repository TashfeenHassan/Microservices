const express = require("express");
const pool = require("./db");
const redis = require("redis"); // Import Redis
require("dotenv").config();

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const redisClient = redis.createClient();
redisClient.connect();

app.post("/bookings", async (req, res) => {
    const { user_id, event_id } = req.body;
    
    try {
        const result = await pool.query(
            "INSERT INTO bookings (user_id, event_id) VALUES ($1, $2) RETURNING *",
            [user_id, event_id]
        );

        // 🔥 Publish Notification to Redis
        await redisClient.publish("notifications", JSON.stringify({
            user_id,
            message: `Your booking for event ${event_id} is confirmed!`
        }));

        res.status(201).json({ message: "Booking confirmed", booking: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/bookings/:user_id", async (req, res) => {
    const { user_id } = req.params; // Get user_id from the request URL

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




// 🎟 Create Booking API
app.post("/bookings", async (req, res) => {
    const { user_id, event_id } = req.body;
    try {
        // Insert booking into PostgreSQL
        const result = await pool.query(
            "INSERT INTO bookings (user_id, event_id) VALUES ($1, $2) RETURNING *",
            [user_id, event_id]
        );

        // 📨 Publish message to Redis (instead of RabbitMQ)
        await redisClient.publish("notifications", JSON.stringify({
            booking_id: result.rows[0].id,
            user_id,
            event_id,
            status: "CONFIRMED"
        }));

        res.status(201).json({ message: "Booking confirmed", booking: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(8002, () => console.log("Booking Service running on port 8002"));
