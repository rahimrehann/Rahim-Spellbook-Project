import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { reviewsRouter } from "./routes/reviews";
import { extractRouter } from "./routes/extract";
import { JURISDICTIONS } from "./jurisdictions";

const app = express();

// Vercel and other hosts sit in front of the app, so use the forwarded client address.
app.set("trust proxy", 1);
app.use(cors());
// Vercel rejects request bodies over 4.5 MB. Base64 adds about a third, so files are capped at 3 MB.
app.use(express.json({ limit: "4.4mb" }));

// A generous safety net against runaway scripts. Normal use never reaches it.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests in the last hour. Please try again later." },
});

app.use("/api/reviews", aiLimiter, reviewsRouter);
app.use("/api/extract-text", aiLimiter, extractRouter);

app.get("/api/jurisdictions", (_req, res) => {
  res.json(JURISDICTIONS);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
