# Redis Configuration Fix for Render Deployment

## Issues Fixed:

1. **Incorrect Redis Client Instantiation**: Fixed the double instantiation issue in OtpUtil.js
2. **Missing TLS Configuration**: Added proper TLS support for Upstash Redis
3. **Command Timeouts**: Added timeout handling to prevent hanging commands
4. **BullMQ Compatibility**: Set `maxRetriesPerRequest: null` for BullMQ operations
5. **Cloud Deployment Optimization**: Enhanced configuration for better cloud performance

## Changes Made:

### 1. Updated RedisConfig.js
- Added proper TLS configuration with `rejectUnauthorized: false` for cloud Redis
- Increased timeouts: `connectTimeout: 30000ms`, `commandTimeout: 15000ms`
- Improved connection options with `keepAlive: true` and `family: 4` (IPv4)
- Added comprehensive error handling and connection monitoring
- Set `lazyConnect: false` for immediate connection establishment

### 2. Enhanced OtpUtil.js
- Added timeout wrappers around Redis operations to prevent hanging
- Improved error handling with better error messages
- Added operation success logging for better debugging

### 3. Created Health Check Tools
- `redis-health-check.js`: Comprehensive Redis connection testing
- `ResilientRedisOps.js`: Wrapper for timeout-safe Redis operations

### 4. Updated .env
- Enabled TLS for Redis connection (`REDIS_TLS=true`)

## Timeout Solutions:

### Problem:
```
Error: Command timed out
```

### Solution:
1. **Increased Command Timeouts**: Set to 15 seconds for cloud latency
2. **Added Operation Timeouts**: Each Redis call now has a 10-second race condition timeout
3. **Better TLS Configuration**: Added `rejectUnauthorized: false` for cloud certificates
4. **Connection Optimization**: Enabled keepAlive and forced IPv4

## Deployment Instructions for Render:

### Step 1: Environment Variables
```
NODE_ENV=production
PORT=10000
REDIS_URL=redis://default:ASwVAAIjcDFkMTFmNDNkZDA0OGE0ZjFiOTRjZDM0Zjc5OGExMjAyNHAxMA@precise-aardvark-11285.upstash.io:6379
REDIS_TLS=true
```

### Step 2: Test Redis Connection
```bash
cd backend/nodejs
node redis-health-check.js
```

### Step 3: Deploy to Render
1. Push changes to Git repository
2. Deploy on Render
3. Monitor logs for connection success

## Expected Log Output:
```
✅ Redis connected successfully
✅ Redis ready for commands
🎯 Redis PING successful
✅ OTP stored successfully for key: user@example.com
```

## Troubleshooting Timeouts:

1. **Check Redis Instance**: Ensure Upstash Redis is responsive
2. **Network Latency**: Monitor connection times in logs
3. **TLS Issues**: Verify TLS configuration is working
4. **Resource Limits**: Check if Render has sufficient resources

## Performance Optimizations:

- **Connection Pooling**: Reuse connections across requests
- **Timeout Management**: Prevent hanging operations
- **Error Recovery**: Graceful handling of connection failures
- **Health Monitoring**: Automatic connection status checking

## Testing Commands:

```bash
# Test basic Redis connectivity
node redis-health-check.js

# Test with specific timeout
node -e "
const redis = require('./src/Redis/Config/RedisConfig');
redis.ping().then(() => console.log('SUCCESS')).catch(console.error);
"
```
