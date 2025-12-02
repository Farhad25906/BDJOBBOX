const mongoose = require("mongoose");

// const mongo_url = process.env.MONGO_CONN;

mongoose
  .connect(process.env.MONGO_CONN, {
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000, 
  })
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });
