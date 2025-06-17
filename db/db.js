const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const MONGOURL = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(MONGOURL, {})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

module.exports = mongoose; // Export mongoose for use in models