import express from 'express';
import { corsOp, allowedOrigins } from './src/middlewares/cors.js';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// get configs
config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // set cors origin to frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/api/communication-service',
  transports: ['websocket'],
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsOp);

// health check path
app.get('/healthz', (req, res) => {
  res
    .status(200)
    .json({ message: 'Connected to /healthz route of communication-service' });
});

// in-memory store for room and chat history
// to be replaced with a database in the future
/**
 * @type {{
 * [roomId: string]: {
 *  chatHistory: any[]
 *  }
 * }}
 */
const rooms = {}

function storeMessage(roomId, message) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      chatHistory: []
    }
  }

  rooms[roomId].chatHistory.push(message)

  console.log("INFO: Stored message in room { " + roomId + " }, room now has { " + rooms[roomId].chatHistory.length + " } messages")
}

function cleanupRoom(roomId) {
  delete rooms[roomId]
}


/**
 *
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket
 * @param {{
 *  roomId: string,
 *  user: {
 *    userId: string,
 *    displayName: string,
 *    email: string
 *    }
 *  }} data
 *
 */
function onJoinRoom(io, socket, data) {
  const { roomId, user } = data;
  // if there are already two people in this room, reject the request
  if (io.sockets.adapter.rooms.get(roomId)?.size >= 2) {

    console.log(`INFO: Room { ${roomId} } is full, rejecting user { ${user.userId} }`);
    socket.emit('room-full');
    return
  }
  onSetUsername(io, socket, user);

  socket.join(roomId); // User joins the specified room
  console.log(`User ${socket.id} joined room ${roomId}`);

  // broadcast that a user has joined the room
  io.to(roomId).emit('user-joined', {
    userSocketId: socket.id,
    timestamp: new Date(),
  });

  // update users in room
  onRoomPeopleUpdate(io, socket, { roomId });  // specifically tell the user who just joined the room
  // about the message history
  if (rooms[roomId]) {
    const chatHistory = rooms[roomId].chatHistory

    socket.emit("chat-history", {
      chatHistory
    })

  }

}

/**
 *
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket
 * @param {*} data
 * @param {string?} removeUserId
 */
function onRoomPeopleUpdate(io, socket, data, removeUserId) {
  const { roomId } = data;

  console.log('LOG: Remove user id', removeUserId);
  io.in(roomId)
    .fetchSockets()
    .then((sockets) => {
      console.log(
        `LOG: userIds in room = ${sockets.map((socket) => socket.userId)}`
      );
      // in this loop, this is all the users in this room
      const userSocketsInRoom = sockets.filter((socket) =>
        !removeUserId ? true : socket.userId !== removeUserId
      );

      // tell frontend who is in the room
      // if removeUserId is not null, means that we are calling this function
      // from onBeforeDisconnect, and we want to remove the user who is about to disconenct
      // from this list
      const users = userSocketsInRoom.map((socket) => ({
        userId: socket.userId,
        name: socket.name,
        email: socket.email,
        userSocketId: socket.id,
      }));

      // console.log("<<<<<<<<<")
      // console.log({ usersInRoom })

      console.log(`INFO: there are now { ${users.length} } users in the room`);
      if (users.length === 0) {
        // cleanup the store
        cleanupRoom(roomId)
      }

      userSocketsInRoom.forEach((socket) => {
        socket.emit('room-people-update', {
          users: users,
        });
      });
    });
}

/**
 *
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket
 * @param {{
 *  name: string,
 *  email: string,
 *  userId: string,
 * }} data
 */
function onSetUsername(io, socket, data) {
  const { name, email, userId } = data;
  socket.name = name;
  socket.email = email;
  socket.userId = userId;
  console.log(
    `User socketId { ${socket.id} } set name to ${name} and email to ${email}`
  );

  // note: username-set not captured on the client side
  socket.emit('username-set', { name, email });
}


/**
 * 
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io 
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket 
 * @param {{
 *  roomId: string,
 *  message: string,
 *  replyToId?: string
 *  integration?: string // "copilot" || "chatgpt4o" || "gemini_1.0"
 * }} data 
 */
function onChatMessage(io, socket, data) {
  const { roomId, message, replyToId, integration } = data;

  console.log(`Received message { ${message} } for room id { ${roomId} }`);
  // generate a messageId based on the roomId and the current timestamp
  const uniqueId = `${roomId}-${new Date().getTime()}`
  // append this message to the room's chat history
  const messageObject = {
    sender: {
      userId: socket.userId,
      name: socket.name,
      email: socket.email,
      userSocketId: socket.id,

    },
    integration: integration,
    content: message,
    timestamp: new Date(),
    messageId: uniqueId,
    replyToId: replyToId
  }

  storeMessage(roomId, messageObject)



  // note: for normal operations, we only send over the NEW message from BE to FE
  // only when users reconnect, we send over the entire chat history
  io.to(roomId).emit('chat-message', messageObject); // Broadcast to users in the room

  // send back confirmation saying server received sent chat message
  socket.emit('message-sent');
}

function onBeforeDisconnect(io, socket) {
  console.log('LOG: onBeforeDisconnect');

  // because each socket is automatically assigned to a room with the same id as the socket id
  // remove tha troom
  const rooms = socket.rooms;
  rooms.delete(socket.id);

  rooms.forEach((roomId) => {
    onRoomPeopleUpdate(io, socket, { roomId }, socket.userId);
    io.to(roomId).emit('user-left', {
      userId: socket.id,
      timestamp: new Date(),
    });
  });
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for a join request from the client
  socket.on('join-room', (data) => onJoinRoom(io, socket, data));

  // Handle chat messages for a specific room
  socket.on('chat-message', (data) => onChatMessage(io, socket, data));

  // capture event before fully disconnect to alert other user of leaving the chatroom
  socket.on('disconnecting', () => onBeforeDisconnect(io, socket));

  // set user details
  socket.on('set-details', (data) => onSetUsername(io, socket, data));

  socket.on('disconnect', () => {
    console.log(`INFO: User disconnected with socket id { ${socket.id} }`);

    // remember to update the video call data
  });
});

const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
