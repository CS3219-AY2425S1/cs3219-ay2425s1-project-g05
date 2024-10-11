import { createContext } from 'react';
import { io } from "socket.io-client";

let socket;

function initSocket() {
    console.log("initSocket");
    socket = io("http://localhost:8002");
    return socket;
}

function getSocket() {
    if (!socket) {
        initSocket();
    }
    return socket;
}

export const SocketContext = createContext({
    getSocket: getSocket
}); 