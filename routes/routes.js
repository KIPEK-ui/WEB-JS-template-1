require("dotenv").config();
// ✅ Import necessary modules
const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const path = require("path");
const crypto = require("crypto");
const {
    User,
    insertUser
} = require("../db/models/user"); // ✅ Import User model
const {
    Notification,
    insertNotification
} = require("../db/models/notifications"); // ✅ Import Notification model

// 🚀 Configure JWT Authentication Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(jwtOptions, async(jwtPayload, done) => {
        try {
            const user = await User.findById(jwtPayload.userId);
            if (user) return done(null, user);
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

// 🚀 Serve Dashboard Page
router.get("/dashboard", auth, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard/dashboard.html"));
});

// 🚀 Google Authentication Strategy - Stores user data in cookies
passport.use(
    new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            scope: ["profile", "email", 'https://www.googleapis.com/auth/userinfo.profile'],
        },
        async(accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    const randomPassword = crypto.randomBytes(16).toString("hex");

                    // ✅ Create new user using `insertUser()` function
                    user = await insertUser({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        password: randomPassword, // Temporary password
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        gender: null, // User will complete profile later
                        role: null, // Default role
                        profilePic: profile.photos[0].value || "/images/logo.png" // ✅ Ensure safe profile picture extraction
                    });
                } else {
                    // ✅ Update existing user's profile picture
                    user.profilePic = profile.photos[0].value;
                    user.googleAccessToken = accessToken;
                    user.googleRefreshToken = refreshToken;
                }
                // ✅ Update login activity: mark user as logged in and record current timestamp
                user.loggedIn = true;
                user.lastLoginAt = new Date();

                await user.save();

                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
                return done(null, user);
            } catch (error) {
                console.error("❌ Error during Google authentication:", error);
                return done(error, false);
            }
        }
    )
);
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 🚀 Google Callback - Uses Payload-Based Cookies
router.get("/auth/google/callback", passport.authenticate("google", { session: false }), async(req, res) => {
    const { user, token } = req.user;

    if (!user.gender || !user.role) {
        // ✅ Redirect user to complete profile with `userId`
        res.redirect(`/auth/complete-profile?userId=${user._id.toString()}`);
    } else {
        const visibleToRoles = ["Admin"]; // Modify roles as needed

        // ✅ Insert notification asynchronously (without blocking)
        insertNotification({
            message: `${user.role} ${user.firstName}  logged in successfully.`,
            icon: "fas fa-sign-in-alt",
            createdByRole: user.role,
            visibleToRoles,
            serverity: "Alert" // Optional: Set severity level
        }).catch((error) => console.error("❌ Error inserting notification:", error));
        // ✅ Store essential data in cookies
        res.cookie("token", token, { httpOnly: true, secure: true });
        res.cookie("userId", user._id.toString(), { secure: true });
        res.cookie("firstName", user.firstName, { secure: true });
        res.cookie("lastName", user.lastName, { secure: true });
        res.cookie("email", user.email, { secure: true });
        res.cookie("gender", user.gender, { secure: true });
        res.cookie("role", user.role, { secure: true });
        res.cookie("profilePic", user.profilePic, { secure: true });
        res.cookie("loggedIn", user.loggedIn, { secure: true });

        if (user.lastLoginAt) {
            res.cookie("lastLoginAt", user.lastLoginAt.toISOString(), { secure: true });
        }

        res.redirect(`/dashboard?message=${encodeURIComponent("Authentication successful! Welcome, " + user.firstName)}`);
    }

});
// 🚀 Serve Complete Profile Page
router.get("/auth/complete-profile", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/pages/auth/complete-profile.html"));
});

// 🚀 Handle Profile Completion
router.post("/auth/complete-profile", async(req, res) => {
    try {
        const { userId, gender, role } = req.body;

        if (!userId || userId.length !== 24) {
            return res.status(400).json({ message: "❌ Invalid User ID format." });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "❌ User not found." });

        user.gender = gender;
        user.role = role;
        await user.save();

        const visibleToRoles = ["Admin"]; // Modify roles as needed

        // ✅ Insert notification asynchronously (without blocking)
        insertNotification({
            message: `${user.role} ${user.firstName}  logged in successfully.`,
            icon: "fas fa-sign-in-alt",
            createdByRole: user.role,
            visibleToRoles,
            serverity: "Alert" // Optional: Set severity level
        }).catch((error) => console.error("❌ Error inserting notification:", error));

        // ✅ Generate JWT token and set cookies
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token, { httpOnly: true, secure: true });
        res.cookie("userId", user._id.toString(), { secure: true });
        res.cookie("firstName", user.firstName, { secure: true });
        res.cookie("lastName", user.lastName, { secure: true });
        res.cookie("email", user.email, { secure: true });
        res.cookie("gender", gender, { secure: true });
        res.cookie("role", role, { secure: true });
        res.cookie("profilePic", user.profilePic, { secure: true });
        res.cookie("loggedIn", user.loggedIn, { secure: true });

        if (user.lastLoginAt) {
            res.cookie("lastLoginAt", user.lastLoginAt.toISOString(), { secure: true });
        }

        res.redirect(`/dashboard?message=${encodeURIComponent("Profile completed! Welcome, " + user.firstName)}`);
    } catch (error) {
        console.error("❌ Error completing profile:", error);
        res.status(500).json({ message: "❌ Error completing profile." });
    }
});

// 🚀 Logout - Properly Clears All Cookies
router.post("/logout", (req, res) => {
    const cookiesToClear = ["token", 'email', "userId", "firstName", "lastName", "gender", "role", "profilePic", "totalUsersCookie", "loggedIn", "lastLoginAt"];

    cookiesToClear.forEach((cookie) => res.clearCookie(cookie, { path: "/" }));

    // ✅ Send JSON response first
    res.json({ msg: "Logged out successfully" });

    // Slight delay to prevent execution order issues
});
// 🚀 Protected Route: Fetch Notifications Based on Authenticated User
router.get("/api/notifications", passport.authenticate("jwt", { session: false }), async(req, res) => {
    try {
        const userId = req.user._id;
        const { notifications, totalCount } = await getNotificationsByUserId(userId);
        res.json({ notifications, totalCount });
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

// 🚀 Get User Role from Cookies
router.get("/api/user-role", auth, (req, res) => {
    if (!req.cookies.role) return res.status(401).json({ msg: "Unauthorized" });
    res.json({ role: req.cookies.role });
});


module.exports = router;