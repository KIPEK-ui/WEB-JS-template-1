const mongoose = require("../db");
const { Schema } = mongoose;
const { User } = require("../models/user"); // ✅ Import User model

const notificationSchema = new Schema({
    message: String,
    icon: String,
    createdByRole: String, // Role of the user who created the notification
    visibleToRoles: [String], // Roles that should see this notification
    severity: { type: String, enum: ["Info", "Warning", "Alert"], default: "Info" }, // Severity level of the notification
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

// 🚀 Insert New Notification
const insertNotification = async(notificationData) => {
    try {
        const notification = new Notification({
            ...notificationData,
            severity: notificationData.severity || "Info",
        });
        await notification.save();
        return notification;
    } catch (err) {
        console.error("❌ Error inserting notification:", err);
        throw err;
    }
};

// 🚀 Fetch Notifications by User ID (Auto-fetches Role)
const getNotificationsByUserId = async(userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const role = user.role;
        const notifications = await Notification.find({
            $or: [{ visibleToRoles: role }, { visibleToRoles: "All" }]
        }).sort({ createdAt: -1 }).limit(10);

        const totalCount = await Notification.countDocuments({
            $or: [{ visibleToRoles: role }, { visibleToRoles: "All" }]
        });

        return { notifications, totalCount };
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        throw error;
    }
};

module.exports = { Notification, insertNotification, getNotificationsByUserId };