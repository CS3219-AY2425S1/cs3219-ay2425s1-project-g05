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
  delete calls[roomId]
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

/**
 * @type {{
 * [roomId: string]: {
 *  offer: RTCSessionDescriptionInit,
 *  answer: RTCSessionDescriptionInit,
 *  offerCandidates: RTCIceCandidateInit[], 
 *  answerCandidates: RTCIceCandidateInit[]
 *  }
 * }} 
 */
const calls = {}


/**
 * Check if there is already a user waiting for video call in the room
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {{ roomId: string }} data 
 */
function onVideoCheck(io, socket, data) {
  if (!calls[data.roomId]) {
    console.log("LOG(VIDEO): No user waiting for video call in room { " + data.roomId + " }")
    socket.emit('video-check', null)
  } else {
    const { offer } = calls[data.roomId]

    // send the offer to the user who is checking
    console.log("LOG(VIDEO): User found waiting for video call in room { " + data.roomId + " }")

    socket.emit('video-check', { offer })
  }
}

/**
 * Initalize the first user in the room to start the video call.
 * Note that there should not be any other user in the room
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {{
 *  roomId: string,
 *  offer: RTCSessionDescriptionInit
 * }} data 
 */
function onVideoOffer(io, socket, data) {
  console.log("LOG(VIDEO): Received video offer")
  const { roomId, offer } = data;

  if (!calls[roomId]) {
    calls[roomId] = {
      offer,
      offerCandidates: [],
      answer: null,
      answerCandidates: []
    }

    // nothing to do here
  } else {
    console.log("ERROR: unreachable case was reached")
  }

}

/**
 * Answer the video cal.
 * Note that there should always be an offer before an answer.
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {{
 *  roomId: string, 
 *  answer: RTCSessionDescriptionInit 
 * }} data 
 */
function onVideoAnswer(io, socket, data) {
  console.log("LOG(VIDEO): Received video answer")
  const { roomId, answer } = data;

  if (!calls[roomId]) {
    console.log("ERROR: unreachable case was reached")
  } else {
    calls[roomId].answer = answer

    // forward the answer to the user who initiated the call
    // socket.emit('video-answer', { answer })
    io.to(roomId).emit('video-answer', { answer })
  }
}

/**
 * Forward the ICE candidate to the second user
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {{ 
 *  roomId: string,
 *  candidate: RTCIceCandidateInit
 * }} data 
 */
function onVideoOfferIceCandidate(io, socket, data) {
  console.log("LOG(VIDEO): Received video offer ICE candidate")
  const { roomId, candidate } = data;

  if (!calls[roomId]) {
    console.log("ERROR: unreachable case was reached")
  } else {
    calls[roomId].offerCandidates.push(candidate)

    // forward the candidate to the user who initiated the call (basically the other user in the room)
    io.to(roomId).emit('video-offer-ice-candidate', { candidate })

  }
}

/**
 * Forward the ICE candidate to the first user
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {{
 *  roomId: string,
 * candidate: RTCIceCandidateInit
 * }} data 
 */
function onVideoAnswerIceCandidate(io, socket, data) {
  console.log("LOG(VIDEO): Received video answer ICE candidate")
  const { roomId, candidate } = data;

  if (!calls[roomId]) {
    console.log("ERROR: unreachable case was reached")
  } else {
    calls[roomId].answerCandidates.push(candidate)

    // forward the candidate to the user who initiated the call
    io.to(roomId).emit('video-answer-ice-candidate', { candidate })
  }
}

function onVideoPartnerDisconnected(io, socket, data) {
  console.log("LOG(VIDEO): Partner disconnected")
  const { roomId } = data;

  // cleanup the call
  delete calls[roomId]

  io.to(roomId).emit('video-cleanup')
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for a join request from the client
  socket.on('joinRoom', (data) => onJoinRoom(io, socket, data));

  // Handle chat messages for a specific room
  socket.on('chat-message', (data) => onChatMessage(io, socket, data));

  // capture event before fully disconnect to alert other user of leaving the chatroom
  socket.on('disconnecting', () => onBeforeDisconnect(io, socket));

  // set user details
  socket.on('set-details', (data) => onSetUsername(io, socket, data));


  // ---- video chat ----
  // socket.on('video-offer', (data) => onVideoOffer(io, socket, data));

  socket.on('video-check', (data) => onVideoCheck(io, socket, data));

  socket.on('video-offer', (data) => onVideoOffer(io, socket, data));

  socket.on('video-answer', (data) => onVideoAnswer(io, socket, data))

  socket.on('video-offer-ice-candidate', data => onVideoOfferIceCandidate(io, socket, data))

  socket.on('video-answer-ice-candidate', data => onVideoAnswerIceCandidate(io, socket, data))

  socket.on('video-cleanup', (data) => onVideoPartnerDisconnected(io, socket, data))


  socket.on('disconnect', () => {
    console.log(`INFO: User disconnected with socket id { ${socket.id} }`);

    // remember to update the video call data
  });
});

const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
