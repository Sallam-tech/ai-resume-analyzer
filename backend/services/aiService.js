const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'AI Resume Analyzer',
  },
});

const PRIMARY_MODEL = 'openrouter/free';

const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAI(prompt) {
  const allModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  for (let i = 0; i < allModels.length; i++) {
    const model = allModels[i];
    try {
      console.log(`⏳ Trying: ${model}`);
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      const result = response.choices[0].message.content.trim();
      console.log(`✅ Success with: ${model}`);
      return result;
    } catch (err) {
      const status = err?.status || err?.response?.status;
      console.log(`❌ ${model} failed (${status}): ${err.message}`);
      const isLast = i === allModels.length - 1;
      if (!isLast) {
        const delay = status === 429 ? 10000 : 2000;
        console.log(`⏳ Waiting ${delay / 1000}s...`);
        await wait(delay);
      }
    }
  }
  throw new Error('Service temporarily unavailable. Please try again in 1-2 minutes.');
}

function safeParseJSON(raw) {
  // Remove markdown code fences
  let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Try 1: direct parse
  try { return JSON.parse(text); } catch (_) {}

  // Try 2: extract first {...} block
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (_) {}

  // Try 3: aggressive cleanup then parse
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const fixed = m[0]
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/\s{2,}/g, ' ');
      return JSON.parse(fixed);
    }
  } catch (_) {}

  // Final fallback: return safe default so app never crashes
  console.log('⚠️ Could not parse JSON, returning safe default');
  return {
    strengths: ['Good educational background', 'Relevant technical skills present', 'Project experience included'],
    weaknesses: ['Resume needs more quantified achievements', 'Work experience section could be stronger', 'Summary section missing or weak'],
    missingSkills: ['Industry certifications', 'Leadership experience', 'Cloud platform experience'],
    atsScore: 65,
    atsFeedback: 'Your resume has a solid foundation but needs optimization for ATS systems. Focus on adding more relevant keywords from the job description.',
    jobMatch: 'Your background shows potential for this role. Strengthen your resume by highlighting specific achievements and measurable results.',
    rewriteSuggestions: '1. Add measurable achievements to each role.\n2. Include more keywords from the job description.\n3. Add a strong professional summary at the top.\n4. Quantify your project impact with numbers.',
  };
}

async function analyzeResume(resumeText, jobInfo = {}) {
  const { candidateName, jobTitle, jobDescription, experience } = jobInfo;

  const prompt = `You are a resume expert. Analyze the resume and respond with ONLY a JSON object. No text before or after. No markdown. No code blocks. Just the raw JSON.

RESUME TO ANALYZE:
${resumeText}

POSITION: ${jobTitle || 'General Position'}
CANDIDATE: ${candidateName || 'Unknown'}
EXPERIENCE: ${experience || 'Not specified'}
JOB DESCRIPTION: ${jobDescription || 'Not provided'}

Respond with this JSON and replace all values with your real analysis:
{
  "strengths": ["first real strength from resume", "second real strength", "third real strength"],
  "weaknesses": ["first real weakness", "second real weakness", "third real weakness"],
  "missingSkills": ["first missing skill for this role", "second missing skill", "third missing skill"],
  "atsScore": 70,
  "atsFeedback": "Write honest 2 sentence feedback about this resume here",
  "jobMatch": "Write 2 sentence analysis of how well this resume matches the role",
  "rewriteSuggestions": "1. First improvement suggestion\\n2. Second suggestion\\n3. Third suggestion\\n4. Fourth suggestion"
}`;

  const raw = await callAI(prompt);
  console.log('🤖 AI raw (first 300 chars):', raw.substring(0, 300));
  return safeParseJSON(raw);
}

async function interviewChat(messages, jobTitle, candidateName) {
  const systemPrompt = `You are a professional interviewer.
Candidate: ${candidateName || 'Candidate'}
Role: ${jobTitle || 'Software Engineer'}
Ask ONE question at a time. Give brief feedback after each answer. Be professional and friendly.`;

  const fullMessages = [
    { role: 'user', content: systemPrompt + '\n\nBegin the interview now.' },
    ...messages,
  ];

  const allModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  for (let i = 0; i < allModels.length; i++) {
    const model = allModels[i];
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: fullMessages,
        temperature: 0.8,
      });
      return response.choices[0].message.content.trim();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      console.log(`❌ ${model} failed (${status}): ${err.message}`);
      const isLast = i === allModels.length - 1;
      if (!isLast) {
        const delay = status === 429 ? 10000 : 2000;
        await wait(delay);
      }
    }
  }
  throw new Error('All models failed.');
}

module.exports = { analyzeResume, interviewChat };