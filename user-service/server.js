const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib"); // Import RabbitMQ
const pool = require("./db");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
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
        await channel.assertQueue("user_events"); // Declare queue

        console.log("🐰 RabbitMQ Connected & Queue Initialized");
    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
    }
}

// 📌 Run RabbitMQ connection
connectRabbitMQ();

// 📝 Register User
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const result = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        // 🔥 Publish "user_registered" event to RabbitMQ
        channel.sendToQueue("user_events", Buffer.from(JSON.stringify({
            event: "user_registered",
            user: { id: user.id, name: user.name, email: user.email }
        })));

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔑 Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // 🔥 Publish "user_logged_in" event to RabbitMQ
        channel.sendToQueue("user_events", Buffer.from(JSON.stringify({
            event: "user_logged_in",
            user: { id: user.rows[0].id, email: user.rows[0].email }
        })));

        res.json({ token, user: user.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👤 Get User Profile
app.get("/users/:id", async (req, res) => {
    try {
        const user = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.params.id]);
        if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Start Server
app.listen(8001, () => console.log("👤 User Service running on port 8001"));
