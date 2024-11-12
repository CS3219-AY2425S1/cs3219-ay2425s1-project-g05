import axios from "axios";
import ServiceUnavailableError from "../errors/ServiceUnavailable.js";
import { questionServiceUrl, redisClient } from "../server.js";
import {printRedisMemory} from "./redis.js";

async function getTestcases(questionId) {
  try {
    const response = await axios.get(`${questionServiceUrl}/${questionId}`);
    const testcases = response.data.data.testCase;
    return testcases;
  } catch (error) {
    console.error("Error retrieving testcases:", error.message);
    throw new ServiceUnavailableError(
      "Connection to question service failed. Testcase execution failed."
    );
  }
}
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

    // Send POST request to the judge0 API
    const response = await axios.post(process.env.JUDGE0_API_URL, requestBody, {
      headers,
    });

    const responseData = response.data;

    let outputFinal = responseData.stdout ? responseData.stdout : "";
    let testCaseDetailsFinal = {
      input: responseData.input || "No input description",
      expectedOutput: testcase.expectedOutput || "No expected output",
      testCaseId: testcase._id,
    };

    // Remove output and question details if the testcase is not public
    if (!testcase.isPublic) {
      console.log("Removing output and question details for private testcase");
      outputFinal = null;
      testCaseDetailsFinal = {
        testCaseId: testcase._id,
        input: "Hidden",
        expectedOutput: "Hidden",
      };
    }

    const testCaseResult = {
      stderr: responseData.stderr,
      isPassed: responseData.status.id === 3 ? true : false,
      stdout: outputFinal,
      testCaseDetails: testCaseDetailsFinal,
      memory: responseData.memory || 0,
      time: responseData.time || "0",
    };
    return testCaseResult;
  } catch (error) {
    console.error("Error executing test case:", error.message);

    if (error.response) {
      switch (error.response.status) {
        case 404:
          // Service not found error -> means not available?
          throw new ServiceUnavailableError(
            "Execution Service not found. Testcase execution failed."
          );
        case 401:
          throw new UnauthorizedError(
            "Authentication failed. Testcase failed to execute."
          );
        case 503:
          throw new ServiceUnavailableError(
            503,
            "Queue is full. Testcase execution failed."
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

async function processTestcases(channelId, testcases, code, questionId) {
    // const results = [];
    let hasError = false;
    console.log("============Starting testcases execution==========");
    await redisClient.publish(
      `channel:${channelId}`,
      JSON.stringify({
        statusCode: 202,
        message: `Executing test cases of question ${questionId}`,
      })
    );
  
    const results = [];
  
    // Map each test case to a promise
    const promises = testcases.map(async (testcase) => {
      try {
        const result = await runTestcase(testcase, code);
        results.push(result);
  
        console.log("result", result);
  
        // Publish only the latest test case result
        await redisClient.publish(
          `channel:${channelId}`,
          JSON.stringify({
            statusCode: 206,
            message: `Testcase ${testcase._id} executed successfully`,
            data: { result },
          })
        );
  
        return result; // Return the result for Promise.all
      } catch (error) {
        console.log("Error while executing testcase:", testcase._id);
  
        const errorMessage = {
          testcaseId: testcase._id,
          message: error.message,
        };
        results.push(errorMessage);
        hasError = true;
  
        // Publish only the latest error result
        await redisClient.publish(
          `channel:${channelId}`,
          JSON.stringify({ statusCode: 500, message: errorMessage })
        );
  
        throw errorMessage; // Throw to handle failure in Promise.all
      }
    });
  
    try {
      await Promise.all(promises);
  
      console.log("Completed testcases execution for questionId:", questionId);
  
      await redisClient.hSet(`channel:${channelId}`, {
        status: hasError ? "error" : "completed",
        data: JSON.stringify(results),
        questionId: questionId,
        codeAttempt: code,
      });
  
      // Publish the "complete" status only if no errors occurred
      if (!hasError) {
        await redisClient.publish(
          `channel:${channelId}`,
          JSON.stringify({
            statusCode: 200,
            data: { results: results, questionId, code },
          })
        );
      }
    } catch (error) {
      console.log("Some testcases failed:", error);
  
      hasError = true;
    }
  
    printRedisMemory();
  }

export { getTestcases, processTestcases };
