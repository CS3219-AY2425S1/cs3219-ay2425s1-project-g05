import express from "express";
import { executeTest, startSession, subscribeToChannel } from "./controller.js";
const router = express.Router();

// POST route to initiate a session
router.post("/session", startSession);

// GET route to subscribe to a channel
router.get("/subscribe/:channelId", subscribeToChannel);

// POST route to initiate a test run
router.post("/execute/:questionId", executeTest);

// GET route to retrieve results of a test run (SSE Url)
// router.get("/result/:jobId", getResults);

export default router;
