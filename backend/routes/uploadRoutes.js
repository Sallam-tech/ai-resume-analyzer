const express = require('express');
const multer = require('multer');
const fs = require('fs');
const PDFParser = require('pdf2json');
const { analyzeResume } = require('../services/aiService');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files allowed'), false);
};

const upload = multer({ storage, fileFilter });

function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on('pdfParser_dataError', (err) => reject(err));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const text = pdfData.Pages.map(page =>
          page.Texts.map(t =>
            decodeURIComponent(t.R.map(r => r.T).join(' '))
          ).join(' ')
        ).join('\n');
        resolve(text);
      } catch (e) { reject(e); }
    });
    pdfParser.loadPDF(filePath);
  });
}

router.post('/pdf', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const resumeText = await extractTextFromPDF(req.file.path);
    fs.unlinkSync(req.file.path);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'PDF has too little text.' });
    }

    const jobInfo = {
      candidateName: req.body.candidateName || '',
      jobTitle: req.body.jobTitle || '',
      jobDescription: req.body.jobDescription || '',
      experience: req.body.experience || '',
    };

    const result = await analyzeResume(resumeText, jobInfo);
    res.json(result);

  } catch (error) {
    console.error('PDF error:', error.message);
    res.status(500).json({ error: 'Failed to process PDF: ' + error.message });
  }
});

module.exports = router;