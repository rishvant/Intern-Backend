import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import bodyParser from "body-parser";
import User from "./models/user.js";
import cors from "cors";
import jwt from "jsonwebtoken";

dotenv.config({
    path: "./env"
});

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

connectDB();

const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        console.log("Token not available");
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log("Error:", err);
        }
        req.user = user;
        next();
    });
}

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username: username });
        if (!existingUser) {
            return res.status(409).json({ error: "User is not Registered!" });
        }
        const isPasswordCorrect = await existingUser.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            return res.status(403).json({ error: "Incorrect Password" });
        }
        const token = existingUser.generateAccessToken();
        return res.json({ token });
    }
    catch (err) {
        console.log("Error:", err);
    }
});

app.post("/register", async (req, res) => {
    try {
        const { username, password, name, dob, phone, address } = req.body;
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(409).json({ error: "User Already Exists" });
        }
        const newUser = new User({ username, password, name, dob, phone, address });
        await newUser.save();
        const token = newUser.generateAccessToken();
        return res.json({ token });
    }
    catch (err) {
        console.log("Error:", err);
    }
});

app.get("/getUser", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ user });
    }
    catch (err) {
        console.log("Error:", err);
    }
});

app.put("/profile/update", authenticateUser, async (req, res) => {
    try {
        const { name, email, phone, dob, address } = req.body;
        const userFind = await User.findById(req.user._id);
        userFind.name = name || user.name;
        userFind.username = email || user.username;
        userFind.phone = phone || user.phone;
        userFind.dob = dob || user.dob;
        userFind.address = address || user.address;
        await userFind.save();
        return res.status(200).json({ success: "Succcessfully updated" });
    }
    catch (err) {
        console.log("Error:", err);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});