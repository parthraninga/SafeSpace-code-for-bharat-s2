const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

// Parse Redis URL for deployment environments
let redisConfig;

if (process.env.REDIS_URL) {
  // For deployment environments (like Render) with Redis URL
  redisConfig = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxLoadingTimeout: 0,
    lazyConnect: true,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    // Add error handling configuration
    connectTimeout: 10000,
    commandTimeout: 5000,
  });
} else {
  // For local development
  redisConfig = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxLoadingTimeout: 0,
    lazyConnect: true,
  });
}

redisConfig.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisConfig.on("error", (error) => {
  console.error(`❌ Redis connection error: ${error.message}`);
  // Don't exit process on Redis error to prevent app crash
});

redisConfig.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

redisConfig.on("ready", () => {
  console.log("✅ Redis ready for commands");
});

module.exports = redisConfig;