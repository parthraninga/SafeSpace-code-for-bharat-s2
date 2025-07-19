const redisClient = require('../Config/RedisConfig');

class ResilientRedisOperations {
    static async safeSet(key, value, expiry = null) {
        try {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis SET timeout')), 10000)
            );
            
            const operation = expiry 
                ? redisClient.set(key, value, 'EX', expiry)
                : redisClient.set(key, value);
            
            await Promise.race([operation, timeout]);
            return { success: true };
        } catch (error) {
            console.error(`Redis SET failed for key ${key}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    static async safeGet(key) {
        try {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis GET timeout')), 10000)
            );
            
            const operation = redisClient.get(key);
            const result = await Promise.race([operation, timeout]);
            
            return { success: true, data: result };
        } catch (error) {
            console.error(`Redis GET failed for key ${key}:`, error.message);
            return { success: false, error: error.message, data: null };
        }
    }
    
    static async safeDel(key) {
        try {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis DEL timeout')), 10000)
            );
            
            const operation = redisClient.del(key);
            await Promise.race([operation, timeout]);
            
            return { success: true };
        } catch (error) {
            console.error(`Redis DEL failed for key ${key}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    static async safePing() {
        try {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis PING timeout')), 5000)
            );
            
            const operation = redisClient.ping();
            await Promise.race([operation, timeout]);
            
            return { success: true };
        } catch (error) {
            console.error('Redis PING failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = ResilientRedisOperations;
