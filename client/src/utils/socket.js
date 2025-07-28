import { io } from "socket.io-client";

const socket = io("https://spades-server.vercel.app", {
  transports: ["websocket"]
});

export default socket;
