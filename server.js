const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const User = require("./models/User");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "icct.alphaten@gmail.com", 
        pass: "mbri tzjt nmbw pceq" // Generated via Google App Passwords settings
    }
});


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// IDAGDAG MO ITONG LINYANG ITO DITO:
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.error("❌ MongoDB Error:", err);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/tour", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tour.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/events", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "events.html"));
});

app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "contact.html"));
});


app.get("/dashboard", (req, res) => {
    try {
        const fs = require('fs');
        const publicPath = path.join(__dirname, "public", "dashboard_merged.html");
        const rootPath = path.join(__dirname, "dashboard_merged.html");

        if (fs.existsSync(publicPath)) {
            return res.sendFile(publicPath);
        } else if (fs.existsSync(rootPath)) {
            return res.sendFile(rootPath);
        } else {
            return res.status(404).send("File dashboard_merged.html not found.");
        }
    } catch (err) {
        console.error("Dashboard Route Error:", err);
        return res.status(500).send("Server Error: " + err.message);
    }
});

app.get("/favicon.png", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "favicon.png"));
});

const { exec } = require("child_process");

app.post("/api/update-progress", (req, res) => {
    const { completed, total } = req.body; 
    const inputData = `${completed} ${total}`;

    // Tatawagin ang compiled C++ program natin
    const process = exec(`./progress_service`, (error, stdout, stderr) => {
        if (error) {
            console.error(`C++ Error: ${error.message}`);
            return res.status(500).json({ error: "C++ Microservice failure" });
        }
        const progressPercentage = parseInt(stdout.trim());
        res.json({
            success: true,
            progress: progressPercentage
        });
    });

    process.stdin.write(inputData);
    process.stdin.end();
});

app.post("/api/signup", async (req, res) => {

    try {

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Signup successful"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error during signup"
        });

    }

});

app.post("/api/signup", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            email,
            password: hashedPassword
        });

        // 1. THIS IS YOUR ORIGINAL LINE
        await user.save(); 

        // 2. PASTE THE ENTIRE DISPATCH BLOCK DIRECTLY HERE:
        const mailOptions = {
            from: "icct.alphaten@gmail.com",       // Your sender team email
            to: "vienashie@gmail.com",    // Email where you want to get alerts
            subject: "🚨 Notification: New Applicant Registered!",
            text: `A new user has signed up on the Alpha Ten Portal!\n\nName: ${fullName}\nEmail: ${email}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Notification Email Failed:", error);
            } else {
                console.log("📨 Alert Email Sent Successfully!");
            }
        });

        // 3. THIS IS YOUR ORIGINAL CLOSING LINE
        res.status(201).json({
            success: true,
            message: "Signup successful"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error during signup"
        });
    }
});


app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            token,
            message: "Login successful"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error during login"
        });

    }

});

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.id;

        next();

    } catch (error) {

        res.status(401).json({
            message: "Invalid token"
        });

    }

}

app.get("/api/profile", authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(req.userId)
        .select("-password");

        res.json(user);

    } catch (error) {

        res.status(500).json({
            message: "Failed to load profile"
        });

    }

});

const PORT = process.env.PORT || 3000;

// ISULAT ITO SA PINAKA-ILALIM NG SERVER.JS (BAGO MAG APP.LISTEN):
app.get(".*", (req, res) => {
    // Kung may maghanap ng link na hindi rehistrado, ibalik sila sa Home Page nang ligtas
    res.sendFile(path.join(__dirname, "public", "home.html"));
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});