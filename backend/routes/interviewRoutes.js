const express = require('express');
const { interviewChat } = require('../services/aiService');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, jobTitle, candidateName } = req.body;
    const reply = await interviewChat(messages, jobTitle, candidateName);
    res.json({ reply });
  } catch (error) {
    console.error('Interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;