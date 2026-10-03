import "dotenv/config"; // must be first: loads backend/.env before any other module reads process.env
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { documentsRouter } from "./routes/documents";
import { extractRouter } from "./routes/extract";
import { JURISDICTIONS } from "./jurisdictions";

const app = express();
app.use(cors());
// Large enough for a base64-encoded PDF or PNG upload.
app.use(express.json({ limit: "15mb" }));

app.use("/api/documents", documentsRouter);
app.use("/api/extract-text", extractRouter);

app.get("/api/jurisdictions", (_req, res) => {
  res.json(JURISDICTIONS);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT ?? 4000;
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/flag-review";

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed, continuing without persistence:", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
