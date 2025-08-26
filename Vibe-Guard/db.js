const mongoose = require("mongoose");

const connectdb = async () => {
    const connectionString = process.env.MONGO_URI; // use env variable

    try {
        await mongoose.connect(connectionString);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

module.exports = connectdb;
