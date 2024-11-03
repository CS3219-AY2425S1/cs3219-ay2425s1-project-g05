import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";
import router from "./router.js";

const app = express();
const port = 8009;
dotenv.config();
app.use(express.json());

const questionServiceUrl =
  process.env.NODE_ENV === "DEV" ? process.env.QUESTION_SVC_DEV : "";

// TODO: Replace with actual Redis connection instance
const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));
redisClient.on("ready", () => console.log("Redis Client Ready"));
await redisClient.connect();

app.use("/api/run-service", router);

// Test Route for Health Checks
app.get("/healthz", (req, res) => {
  res
    .status(200)
    .json({ message: "Connected to /healthz route of run-service" });
});

app.listen(port, () => console.log(`run-service listening on port ${port}`));

export { redisClient, questionServiceUrl };