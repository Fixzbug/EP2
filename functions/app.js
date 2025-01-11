const express = require("express");
const mongoose = require("mongoose");
const ServerlessHttp = require("serverless-http");

const app = express();

// MongoDB Atlas connection
const mongoURI = "mongodb+srv://Makerz:H4ck3r-2539@clusterimakerz.u3zat.mongodb.net/Makerz?retryWrites=true&w=majority&appName=ClusterIMakerz";

mongoose.connect(mongoURI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected!")).catch((err) => console.error("MongoDB Connection Error: ", err));


const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
});

const User = mongoose.model("User", UserSchema);

// Example route for saving a user
app.post("/api/user", async (req, res) => {
    const { name, email } = req.body;

    try {
        const newUser = new User({ name, email });
        await newUser.save();
        res.status(201).json({ message: "User saved successfully!", user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Failed to save user", details: err.message });
    }
});

app.get('/api', (req, res) => {
    return res.json({
        messages: "hello world! GGEZ"
    });
});

const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
    const result = await handler(event, context);
    return result;
};
