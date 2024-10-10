import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import router from "./router/router.js";
import loggingMiddleware from "./middlewares/logging.js";
import errorHandler from "./middlewares/errorHandler.js";
import corsMiddleware from "./middlewares/cors.js";

dotenv.config();
const app = express();
const port = process.env.DEV_PORT || 8005;

app.use(corsMiddleware);
app.use(cookieParser());
app.use(loggingMiddleware);
app.use(bodyParser.json());

app.use("/api/history-service", router);

// Route for Health Checks
app.get("/healthz", (req, res) => {
  res.status(200).json({ message: "Connected to /healthz route of history-service" });
});

app.use(errorHandler); 

// MongoDB connection
mongoose.connect(process.env.DEV_URI, {});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB connection established successfully");
});
connection.on("error", (err) => {
  console.log("MongoDB error: " + err);
});

app.listen(port, () => console.log(`history-service listening on port ${port}`));