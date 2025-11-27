import { Server, Socket } from "socket.io";

// Start Socket.IO server directly on port 8082
export const io = new Server(8082, {
  cors: { origin: "*" }, // allow all origins for testing
});

// Map orderId → socket.id
const orderClients = new Map<string, string>();

// Define your event payloads
interface PaymentStatusPayload {
  orderId: string;
  status: string;
}

interface ServerToClientEvents {
  "payment-status": (payload: PaymentStatusPayload) => void;
}

interface ClientToServerEvents {
  "register-order": (orderId: string) => void;
}

// Cast io to type-safe server
const typedIo = io as Server<ClientToServerEvents, ServerToClientEvents>;

typedIo.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("Client connected:", socket.id);

  socket.on("register-order", (orderId) => {
    orderClients.set(orderId, socket.id);
    console.log(`Order ${orderId} registered to socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const [orderId, id] of orderClients) {
      if (id === socket.id) {
        orderClients.delete(orderId);
        console.log(`Order ${orderId} removed on disconnect`);
      }
    }
  });
});

// Function to notify client about payment
export function notifyPayment(orderId: string, status: string) {
  const socketId = orderClients.get(orderId);
  if (socketId) {
    typedIo.to(socketId).emit("payment-status", { orderId, status });
    console.log(`Notified payment status for order ${orderId}: ${status}`);
  }
}
