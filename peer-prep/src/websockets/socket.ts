import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL =
  process.env.NODE_ENV === 'production'
    ? 'ws://peerprep-1039182349.ap-southeast-1.elb.amazonaws.com'
    : 'ws://localhost:8002';

export const socket = io(URL, {
  path: '/api/matching-service',
  transports: ['websocket'],
  autoConnect: false,
  withCredentials: true,
});
