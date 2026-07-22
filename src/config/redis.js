import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.error("Redis error:", err));
client.on("connect", () => console.log("Redis connected"));

try {
  await client.connect();
} catch (err) {
  console.error("Falha ao conectar no Redis:", err);
}

export default client;
