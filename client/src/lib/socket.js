
import { io } from "socket.io-client";

const socket = io("http://10.127.178.137:5000", {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
