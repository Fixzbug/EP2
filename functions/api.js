const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware สำหรับ JSON
app.use(express.json());

// MongoDB Atlas connection
const mongoURI = "mongodb+srv://Makerz:H4ck3r-2539@clusterimakerz.u3zat.mongodb.net/Makerz?retryWrites=true&w=majority";

mongoose.connect(mongoURI, { 
    // useNewUrlParser: true, useUnifiedTopology: true
 })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Error:", err));

// ตั้งค่าที่เก็บไฟล์อัปโหลด
const uploadDirectory = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory); // สร้างโฟลเดอร์ถ้ายังไม่มี
}

// ตั้งค่า multer สำหรับการจัดเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory); // เก็บไฟล์ในโฟลเดอร์ "uploads"
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Schema และ Model
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String,
    filePath: String, // เพิ่มฟิลด์สำหรับเก็บ path ของไฟล์
}));

// Route สำหรับอัปโหลดไฟล์และเพิ่มผู้ใช้
app.post("/api/user", upload.single("file"), async (req, res) => {
    const { name, email } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "File upload is required." });
    }

    try {
        const newUser = new User({ 
            name, 
            email, 
            filePath: file.path // บันทึก path ของไฟล์ในฐานข้อมูล
        });
        await newUser.save();
        res.status(201).json({ 
            message: "User and file saved successfully!", 
            user: newUser 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to save user", details: err.message });
    }
});

// Route สำหรับดึงไฟล์อัปโหลด
app.get("/api/files/:filename", (req, res) => {
    const filePath = path.join(uploadDirectory, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// Route สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ message: "Users fetched successfully!", users });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users", details: err.message });
    }
});


// Fallback สำหรับ Method ที่ไม่รองรับ
app.all("*", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed" });
});

const handler = serverless(app);

module.exports.handler = handler;
