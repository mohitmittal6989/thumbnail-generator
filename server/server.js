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
const HOST = process.env.HOST || "0.0.0.0";

connectDB();

// Parse allowed origins from environment variable (supports comma-separated URLs)
const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...envOrigins,
  "https://thumbnail-generator-omega-opal.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000"
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  if (defaultAllowedOrigins.includes(cleanOrigin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) return true;
  return true;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get(["/", "/health", "/api/health"], (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/thumbnails", thumbnailRoutes);

// Fallback aliases without /api prefix
app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);
app.use("/thumbnails", thumbnailRoutes);

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