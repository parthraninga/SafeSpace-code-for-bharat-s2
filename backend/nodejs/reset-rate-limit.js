const redisClient = require('./src/Redis/Config/RedisConfig');

async function resetRateLimit(clientId = null) {
    try {
        console.log('🔄 Resetting rate limits...');
        
        if (clientId) {
            // Reset for specific client ID
            const rateLimitKey = `rate_limit:${clientId}`;
            const result = await redisClient.del(rateLimitKey);
            console.log(`✅ Reset rate limit for client: ${clientId} (${result} key deleted)`);
        } else {
            // Reset all rate limits
            const keys = await redisClient.keys('rate_limit:*');
            if (keys.length > 0) {
                const result = await redisClient.del(...keys);
                console.log(`✅ Reset rate limits for all clients (${result} keys deleted)`);
            } else {
                console.log('ℹ️ No rate limit keys found to reset');
            }
        }
        
        console.log('🎉 Rate limit reset complete!');
    } catch (error) {
        console.error('❌ Error resetting rate limits:', error.message);
    }
}

// Get command line argument for specific client ID
const clientId = process.argv[2];

if (require.main === module) {
    resetRateLimit(clientId)
        .then(() => {
            console.log('\n📋 Usage examples:');
            console.log('- Reset all rate limits: node reset-rate-limit.js');
            console.log('- Reset for specific IP: node reset-rate-limit.js 192.168.1.1');
            console.log('- Reset for localhost: node reset-rate-limit.js ::1');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Failed:', error);
            process.exit(1);
        });
}

module.exports = resetRateLimit;
