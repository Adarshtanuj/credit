const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🔹 Register user (must come first)
router.post('/profile', async (req, res) => {
  const { name, email, role, referredBy } = req.body;

  try {
    const user = new User({
      name,
      email,
      role,
      credits: 10,
      referredBy: referredBy || null
    });

    await user.save();

    user.referralCode = `REF${user._id.toString().slice(-6)}`;
    await user.save();

    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });

      if (referrer) {
        referrer.credits += 5;
        referrer.usedCredits.push({
          action: "Referral bonus for inviting a user",
          type: "credit",
          category: "referral",
          timestamp: new Date()
        });
        await referrer.save();

        user.credits += 5;
        user.usedCredits.push({
          action: "Referral bonus for signing up",
          type: "credit",
          category: "referral",
          timestamp: new Date()
        });
        await user.save();
      }
    }

    res.status(201).json({
      message: "Profile created",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        referralCode: user.referralCode
      }
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ Add credits to a user (buy credit API)
router.post('/add-credits/:id', async (req, res) => {
  const userId = req.params.id.trim();
  const { credits } = req.body;

  console.log("Received credits value:", credits);


  if (!credits || credits <= 0) {
    return res.status(400).json({ message: "Invalid credit amount" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.credits += credits;
    user.usedCredits.push({
      action: `Added ${credits} credits (buy)`,
      timestamp: new Date()
    });

    await user.save();
    res.json({ message: `${credits} credits added`, totalCredits: user.credits });
  } catch (err) {
    res.status(400).json({ error: "Invalid user ID or server error" });
  }
});

// 🔹 Referral Dashboard
router.get('/referral-dashboard/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.referralCode) {
      return res.status(404).json({ message: 'User or referral code not found' });
    }

    const referredUsers = await User.find({ referredBy: user.referralCode });

    const referralCredits = user.usedCredits.filter(entry =>
      entry.action.includes('Referral bonus')
    ).length * 5;

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
      joinedOn: user._id.getTimestamp(),

      referralCode: user.referralCode,
      referralLink: `https://seekshak.com/signup?ref=${user.referralCode}`,
      totalReferred: referredUsers.length,
      referralCredits,

      referredUsers: referredUsers.map(u => ({
        name: u.name,
        email: u.email,
        joinedOn: u._id.getTimestamp()
      }))
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
});

router.get('/referral-whatsapp/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.referralCode) {
      return res.status(404).json({ message: 'User or referral code not found' });
    }

    const referralLink = `https://seekshak.com/signup?ref=${user.referralCode}`;
    const message = `Hey! Join Seekshak and get free credits using my referral link: ${referralLink}`;
    const encoded = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/?text=${encoded}`;

    res.json({ whatsappLink });
  } catch (err) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});



// deduction 
router.post('/deduct/:id', async (req, res) => {
  const userId = req.params.id.trim();
  const { amount, category } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const deductionAmount = amount && amount > 0 ? amount : 1; // default to 1
    const creditCategory = category || "general";

    if (user.credits < deductionAmount) {
      return res.status(400).json({ message: "Not enough credits" });
    }

    // 🔻 Deduct credits
    user.credits -= deductionAmount;

    // 🧾 Log the transaction
    user.usedCredits.push({
      action: `Deducted ${deductionAmount} credit(s) for ${creditCategory}`,
      type: "debit",
      category: creditCategory,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      message: `Deducted ${deductionAmount} credit(s)`,
      creditsLeft: user.credits
    });

  } catch (err) {
    res.status(400).json({ error: "Invalid user ID or server error" });
  }
});
 

// 🔹 Credit & transaction history

router.get('/credit-history/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { category } = req.query;

    let filteredHistory = user.usedCredits;

    // 🔍 Apply category filter if provided
    if (category) {
      filteredHistory = filteredHistory.filter(entry => entry.category === category);
    }

    const transactions = filteredHistory.map(entry => ({
      action: entry.action,
      type: entry.type || "unknown",
      category: entry.category || "general",
      timestamp: entry.timestamp
    }));

    res.json({
      totalCredits: user.credits,
      filteredBy: category || "all",
      transactions: transactions.reverse()
    });

  } catch (err) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});



// 🔹 Get user (MUST be the last route)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
});
 
module.exports = router;

