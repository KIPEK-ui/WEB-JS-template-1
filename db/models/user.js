const mongoose = require("../db"); // Import the database connection
const bcrypt = require("bcryptjs");
const Joi = require("joi"); // Validation
const { Schema, model } = mongoose;

// Define User schema
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId } },
    googleId: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: false },
    role: { type: String, enum: ["Admin", "User"], required: false },
    profilePic: { type: String }, // NEW: Profile Picture Field
    loggedIn: { type: Boolean, default: false },
    active: { type: Boolean, default: false }, // NEW: Active Status
    lastLoginAt: { type: Date }, // NEW: Last Login Timestamp
}, { timestamps: true });
// Hash password before saving
userSchema.pre("save", async function(next) {
    if (this.password && this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    // If the user's role is Admin, ensure the account is active
    if (this.role === "Admin") {
        this.active = true;
    }
    next();
});
// 🚀 Validation Schema
const userValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional(),
    googleId: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    gender: Joi.string().valid("Male", "Female", "Other").allow(null),
    role: Joi.string().valid("Admin", "Officer", "Citizen").allow(null),
    profilePic: Joi.string().uri().optional(), // ✅ Allow profilePic as a valid URL
    nationalId: Joi.string().optional().allow(null),
    loggedIn: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    lastLoginAt: Joi.date().optional(),
});
// Create User model
const User = model("User", userSchema);
// 🚀 Create New User
const insertUser = async(userData) => {
    try {
        const { error } = userValidationSchema.validate(userData);
        if (error) throw new Error(error.details[0].message);

        const user = new User(userData);
        await user.save();
        return user;
    } catch (err) {
        console.error("❌ Error inserting user:", err);
        throw err;
    }
};
// 🚀 Update User
const updateUser = async(userId, updatedData) => {
    try {
        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });
        if (!user) throw new Error("User not found");
        return user;
    } catch (err) {
        console.error("❌ Error updating user:", err);
        throw err;
    }
};

// 🚀 Delete User
const deleteUser = async(userId) => {
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) throw new Error("User not found");
        return user;
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        throw err;
    }
};
// 🚀 Fetch User by ID
const getUserById = async(userId) => {
    try {
        return await User.findById(userId);
    } catch (err) {
        console.error("❌ Error fetching user:", err);
        throw err;
    }
};

// 🚀 Fetch User by Email
const getUserByEmail = async(email) => {
    try {
        return await User.findOne({ email });
    } catch (err) {
        console.error("❌ Error fetching user:", err);
        throw err;
    }
}; // 🚀 Fetch Users by Role
const getUsersByRole = async(role) => {
    try {
        return await User.find({ role }); // Returns an array of users matching the role
    } catch (err) {
        console.error("❌ Error fetching users by role:", err);
        throw err;
    }
};

// 🚀 NEW: Get total number of system users
const getTotalUsers = async() => {
    try {
        const count = await User.countDocuments({});
        return count;
    } catch (err) {
        console.error("❌ Error counting users:", err);
        throw err;
    }
};
const getTotalUsersByRole = async(role) => {
    try {
        const count = await User.countDocuments({ role });
        return count;
    } catch (err) {
        console.error(`❌ Error counting ${role} users:`, err);
        throw err;
    }
};
module.exports = {
    User,
    insertUser,
    updateUser,
    deleteUser,
    getUserById,
    getUserByEmail,
    getUsersByRole,
    getTotalUsers,
    getTotalUsersByRole,
};