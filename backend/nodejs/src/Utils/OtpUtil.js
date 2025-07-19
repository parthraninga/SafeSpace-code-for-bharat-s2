const redisClient = require("../Redis/Config/RedisConfig")

// Generate 6-Digit OTP 
const generateOTP = ()=> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
}

// Store OTP in Redis with a TTL(Time to live) of 5 minutes
const storeOTP = async (key, otp) => {
    try {
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis SET timeout')), 10000)
        );
        
        const operation = redisClient.set(`otp:${otp}`, otp, 'EX', 300); // 300 seconds = 5 minutes
        await Promise.race([operation, timeout]);
        
        console.log(`✅ OTP stored successfully for key: ${key}`);
        return true;
    } catch (error) {
        console.error("OtpUtil :: Error storing OTP in Redis:", error.message);
        return false;
    }
}

// Verify OTP from Redis
const verifyOTP = async (key, otp) => { // key - email or mobile
    try {
        // Add timeout to prevent hanging
        const getTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis GET timeout')), 10000)
        );
        
        const getOperation = redisClient.get(`otp:${otp}`);
        const storedOTP = await Promise.race([getOperation, getTimeout]);

        if (!storedOTP) {
            return {
                valid: false,
                message: "OTP expired or not found."
            }
        }

        if (storedOTP === otp) {
            // delete the OTP (means OTP expired) after successful verification
            try {
                const delTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Redis DEL timeout')), 10000)
                );
                
                const delOperation = redisClient.del(`otp:${otp}`);
                await Promise.race([delOperation, delTimeout]);
                console.log(`✅ OTP deleted successfully after verification`);
            } catch (delError) {
                console.warn("Warning: Failed to delete OTP after verification:", delError.message);
                // Continue anyway since verification was successful
            }
            
            return {
                valid: true,
                message: "OTP verified successfully."
            }
        } else {
            return {
                valid: false,
                message: "Invalid OTP."
            }
        }
    } catch (error ){
        console.error("OtpUtil :: Error verifying OTP in Redis:", error.message);
        return {
            valid: false,
            message: "Error verifying OTP. Please try again."
        };
    }
}

module.exports = {
    generateOTP, 
    storeOTP, 
    verifyOTP
}