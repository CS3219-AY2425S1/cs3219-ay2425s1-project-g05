import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import corsMiddleware from './middleware/cors.js';
import bodyParser from 'body-parser';
import loggingMiddleware from './middleware/logging.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

app.use(corsMiddleware);
app.use(bodyParser.json());
app.use(loggingMiddleware);

// Test Route for Health Checks
app.get('/healthz', (request, response) => {
  response.status(200).json({
    message: 'Connected to the /healthz route of the gen-ai-service',
  });
});

// Automatically delete sessions after 60 minutes of inactivity
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

// In-memory store for chat sessions. 
const userSessions = new Map();

// Function to create a new chat session for a user
function createNewChatSession(apiKey, userId, roomId) {
  const genAIClient = new GoogleGenerativeAI(apiKey);
  const model = genAIClient.getGenerativeModel({ model: 'gemini-pro' });

  const chatSession = model.startChat({
    history: [], // Start with an empty history for each new session
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

  console.log('Chat session created successfully:', chatSession);

  // Store the chat session in the userSessions map
  if (userSessions.has(userId)) {
    userSessions.get(userId).set(roomId, chatSession);
  } else {
    const userChatSessions = new Map();
    userChatSessions.set(roomId, chatSession);
    userSessions.set(userId, userChatSessions);
  }

}

// Function to retrieve the chat session for a given user and room
const retrieveChatSession = (userId, roomId) => {
  const userChatSessions = userSessions.get(userId);

  // Check if the user has any existing sessions
  if (!userChatSessions || !userChatSessions.has(roomId)) {
    // Throw an error indicating that the API key is needed to create a new session
    throw new Error('API_KEY_REQUIRED');
  }

  return userChatSessions.get(roomId);
}

// Periodically clean up inactive sessions
setInterval(() => {
  const now = Date.now();
  userSessions.forEach((value, key) => {
    if (now - value.lastActive > SESSION_TIMEOUT_MS) {
      userSessions.delete(key);
    }
  });
}, SESSION_TIMEOUT_MS);


// Endpoint to check if active chat session exists
app.post('/api/gen-ai-service/check-active-session', async (req, res) => {
  const { userId, roomId } = req.body;

  if (!userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'User ID and Room ID are required' });
  }

  const userChatSessions = userSessions.get(userId);
  const hasActiveSession = userChatSessions && userChatSessions.has(roomId);

  res.status(200).json({
    statusCode: 200,
    message: 'Active session check successful',
    data: { hasActiveSession },
  });
});


// Create chat session endpoint
app.post('/api/gen-ai-service/create-session', async (req, res) => {
  console.log('creating sessionnn')

  const { userId, roomId, apiKey } = req.body;
  console.log('User ID:', userId);
  console.log('Room ID:', roomId);
  console.log('API Key:', apiKey);

  if (!apiKey) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'API Key is required' });
  }

  if (!userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'User ID and Room ID is required' });
  }

  try {
    createNewChatSession(apiKey, userId, roomId);

    // try to send a test chat message
    let chatSession = retrieveChatSession(userId, roomId);
    const result = await chatSession.sendMessage('Hello, I am here to help you with your coding problems.');

    res.status(200).json({
      statusCode: 200,
      message: 'Chat session created successfully',
      data: { userId, roomId },
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    console.log(error.status)
    console.log("-0------------")

    let statusCode = 500;
    let message = 'An error occurred while creating the chat session';

    // delete the session and user from the map
    // always delete
    if (userSessions.has(userId)) {
      userSessions.delete(userId);
    }

    if (error.response) {
      // If the error has a response property, it indicates an HTTP error
      statusCode = error.response.status;

      switch (statusCode) {
        case 400:
          if (error.response.data && error.response.data.error === 'INVALID_ARGUMENT') {
            message = 'Bad Request: The request body is malformed. Please check your input parameters.';
          } else if (error.response.data && error.response.data.error === 'FAILED_PRECONDITION') {
            message = 'Bad Request: The free tier is not available in your country. Please enable billing on your project.';
          }
          break;
        case 403:
          message = 'Forbidden: Your API key does not have the required permissions. Please check your API key.';
          break;
        case 404:
          message = 'Not Found: The requested resource was not found. Please verify your request parameters.';
          break;
        case 429:
          message = 'Too Many Requests: You have exceeded the rate limit. Please slow down your requests.';
          break;
        case 500:
          message = 'Internal Server Error: An unexpected error occurred on Google\'s side. Please try again later.';
          break;
        case 503:
          message = 'Service Unavailable: The service is temporarily overloaded or down. Please try again later.';
          break;
        case 504:
          message = 'Deadline Exceeded: The service was unable to finish processing within the deadline. Please try again with a larger timeout.';
          break;
        default:
          message = error.message || message; // Fallback to the default message
      }
    }

    if (error.errorDetails.length) {
      if (error.errorDetails[0].reason === 'API_KEY_REQUIRED' || error.errorDetails[0].reason === 'API_KEY_INVALID') {
        message = 'API Key is invalid. Please check your API key and try again.'
        statusCode = 400;
      }

      res.status(statusCode).json({
        statusCode,
        message,
      });
    }
  }
});

