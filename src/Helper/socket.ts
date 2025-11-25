import { Server } from "socket.io";

export const io = new Server(8082, {
  cors: {
    origin: "*", // allow all for now
  },
});

const orderClients = new Map<string, string>(); // orderId → socket.id

io.on("connection", (socket) => {
  socket.on("register-order", (orderId: string) => {
    orderClients.set(orderId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [orderId, id] of orderClients) {
      if (id === socket.id) orderClients.delete(orderId);
    }
  });
});

export function notifyPayment(orderId: string, status: string) {
  const socketId = orderClients.get(orderId);
  if (socketId) {
    io.to(socketId).emit("payment-status", { orderId, status });
  }
}
