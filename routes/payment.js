const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();

// ✅ Replace these with your Razorpay test keys
const razorpay = new Razorpay({
  key_id: "rzp_test_123456789",   // <- use your test key
  key_secret: "your_secret_here"
});

// ✅ Create Order API
router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in paise
    currency: "INR",
    receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order); // return to frontend
  } catch (err) {
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

module.exports = router;
