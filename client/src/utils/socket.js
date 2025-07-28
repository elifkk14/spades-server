import { io } from "socket.io-client";

const socket = io("https://spades-server.onrender.com", {
  transports: ["websocket"]
});

export default socket;
