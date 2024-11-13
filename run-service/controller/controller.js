import { v4 as uuidv4 } from "uuid";

import { printRedisMemory, setChannelData } from "../utils/redis.js";
import { redisClient } from "../server.js";
import ConflictError from "../errors/ConflictError.js";
import NotFoundError from "../errors/NotFoundError.js";
import BaseError from "../errors/BaseError.js";
import { getTestcases, processTestcases } from "../utils/index.js";

// Add function to create channelId connection when session starts
const startSession = async (req, res) => {
  const { firstUserId, secondUserId } = req.body;
  // sort both users by id
  const [userA, userB] = [firstUserId, secondUserId].sort();
  try {
    // Check if a session already exists by checking redis store
    const sessionKey = `session:${userA}-${userB}`;

    console.log(
      "✅✅✅✅ REDIS CONTENTS UPON REQUESTION TO START SESSION ✅✅✅✅"
    );
    printRedisMemory();
    // Get session data from Redis
    const channelData = await redisClient.hGetAll(sessionKey);
    if (channelData && channelData.channelId) {
      console.log(
        "============== Session data found in Redis: ==============",
        channelData.channelId
      );
      // Remove channel data from Redis
      return res.status(200).json({
        statusCode: 200,
        message: `Unique channelId found for ${userA} and ${userB}`,
        data: { channelId: channelData.channelId, userA, userB },
      });
    } else {
      // Create a new channelId

      const channelId = uuidv4();
      console.log("Creating session in Redis:", channelId);
      const sessionData = { channelId, userA, userB };
      setChannelData(sessionKey, sessionData);
      // NOTE: Maybe both users have to join session within x minutes, otherwise this will fail
      await redisClient.expire(sessionKey, 600);
      console.log(
        "============ Created session with sessionkey ============",
        sessionKey
      );
      return res.status(200).json({
        statusCode: 200,
        message: `New channelId created for ${userA} and ${userB}`,
        data: { channelId, userA, userB },
      });
    }
  } catch (error) {
    console.error("Error creating sessionId:", error.message);
    return res
      .status(500)
      .json({ statusCode: 500, message: "Failed to start session" });
  }
};

// Add function to create SSE connection with unique channelId
const subscribeToChannel = async (req, res) => {
  const { channelId } = req.params;
  const { userId, otherUserId } = req.query;
  const [userA, userB] = [userId, otherUserId].sort();

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  // Set response headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Response to indicate start (on connect)
  res.write(
    `data: ${JSON.stringify({
      statusCode: 201,
      message: "Starting session...",
    })}\n\n`
  );

  const channelKey = `channel:${channelId}`;

  const setUserConnectedData = { [userId]: "connected" };
  setChannelData(channelKey, setUserConnectedData);
  console.log("User connected to channel:", userId);
  const toLog = await redisClient.hGetAll(`channel:${channelId}`);
  console.log(`Channel data after setting connected for user:${userId}`, toLog);

  subscriber.subscribe(`channel:${channelId}`, (message) => {
    const update = JSON.parse(message);

    if (update.statusCode === 200) {
      // final one: set timeout of 8 seconds
      // comment out later
      // setTimeout(() => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
      // }, 8000);
    } else if (update.statusCode === 206) {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  });

  req.on("close", async () => {
    console.log("Receiving client's closing connection response");
    // delete channel data from Redis
    const channelData = await redisClient.hGetAll(`channel:${channelId}`);
    if (channelData && channelData[otherUserId] === "disconnected") {
      await redisClient.del(`channel:${channelId}`);
      await redisClient.del(`session:${userA}-${userB}`);
    } else {
      const setUserDisconnectedData = { [userId]: "disconnected" };
      setChannelData(channelKey, setUserDisconnectedData);
    }
    await subscriber.unsubscribe();
    await subscriber.disconnect();
    printRedisMemory();
    res.end();
  });
};

const executeTest = async (req, res) => {
  try {
    printRedisMemory();
    console.log("executing test started");
    const questionId = req.params.questionId;
    const { codeAttempt, channelId, firstUserId, secondUserId } = req.body;

    const channelKey = `channel:${channelId}`;
    // Check if another execution is in progress
    const initialChannelData = await redisClient.hGetAll(
      `channel:${channelId}`
    );
    console.log("Existing job data:", initialChannelData);
    if (initialChannelData && initialChannelData.status === "processing") {
      console.log(
        "Another execution is already in progress. Try again later error thrown"
      );
      throw new ConflictError(
        "Another execution is already in progress. Try again later."
      );
      return;
    }


    // Retrieve testcases for the question
    console.log("Executing test cases for questionId:", questionId);
    const testcases = await getTestcases(questionId);
    if (!testcases) {
      throw new NotFoundError("Testcases not found for the question");
    }

    for (let i = 0; i < testcases.length; i++) {
      console.log("Testcase:", testcases[i]._id);
      console.log("isPublic:", testcases[i].isPublic);
    }
    console.log("Testcases retrieved sucessfully");
    console.log({ channelId });
    // Indicate that the test cases are being processed - initial message to indicate start of execution
    const channelData = await redisClient.hGetAll(`channel:${channelId}`);
    if (channelData && channelData.status !== "processing") {
      const setStatusData = {
        status: "processing",
        questionId,
        codeAttempt,
        data: JSON.stringify([]),
      };
      setChannelData(channelKey, setStatusData);
    }
    const testCaseCount = testcases.length;

    const toLog = await redisClient.hGetAll(`channel:${channelId}`);
    console.log("Channel data after setting status:", toLog);

    // Start processing test cases
    processTestcases(channelId, testcases, codeAttempt, questionId);

    // Respond to client with test case count
    res.status(200).json({
      statusCode: 200,
      message: `Executing test cases for questionId: ${questionId}`,
      data: { testCaseCount: testCaseCount },
    });
  } catch (error) {
    console.log("ERROR: ", error);
    if (error instanceof BaseError) {
      return res
        .status(error.statusCode)
        .json({ statusCode: error.statusCode, message: error.message });
    }
    res.status(500).json({ error: "Failed to execute test cases" });
  }
};

export { executeTest, subscribeToChannel, startSession };