// Chat endpoint
app.post('/api/gen-ai-service/chat', async (req, res) => {
  const { message, userId, roomId } = req.body;

  if (!message || !userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Message, User ID and Room ID are required' });
  }

  console.log('Message:', message);

  try {
    // Attempt to retrieve the chat session
    let chatSession = retrieveChatSession(userId, roomId);

    console.log('Chat session retrieved successfully:', chatSession);

    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const text = await response.text();

    console.log('Response:', text);

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    if (error.message === 'API_KEY_REQUIRED') {
      return res.status(400).json({
        statusCode: 400,
        message: 'API Key is required to create a new chat session.',
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error communicating with Gemini API, please try again later.',
        data: null,
      });
    }
  }
});

// Analyse failed test cases endpoint
app.post('/api/gen-ai-service/analyse-failed-test-cases', async (req, res) => {

  const { testProgramCode, expectedOutput, actualOutput, solutionCode, question, userId, roomId } = req.body;

  if (!testProgramCode || !expectedOutput || !actualOutput || !solutionCode || !question || !userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Missing params for analysing failed test cases' });
  }

  const prompt = `I have written a piece of code to solve a problem, and I am encountering errors when I run it. Below are the details of the problem, the test program code, the expected output, the actual output, and my current solution code. \n`
    + `Question: \n ${question} \n Test Program Code: \n ${testProgramCode} \n Expected Output: \n ${expectedOutput} \n Actual Output: \n ${actualOutput} \n Solution code: \n ${solutionCode} \n`
    + 'I need your help to understand why my solution is not producing the expected output. Please analyze the provided solution code and test program code in detail to identify what might be causing the discrepancies between the actual and expected output. \n'
    + '- Focus on pinpointing specific bugs or logical errors in the code. \n'
    + '- Suggest improvements or corrections to fix the failing test cases. \n'
    + 'Please provide a detailed analysis and step-by-step suggestions on how to fix the errors, but keep it concise while still being clear. Thank you!';

  try {
    let chatSession = retrieveChatSession(userId, roomId);

    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    if (error.message === 'API_KEY_REQUIRED') {
      return res.status(400).json({
        statusCode: 400,
        message: 'API Key is required to create a new chat session.',
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error communicating with Gemini API, please try again later.',
        data: null,
      });
    }
  }
})

// Analyse error logs endpoint
app.post('/api/gen-ai-service/analyse-error-logs', async (req, res) => {

  const { errorLogs, solutionCode, userId, roomId } = req.body;

  if (!errorLogs || !solutionCode || !userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Logs or solution code are required' });
  }

  const prompt = 'I have written a piece of code, and I am encountering errors when I run it. Below are the error logs and my current solution code. \n'
    + `Error logs: \n ${errorLogs} \n Solution code: \n ${solutionCode} \n `
    + 'Please help me understand the errors by analyzing the logs provided. Focus only on identifying what might be causing these errors and provide specific '
    + 'steps or advice on how to fix them. Do not give me a solution to the entire problem, and avoid any hints or explanations related to solving the overall task.';


  try {
    let chatSession = retrieveChatSession(userId, roomId);

    // Send the user message to Gemini and get the response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log('Response:', text);

    res.status(200).json({
      statusCode: 200,
      message: 'Chat response retrieved successfully',
      data: { reply: text },
    });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    if (error.message === 'API_KEY_REQUIRED') {
      return res.status(400).json({
        statusCode: 400,
        message: 'API Key is required to create a new chat session.',
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Error communicating with Gemini API, please try again later.',
        data: null,
      });
    }
  }
});

// delete session endpoint
app.delete('/api/gen-ai-service/delete-session', async (req, res) => {
  const { userId, roomId } = req.body;

  if (!userId || !roomId) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'User ID and Room ID are required' });
  }

  const userChatSessions = userSessions.get(userId);

  if (userChatSessions && userChatSessions.has(roomId)) {
    userChatSessions.delete(roomId);
  }

  res.status(200).json({
    statusCode: 200,
    message: 'Chat session deleted successfully',
    data: { userId, roomId },
  });
});

app.listen(PORT, () => {
  console.log(`Chat service with Gemini is running on port ${PORT}`);
});
