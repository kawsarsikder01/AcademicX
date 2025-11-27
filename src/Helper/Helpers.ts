export const route = (path: string) => {
  return `${process.env.BASE_URL}/${path}`;
};

export function generateTrxId(): string {
  const timestamp = Date.now().toString().slice(-10); // last 10 digits
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // 3 digits
  return `TRX${timestamp}${random}`; // 3 + 10 + 3 = 16, trim one more digit if needed
}

export function getIp(req: any) {
  let ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    (req as any).connection?.remoteAddress ||
    "";

  // Normalize IPv6 mapped IPv4 (e.g., ::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  return ip;
}
