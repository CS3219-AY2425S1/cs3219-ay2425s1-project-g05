import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL =
  process.env.NODE_ENV === 'production'
    ? undefined
    : 'ws://localhost:8002';

export const socket = io(URL, {
  path: '/api/matching-service',
  transports: ['websocket'],
  autoConnect: false,
  withCredentials: true,
});
