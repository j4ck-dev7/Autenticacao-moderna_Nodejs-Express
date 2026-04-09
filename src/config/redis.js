import { createClient } from "redis";

export const client = createClient();

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));

await client.connect();

export default client;