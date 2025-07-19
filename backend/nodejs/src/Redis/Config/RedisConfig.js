const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const useTLS = process.env.REDIS_TLS === "true";

const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, 
});

redisConnection.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisConnection.on("error", (error) => {
  console.error(`❌ Redis connection error: ${error.message}`);
});

module.exports = redisConnection;