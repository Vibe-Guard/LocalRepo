const mongoose = require("mongoose");

const connectdb = async () =>{

    const connectionString = "mongodb+srv://eeshaansar:vibeguard@vg.h1qaw.mongodb.net/?retryWrites=true&w=majority&appName=VG";

    try{
        await mongoose.connect(connectionString);
        console.log("Connect to MongoDb");
    }
    catch(error){
        console.error("MongoDB connection error:", error.message);
        process.exit(1); 
    }
};

module.exports = connectdb;