import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import printRedisMemory from "./redis.js";
import { questionServiceUrl, redisClient } from "./server.js";
import UnauthorizedError from "./errors/UnauthorisedError.js";
import ConflictError from "./errors/ConflictError.js";
import ServiceUnavailableError from "./errors/ServiceUnavailable.js";
import BaseError from "./errors/BaseError.js";

// Add function to create channelId connection when session starts
const startSession = async (req, res) => {
  const { firstUserId, secondUserId } = req.body;
  console.log("Starting session between", firstUserId, "and", secondUserId);
  // sort both users by id
  const [userA, userB] = [firstUserId, secondUserId].sort();
  try {
    // Check if a session already exists by checking redis store
    const sessionKey = `session:${userA}-${userB}`;
    // Get session data from Redis
    const channelData = await redisClient.hGetAll(sessionKey);
    if (channelData && channelData.channelId) {
      console.log("Session data found in Redis:", channelData.channelId);
      // Remove channel data from Redis
      await redisClient.del(sessionKey);
      return res.status(200).json({
        statusCode: 200,
        message: `Unique channelId found for ${userA} and ${userB}`,
        data: { channelId: channelData.channelId, userA, userB },
      });
    } else {
      // Create a new channelId

      const channelId = uuidv4();
      console.log("Creating session in Redis:", channelId);
      // Store channelId in Redis
      await redisClient.hSet(sessionKey, {
        channelId,
        userA,
        userB,
      });
      console.log("stored session with sessionkey", sessionKey);
      // delete session data after 10 minutes
      // NOTE: Maybe both users have to join session within 10 minutes, otherwise this will fail
      await redisClient.expire(sessionKey, 600);
      // TODO: test expiry
      console.log("created session");
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

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  // TODO: handle pub sub failures? Check in store whether there is an existing result?

  // Response to indicate start of execution and blocks further requests
  res.write(
    `data: ${JSON.stringify({
      status: "processing",
      message: "Starting session...",
    })}\n\n`
  );

  // NOTE: EXECUTING RESPONSES WILL BE SENT TO BOTH USERS

  subscriber.subscribe(`channel:${channelId}`, (message) => {
    const update = JSON.parse(message);

    if (update.status === "complete") {
      // remove the channel data from Redis
      (async () => {
        await redisClient.del(`channel:${channelId}`);
      })();
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    } else if (update.status === "error") {
      res.write(
        `data: ${JSON.stringify({
          status: "error",
          result: update,
        })}\n\n`
      );
    } else {
      res.write(
        `data: ${JSON.stringify({
          status: "processing",
          result: update.result,
        })}\n\n`
      );
    }
  });

  req.on("close", async () => {
    console.log("Receiving client's closing connection response");
    // delete channel data from Redis
    await redisClient.del(`channel:${channelId}`);
    await subscriber.unsubscribe();
    await subscriber.disconnect();
    res.end();
  });
};

const executeTest = async (req, res) => {
  const questionId = req.params.questionId;
  const { codeAttempt, channelId } = req.body;

  const existingJob = await redisClient.hGetAll(`channel:${channelId}`);
  console.log("Existing job data:", existingJob);
    if (existingJob && existingJob.status === "processing") {
      console.log("Another execution is already in progress. Try again later error thrown");
      res
        .status(409)
        .json({
          statusCode: 409,
          message: "Another execution is already in progress. Try again later.",
        });
      return;
    }


  console.log("Executing test cases for questionId:", questionId);
  try {
    // Retrieve test cases for the questionId
    const testcases = await getTestcases(questionId);
    if (!testcases) {
      return res
        .status(404)
        .json({ error: `No question found for ID ${questionId}` });
    }
    console.log("Testcases retrieved sucessfully");
    // Find whether theres already a job in progress
    
    // Initialize job data in Redis
    await redisClient.hSet(`channel:${channelId}`, {
      status: "processing",
      questionId,
      codeAttempt,
      data: JSON.stringify([]),
    });

    const testCaseCount = testcases.length;

    // Respond to client with jobId
    res.status(200).json({
      statusCode: 200,
      message: `Executing test cases for questionId: ${questionId}`,
      data: { testCaseCount: testCaseCount },
    });

    // Start processing test cases
    processTestcases(channelId, testcases, codeAttempt);
  } catch (error) {
    res.status(500).json({ error: "Failed to execute test cases" });
  }
};

// TODO: Refactor code below
// Function to execute a single test case
async function runTestcase(testcase, code) {
  try {
    // Append test code to main code
    const normalizedCode = code.trim().replace(/\r?\n/g, "\n");
    const testCode = testcase.testCode.trim().replace(/\r?\n/g, "\n");

    // Combine the normalized code and test code
    const sourceCode = `${normalizedCode}\n\n${testCode}`;
    const requestBody = {
      source_code: sourceCode,
      language_id: 71,
      expected_output: testcase.expectedOutput,
    };

    const headers = {
      "X-Auth-Token": process.env.X_AUTH_TOKEN,
      "X-Auth-User": process.env.X_AUTH_USER,
    };

    // Send POST request to the external API
    const response = await axios.post(process.env.JUDGE0_API_URL, requestBody, {
      headers,
    });

    //console.log("Response from API:", response.data);
    const responseData = response.data;
    const testCaseResult = {
      statusCode: 200,
      message: `${testcase._id} executed successfully`,
      data: {
        result: {
          stderr: responseData.stderr || "",
          isPassed: responseData.status.id === 3 ? true : false,
          stdout: responseData.stdout || "No result",
          questionDetails: {
            input: responseData.input || "No input description",
            expectedOutput: testcase.expectedOutput || "No expected output",
          },
          memory: responseData.memory || 0,
          time: responseData.time || "0",
          _id: testcase._id,
        },
      },
    };
    return testCaseResult;
  } catch (error) {
    console.error("Error executing test case:", error.message);

    if (error.response) {
      switch (error.response.status) {
        case 404:
          // Service not found error -> means not available?
          throw new ServiceUnavailableError(
            "Execution Service not found. Testcase execution halted."
          );
        case 401:
          throw new UnauthorizedError(
            "Authentication failed. Testcase failed to execute."
          );
        case 503:
          throw new ServiceUnavailableError(
            503,
            "Queue is full. Testcase execution halted."
          );
        default:
          throw new BaseError(
            error.response.status,
            "Error executing test case."
          );
      }
    } else {
      throw new BaseError(500, "Error executing test case.");
    }
  }
}

async function processTestcases(channelId, testcases, code) {
  const results = [];
  console.log("============Starting testcases execution==========");
  for (let i = 0; i < testcases.length; i++) {
    try {
      const result = await runTestcase(testcases[i], code);
      results.push(result);

      console.log("result", result);
      // Publish only the latest test case result
      await redisClient.publish(
        `channel:${channelId}`,
        JSON.stringify({ status: "processing", result })
      );
    } catch (error) {
      console.log("Error while executing testcase:", testcases[i]._id);
      const errorMessage = {
        testcaseId: testcases[i]._id,
        statusCode: error.statusCode,
        error: error.message,
      };
      results.push(errorMessage);

      console.log(
        "==========Error while executing testcase:",
        errorMessage.testcaseId
      );
      console.log("==========Error Message:", errorMessage.error);
      // Publish only the latest error result
      await redisClient.publish(
        `channel:${channelId}`,
        JSON.stringify({ status: "error", message: errorMessage })
      );
      break;
    }
  }
  console.log("Completed testcases execution");

  // After all test cases, publish the full results array
  await redisClient.hSet(`channel:${channelId}`, {
    status: "completed",
    data: JSON.stringify(results),
  });
  await redisClient.publish(
    `channel:${channelId}`,
    JSON.stringify({ status: "complete", data: { results: results } })
  );
  printRedisMemory();
}

// TODO: Refactor this function
async function getTestcases(questionId) {
  // GET request to question-service to retrieve test cases
  const response = await axios.get(`${questionServiceUrl}/${questionId}`);
  const testcases = response.data.data.testCase;
  return testcases;
}

const sendErrorAndClose = (res, subscriber) => {
  const errorMessage = JSON.stringify({
    status: "error",
    statusCode: 504,
    result: "Gateway Timeout: No response from execution server",
  });

  res.write(`data: ${errorMessage}\n\n`);
  subscriber.unsubscribe();
  res.end();
};

export { executeTest, subscribeToChannel, startSession };