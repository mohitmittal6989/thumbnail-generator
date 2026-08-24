const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const thumbnailRoutes = require("./routes/thumbnailRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/thumbnails", thumbnailRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong"
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});