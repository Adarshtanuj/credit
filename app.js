
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user"); // ✅ Make sure this path is correct

const app = express();

// Middleware to parse JSON
app.use(express.json());

// ✅ MongoDB Atlas connection
mongoose.connect("mongodb+srv://adarshtanuj67:LAwl8onWww4dtjaY@cluster0.ahcr6zh.mongodb.net/creditSystem?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes
app.use("/api/users", userRoutes);

const paymentRoutes = require("./routes/payment");
app.use("/api/payment", paymentRoutes);


// ✅ Default route (optional)
app.get("/", (req, res) => {
  res.send("Welcome to Seekshak Credit System API");
});


// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
