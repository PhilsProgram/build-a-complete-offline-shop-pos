import { Server } from "socket.io";

let io: Server;

export function setIo(socketServer: Server) {
  io = socketServer;
}

export function getIo() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}