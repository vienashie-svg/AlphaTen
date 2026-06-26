const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const User = require("./models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "icct.alphaten@gmail.com",
        pass: "mbri tzjt nmbw pceq"
    }
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));
app.get("/tour", (req, res) => res.sendFile(path.join(__dirname, "public", "tour.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "public", "about.html")));
app.get("/events", (req, res) => res.sendFile(path.join(__dirname, "public", "events.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "public", "contact.html")));
app.get("/programs", (req, res) => res.sendFile(path.join(__dirname, "public", "programs.html")));
app.get("/news", (req, res) => res.sendFile(path.join(__dirname, "public", "news.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard_merged.html")));

app.post("/api/signup", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password)
            return res.status(400).json({ message: "All fields are required" });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ fullName, email, password: hashedPassword });
        await user.save();

        const mailOptions = {
            from: "icct.alphaten@gmail.com",
            to: "vienashie@gmail.com",
            subject: "🚨 New Applicant Registered!",
            text: `Name: ${fullName}\nEmail: ${email}`
        };
        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error("❌ Email Failed:", error);
            else console.log("📨 Alert Email Sent!");
        });

        res.status(201).json({ success: true, message: "Signup successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during signup" });
    }
});

app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;

    // Tiyakin na may email at mensaheng ipinadala mula sa contact page
    if (!email || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const mailOptions = {
        from: "icct.alphaten@gmail.com", // Kapareho ng email sender ninyo sa signup
        to: "vienashie@gmail.com",       // Ang tatanggap ng mensahe mula sa contact page
        subject: "📥 New Contact Message from DecaPortal Visitor",
        text: `Name: ${name || "Anonymous"}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    // Gamitin ang inyong transporter para ipadala ang email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Contact Email Failed:", error);
            return res.status(500).json({ success: false, message: "Mailer engine error" });
        }
        
        console.log("📨 Contact Message Sent!");
        res.status(200).json({ success: true, message: "Message sent successfully" });
    });
});
// ─────────────────────────────────────────────────────────────────


app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ success: true, token, message: "Login successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login" });
    }
});

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}

app.get("/api/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to load profile" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
