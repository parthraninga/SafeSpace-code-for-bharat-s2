const jwtUtils = require("../Utils/JwtUtil");
const UserModel = require("../Model/UserModel")

const validateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let accessToken = null;

    // Check for token in Authorization header first (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
    }
    // If no Bearer token, check for token in HttpOnly cookies
    else if (req.cookies && req.cookies.accessToken) {
        accessToken = req.cookies.accessToken;
    }

    if (accessToken) {
        try {
            // 1. First check the accessToken is Blacklisted[logout] or not
            if (jwtUtils.isTokenBlacklisted(accessToken)) {
                return res.status(401).json({
                    message: "Unauthorized access. Token has been revoked.",
                    code: "TOKEN_REVOKED"
                });
            }

            // 2. Verify the accessToken
            const user = jwtUtils.verifyAccessToken(accessToken); // {userId, iat, exp}
            console.log("Authenticated User [AuthMiddleware]: ", user);

            // 3. Authorization logic can be added here if needed
            // For Example, Only allow access to certain roles
            const foundUser = await UserModel.findById(user.userId);
            console.log("Found User: ", foundUser);
            console.log("User Role: ", foundUser?.role);
            console.log("User RefreshToken exists: ", !!foundUser?.refreshToken);
            
            // Handle both string roles and ObjectId roles
            let userRole = null;
            if (foundUser?.role) {
                if (typeof foundUser.role === 'string') {
                    userRole = foundUser.role.toUpperCase();
                } else if (foundUser.role.name) {
                    userRole = foundUser.role.name.toUpperCase();
                } else {
                    // If role is ObjectId but not populated, populate it
                    const populatedUser = await UserModel.findById(user.userId).populate("role", "name");
                    userRole = populatedUser?.role?.name?.toUpperCase();
                }
            }
            
            console.log("Resolved role name: ", userRole);
            
            if(foundUser && foundUser.refreshToken && (userRole === "ADMIN" || userRole === "USER")) {
                req.user = foundUser; // Attach user to request object for further use
                next();
            } else if (!foundUser) {
                return res.status(401).json({
                    message: "Unauthorized access. User not found.",
                    code: "USER_NOT_FOUND"
                });
            } else if (foundUser.refreshToken === null || foundUser.refreshToken === undefined) {
                return res.status(401).json({
                    message: "Unauthorized access. User has no refresh token.",
                    code: "NO_REFRESH_TOKEN_IN_DB"
                });
            } else if (!userRole || (userRole !== "ADMIN" && userRole !== "USER")) {
                return res.status(403).json({
                    message: "Forbidden access. Invalid user role.",
                    code: "INVALID_ROLE",
                    debug: {
                        hasRole: !!foundUser.role,
                        roleValue: foundUser.role,
                        resolvedRole: userRole
                    }
                }); 
            }
            else {
                return res.status(403).json({
                    message: "Forbidden access. You do not have the required permissions.",
                    code: "FORBIDDEN"
                }); 
            }

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Access token expired. Please refresh your token.",
                    code: "TOKEN_EXPIRED"
                });
            } else {
                return res.status(401).json({
                    message: "Unauthorized access. Invalid token.",
                    error: error.message
                });
            }
        }
    } else {
        return res.status(401).json({
            message: "Unauthorized access. No token provided.",
        });
    }
};


module.exports = {
    validateToken
}
