import axios from "axios";
import EventSource from "eventsource";

const QUESTION_SERVICE_URL = "http://localhost:8003/api/question-service";
const RUN_SERVICE_URL = "http://localhost:8007/api/run-service";

// find random question
async function findRandomQuestion() {
  const response = await axios.get(`${QUESTION_SERVICE_URL}/random`);
  return response.data.data;
}
async function test() {
  try {
    // Start a session between two users (WHEN COLLAB SESSION STARTS)
    const sessionResponse = await axios.post(`${RUN_SERVICE_URL}/session`, {
      firstUserId: "user1",
      secondUserId: "user2",
    });

    const secondSessionResponse = await axios.post(
      `${RUN_SERVICE_URL}/session`,
      {
        firstUserId: "user2",
        secondUserId: "user1",
      }
    );
    const channelId = sessionResponse.data.data.channelId;
    const secondChannelId = secondSessionResponse.data.data.channelId;

    console.log("Session started with channelId for first:", channelId);
    console.log("Session started with channelId for second:", secondChannelId);

    // Simulate two clients subscribing to the SSE channel
    const client1 = new EventSource(
      `${RUN_SERVICE_URL}/subscribe/${channelId}?userId=user1&otherUserId=user2`
    );
    const client2 = new EventSource(
      `${RUN_SERVICE_URL}/subscribe/${channelId}?userId=user2&otherUserId=user1`
    );

    const handleMessage = (event, clientName) => {
      const message = JSON.parse(event.data);

      // Log message received

      // Check if execution is complete and log each result
      if (message.statusCode === 200) {
        console.log(
          `========================= Test execution complete for ${message.data.questionId} for ${clientName} ===================================`
        );
        console.log("Code", message.data.code);
        for (const result of message.data.results) {
          const resultData = result;
          const {
            isPassed,
            stdout,
            stderr,
            memory,
            time,
            testCaseDetails,
      
          } = resultData;

          console.log(`Test Case ${testCaseDetails.testCaseId}:`);
          console.log(`  Passed: ${isPassed}`);
          console.log(`  Output: ${stdout}`);
          console.log(`  Error: ${stderr}`);
          console.log(`  Memory: ${memory}`);
          console.log(`  Time: ${time}`);
          console.log(
            `  Expected Output: ${
              testCaseDetails ? testCaseDetails.expectedOutput : "N/A"
            }`
            
          );
        }
      } else {
        console.log(`Message received for ${clientName}:`);
        console.log("StatusCode", message.statusCode);
        console.log("Message", message.message);
        if (message.data) {
          console.log(`Test Case: ${message.data.result.testCaseDetails.testCaseId}`);
          console.log(`  Passed:${message.data.result.isPassed}`);
          console.log(`  Output: ${message.data.result.stdout}`);
          console.log(
            `  Expected Output: ${
              message.data.result.expectedOutput ? testCaseDetails.expectedOutput : "N/A"
            }`
          );
        }
      }
    };

    // TEST: closing connection of SSE
    client1.onopen = () => {
      setTimeout(() => {
        client1.close();
        console.log("Connection closed after 3 minutes for client1.");
      }, 40000);
    };
    client2.onopen = () => {
      setTimeout(() => {
        client2.close();
        console.log("Connection closed after 3 minutes for client2.");
      }, 40000);
    };

    // Set up event listeners for both clients
    client1.onmessage = (event) => handleMessage(event, "Client 1", client1);
    client2.onmessage = (event) => handleMessage(event, "Client 2", client2);

    client1.onerror = (error) => {
      console.error("Client 1 encountered an error:", error);
      client1.close();
    };

    client2.onerror = (error) => {
      console.error("Client 2 encountered an error:", error);
      client2.close();
    };

    console.log(
      "========================================================================"
    );
    // TEST: Execute a question testcase
    const question = await findRandomQuestion();
    const questionId = question.question._id;
    console.log("FIRST QUESTIONID", questionId);
    const executeResponse = await axios.post(
      `${RUN_SERVICE_URL}/execute/${questionId}`,
      {
        codeAttempt: question.question.solutionCode,
        channelId: channelId,
        firstUserId: "user1",
        secondUserId: "user2",
      }
    );
    console.log(
      "=================== FIRST question execution started with response: =======================\n",
      executeResponse.data
    );

    // TEST: Execute a question testcase that should be blocked (error thrown 409 conflict)
    try {
      const secondQuestion = await findRandomQuestion();
      const secondQuestionId = secondQuestion.question._id;
      console.log("SECONDQUESTIONID", secondQuestionId);
      const secondExecuteResponse = await axios.post(
        `${RUN_SERVICE_URL}/execute/${secondQuestionId}`,
        {
          codeAttempt: secondQuestion.question.solutionCode,
          channelId: secondChannelId,
          firstUserId: "user2",
          secondUserId: "user1",
        }
      );
      console.log(
        "=================== SECOND question execution started with response: =======================\n",
        secondExecuteResponse.data
      );
    } catch (error) {
      if (error.response) {
        console.log(error.response.data.statusCode)
        console.error(
          "================== Error from test:",
          error.response.data.message
        );
      } else {
        console.error("Error from test:", error.message);
      }
    }

    // TEST: Execute another question testcase afterwards (should execute as intended)
    setTimeout(async () => {
      const thirdQuestion = await findRandomQuestion();
      const thirdQuestionId = thirdQuestion.question._id;
      console.log("thirdQuestionId", thirdQuestionId);
      const thirdExecuteResponse = await axios.post(
        `${RUN_SERVICE_URL}/execute/${thirdQuestionId}`,
        {
          codeAttempt: thirdQuestion.question.solutionCode,
          channelId: channelId,
          firstUserId: "user1",
          secondUserId: "user2",
        }
      );
      console.log(
        "=================== THIRD question execution started with response: =======================\n",
        thirdExecuteResponse.data
      );
    }, 15000);
  } catch (error) {
    if (error.response) {
      console.error(
        "Status code of error from test:",
        error.response.data.statusCode
      );
      console.error("Error from test:", error.response.data.message);
    } else {
      //console.error("Error from test:", error.message);
      console.error("Error from test:", error);
    }
  }
}

test();
