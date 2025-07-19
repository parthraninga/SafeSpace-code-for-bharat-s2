const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

// Parse Redis URL for deployment environments
let redisConfig;

if (process.env.REDIS_URL) {
  // For deployment environments (like Render) with Redis URL
  redisConfig = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
    retryDelayOnFailover: 200,
    enableReadyCheck: false,
    maxLoadingTimeout: 0,
    lazyConnect: false, // Connect immediately to avoid lazy connection issues
    tls: process.env.REDIS_TLS === "true" ? {
      rejectUnauthorized: false // Allow self-signed certificates for cloud Redis
    } : undefined,
    // Optimized timeouts for cloud deployment
    connectTimeout: 30000, // 30 seconds for initial connection
    commandTimeout: 15000, // 15 seconds for commands
    // Connection pool settings
    family: 4, // Force IPv4
    keepAlive: true,
    // Retry configuration
    retryDelayOnClusterDown: 300,
    retryDelayOnFailover: 200,
    maxRetriesPerRequest: null,
    // Additional cloud-specific settings
    enableOfflineQueue: false,
    // Connection stability
    dropBufferSupport: false,
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
    lazyConnect: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });
}

redisConfig.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisConfig.on("error", (error) => {
  console.error(`❌ Redis connection error: ${error.message}`);
  if (error.message.includes('timeout')) {
    console.error('🔥 Redis timeout detected - check network connectivity');
  }
  // Don't exit process on Redis error to prevent app crash
});

redisConfig.on("reconnecting", (time) => {
  console.log(`🔄 Redis reconnecting in ${time}ms...`);
});

redisConfig.on("ready", () => {
  console.log("✅ Redis ready for commands");
});

redisConfig.on("close", () => {
  console.log("⚠️ Redis connection closed");
});

redisConfig.on("end", () => {
  console.log("⚠️ Redis connection ended");
});

// Test connection on startup
if (process.env.NODE_ENV === 'production') {
  redisConfig.ping()
    .then(() => console.log("🎯 Redis PING successful"))
    .catch((err) => console.error("🚨 Redis PING failed:", err.message));
}

module.exports = redisConfig;