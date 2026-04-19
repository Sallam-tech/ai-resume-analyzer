const express = require('express');
const { analyzeResume } = require('../services/aiService');

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim() === '') {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    if (resumeText.length < 50) {
      return res.status(400).json({ error: 'Resume text is too short' });
    }
    const result = await analyzeResume(resumeText);
    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to analyze resume.' });
  }
});

module.exports = router;