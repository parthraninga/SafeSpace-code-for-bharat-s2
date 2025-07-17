const mongoose = require("mongoose");
const Schema = mongoose.Schema; 


const userSchema = new Schema({
    //  Fields 

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, 
    mobile: {
        type: String, 
        unique: true,
        sparse: true // Allows NULL values (not all users may have a mobile number)
    }, 
    isVerified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        sparse: true
    },
    age: {
        type: Number,
        required: function() {
            return this.isCompleteProfile === true;
        }
    }, 
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    }, 
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    hobbies: [String],
    bio: {
        type: String,
        maxlength: 500
    },
    location: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },  
    role: { // works like roleId - can be string for SafeSpace
        type: Schema.Types.Mixed, // Allow both ObjectId and String
        default: "user"
    }, 
    refreshToken: {
        type: String,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpiry: {
        type: Date,
        default: null
    }, 
    // SafeSpace specific fields
    savedThreats: [
        {
            id: {
                type: String, 
                required: true
            },
            title: {
                type: String,
                required: true,
                default: "Unknown Threat"
            },
            description: {
                type: String,
                default: ""
            },
            category: {
                type: String,
                required: true,
                default: "general"
            },
            level: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            },
            location: {
                type: String,
                default: ""
            },
            source: {
                type: String,
                default: "Unknown"
            },
            confidence: {
                type: Number,
                default: 0
            },
            affectedPeople: {
                type: Number,
                default: 0
            },
            coordinates: {
                type: [Number], // [lat, lng]
                default: [0, 0]
            },
            aiAdvice: [{
                type: String
            }],
            savedAt: {
                type: Date,
                default: Date.now
            },
            originalTimestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    notificationSettings: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        threats: {
            type: Boolean,
            default: true
        },
        safety: {
            type: Boolean,
            default: true
        }
    },
    preferredCities: [String],
    isCompleteProfile: {
        type: Boolean,
        default: false
    }, 
    profilePic: {
        url: String, 
        cloudinaryId: String, // public_Id from cloudinary
        uploadAt: {
            type: Date,
            default: Date.now
        }
    }, 
    // for multiple file uploads
    gallery: [
        {
            url: String, 
            cloudinaryId: String, 
            uploadAt: {
                type: Date, 
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
}); 

module.exports = mongoose.model("users", userSchema);