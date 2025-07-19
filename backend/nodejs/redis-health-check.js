const redisClient = require('./src/Redis/Config/RedisConfig');

class RedisHealthCheck {
    static async checkConnection() {
        try {
            console.log('🔍 Starting Redis health check...');
            
            const start = Date.now();
            await redisClient.ping();
            const pingTime = Date.now() - start;
            
            console.log(`✅ PING successful in ${pingTime}ms`);
            
            if (pingTime > 5000) {
                console.warn(`⚠️ High latency detected: ${pingTime}ms - consider checking network`);
            }
            
            return { success: true, latency: pingTime };
        } catch (error) {
            console.error('❌ Redis health check failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    static async testOperations() {
        try {
            console.log('🧪 Testing Redis operations...');
            
            // Test SET
            const setStart = Date.now();
            await redisClient.set('health:test', 'test-value', 'EX', 30);
            const setTime = Date.now() - setStart;
            console.log(`✅ SET operation completed in ${setTime}ms`);
            
            // Test GET
            const getStart = Date.now();
            const value = await redisClient.get('health:test');
            const getTime = Date.now() - getStart;
            console.log(`✅ GET operation completed in ${getTime}ms, value: ${value}`);
            
            // Test DEL
            const delStart = Date.now();
            await redisClient.del('health:test');
            const delTime = Date.now() - delStart;
            console.log(`✅ DEL operation completed in ${delTime}ms`);
            
            const totalTime = setTime + getTime + delTime;
            console.log(`🎯 All operations completed in ${totalTime}ms total`);
            
            return {
                success: true,
                operations: {
                    set: setTime,
                    get: getTime,
                    del: delTime,
                    total: totalTime
                }
            };
        } catch (error) {
            console.error('❌ Redis operations test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    static async getConnectionInfo() {
        try {
            const info = await redisClient.info('server');
            console.log('📊 Redis Server Info:');
            console.log(info);
            return info;
        } catch (error) {
            console.error('❌ Failed to get Redis info:', error.message);
            return null;
        }
    }
}

// Run health check if this file is executed directly
if (require.main === module) {
    async function runHealthCheck() {
        console.log('🏥 Running comprehensive Redis health check...\n');
        
        await RedisHealthCheck.checkConnection();
        console.log('');
        
        await RedisHealthCheck.testOperations();
        console.log('');
        
        await RedisHealthCheck.getConnectionInfo();
        
        process.exit(0);
    }
    
    runHealthCheck();
}

module.exports = RedisHealthCheck;
