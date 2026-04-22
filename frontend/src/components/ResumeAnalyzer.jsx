import { useState, useRef } from 'react'
import ResultCard from './ResultCard'
import ScoreCircle from './ScoreCircle'

const DEMO_DATA = {
  candidateName: 'AbdulSalam',
  jobTitle: 'Software Engineer',
  experience: '1',
  result: {
    atsScore: 78,
    atsFeedback: 'Your resume has strong technical skills and relevant project experience. To improve ATS compatibility, add more keywords from job descriptions and quantify your achievements with numbers.',
    strengths: [
      'Strong foundation in Python and JavaScript programming',
      'Hands-on project experience with AI and Machine Learning',
      'Good academic background in Computer Science',
    ],
    weaknesses: [
      'Lacks quantified achievements and measurable results',
      'Work experience section needs more industry exposure',
      'Professional summary is missing from the resume',
    ],
    missingSkills: [
      'Cloud platforms experience (AWS or Azure)',
      'Docker and containerization knowledge',
      'CI/CD pipeline experience',
    ],
    jobMatch: 'The candidate shows solid foundational skills for a Software Engineer role with good programming knowledge and project experience. To be more competitive, focus on gaining industry experience and adding cloud and DevOps skills.',
    rewriteSuggestions: '1. Add a strong professional summary at the top of your resume.\n2. Quantify achievements e.g. "Built a chatbot that improved response time by 40%".\n3. Add cloud platform certifications like AWS Cloud Practitioner.\n4. Include GitHub profile link with active repositories.',
  }
}

export default function ResumeAnalyzer({ onJobTitle, onCandidateName }) {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please select a valid PDF file.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped)
      setError('')
    } else {
      setError('Please drop a valid PDF file.')
    }
  }

  const handleAnalyze = async () => {
    if (!candidateName.trim()) { setError('Please enter candidate name.'); return }
    if (!jobTitle.trim()) { setError('Please enter a job title.'); return }
    if (!file) { setError('Please upload a PDF resume.'); return }

    setLoading(true)
    setLoadingStep(1)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('candidateName', candidateName)
      formData.append('jobTitle', jobTitle)
      formData.append('jobDescription', jobDescription)
      formData.append('experience', experience)

      setLoadingStep(2)
      const response = await fetch('http://localhost:5000/api/upload/pdf', {
        method: 'POST',
        body: formData,
      })
      setLoadingStep(3)

      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Something went wrong.'); return }
      setLoadingStep(4)
      setResult(data)
      setActiveTab('overview')
    } catch (err) {
      console.error(err)
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
      setLoadingStep(0)
    }
  }

  const handleDemo = () => {
    setIsDemoMode(true)
    setLoading(true)
    setLoadingStep(1)
    setError('')
    setResult(null)
    setCandidateName(DEMO_DATA.candidateName)
    setJobTitle(DEMO_DATA.jobTitle)
    setExperience(DEMO_DATA.experience)
    onCandidateName && onCandidateName(DEMO_DATA.candidateName)
    onJobTitle && onJobTitle(DEMO_DATA.jobTitle)

    setTimeout(() => setLoadingStep(2), 800)
    setTimeout(() => setLoadingStep(3), 1600)
    setTimeout(() => setLoadingStep(4), 2400)
    setTimeout(() => {
      setResult(DEMO_DATA.result)
      setActiveTab('overview')
      setLoading(false)
      setLoadingStep(0)
    }, 3200)
  }

  const handleCopy = () => {
    if (result?.rewriteSuggestions) {
      navigator.clipboard.writeText(result.rewriteSuggestions)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getScoreBreakdown = (result) => {
    if (!result) return []
    const strengths = result.strengths?.length || 0
    const weaknesses = result.weaknesses?.length || 0
    const missingSkills = result.missingSkills?.length || 0
    const total = strengths + weaknesses + missingSkills || 1

    const skillsScore = Math.round(((strengths / total) * 0.4 + (missingSkills === 0 ? 0.1 : 0)) * 100)
    const experienceScore = Math.round((experience ? Math.min(parseInt(experience) * 8, 25) : 15))
    const keywordsScore = Math.round((result.atsScore || 0) * 0.3)
    const formatScore = Math.round((weaknesses === 0 ? 20 : Math.max(20 - weaknesses * 3, 8)))

    return [
      { label: 'Skills Match', score: Math.min(skillsScore, 25), max: 25, color: '#4ade80' },
      { label: 'Experience', score: Math.min(experienceScore, 25), max: 25, color: '#60a5fa' },
      { label: 'Keywords', score: Math.min(keywordsScore, 30), max: 30, color: '#f59e0b' },
      { label: 'Format & Structure', score: Math.min(formatScore, 20), max: 20, color: '#a78bfa' },
    ]
  }

  const getSuggestedRoles = (result) => {
    if (!result) return []
    const text = [
      ...(result.strengths || []),
      ...(result.missingSkills || []),
      result.jobMatch || ''
    ].join(' ').toLowerCase()

    const roles = []
    if (text.includes('react') || text.includes('frontend') || text.includes('javascript')) roles.push({ title: 'Frontend Developer', match: '92%', icon: '💻' })
    if (text.includes('python') || text.includes('data') || text.includes('ml') || text.includes('ai')) roles.push({ title: 'Data Scientist', match: '88%', icon: '📊' })
    if (text.includes('node') || text.includes('backend') || text.includes('api') || text.includes('express')) roles.push({ title: 'Backend Developer', match: '85%', icon: '⚙️' })
    if (text.includes('cloud') || text.includes('aws') || text.includes('devops') || text.includes('docker')) roles.push({ title: 'DevOps Engineer', match: '80%', icon: '☁️' })
    if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('figma')) roles.push({ title: 'UI/UX Designer', match: '83%', icon: '🎨' })
    if (text.includes('machine learning') || text.includes('deep learning') || text.includes('tensorflow')) roles.push({ title: 'ML Engineer', match: '87%', icon: '🤖' })
    if (text.includes('java') || text.includes('spring') || text.includes('microservice')) roles.push({ title: 'Java Developer', match: '82%', icon: '☕' })
    if (text.includes('mobile') || text.includes('android') || text.includes('ios') || text.includes('flutter')) roles.push({ title: 'Mobile Developer', match: '84%', icon: '📱' })

    if (roles.length < 3) {
      roles.push({ title: 'Full Stack Developer', match: '78%', icon: '🌐' })
      roles.push({ title: 'Software Engineer', match: '75%', icon: '👨‍💻' })
      roles.push({ title: 'Technical Lead', match: '70%', icon: '🏆' })
    }

    return roles.slice(0, 5)
  }

  const resumeTips = [
    { icon: '📏', title: 'Keep it 1-2 pages', desc: 'Recruiters spend only 6 seconds on a resume. Be concise and relevant.' },
    { icon: '🎯', title: 'Tailor for each job', desc: 'Customize your resume keywords to match each job description.' },
    { icon: '📊', title: 'Use numbers & metrics', desc: 'Instead of "improved sales", write "increased sales by 35% in Q2 2023".' },
    { icon: '🔑', title: 'Add ATS keywords', desc: 'Include exact keywords from the job posting to pass automated screening.' },
    { icon: '✅', title: 'Use action verbs', desc: 'Start bullet points with strong verbs: Built, Designed, Led, Improved, Created.' },
    { icon: '📧', title: 'Professional email', desc: 'Use a simple professional email. Avoid nicknames or numbers.' },
    { icon: '🔗', title: 'Add LinkedIn & GitHub', desc: 'Include links to your LinkedIn profile and GitHub for tech roles.' },
    { icon: '🚫', title: 'No photos or age', desc: 'Never include a photo, age, or marital status — it can cause bias.' },
  ]

  const scoreBreakdown = getScoreBreakdown(result)
  const suggestedRoles = getSuggestedRoles(result)

  return (
    <div className="container">
      <div className="header">
        <h1>AI Resume Analyzer</h1>
        <p>Fill in the details and upload your resume for AI-powered feedback</p>
      </div>

      {!result && !loading && (
        <div className="input-card">
          <div className="form-group">
            <label>Candidate Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={candidateName}
              onChange={(e) => {
                setCandidateName(e.target.value)
                onCandidateName && onCandidateName(e.target.value)
              }}
            />
          </div>

          <div className="form-group">
            <label>Job Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Frontend Developer, Data Scientist..."
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value)
                onJobTitle && onJobTitle(e.target.value)
              }}
            />
          </div>

          <div className="form-group">
            <label>Job Description <span className="optional">(optional)</span></label>
            <textarea
              className="form-textarea"
              placeholder="Write a clear & concise job description with responsibilities & expectations..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Years of Experience <span className="optional">(optional)</span></label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter number of years"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              min="0"
              max="50"
            />
          </div>

          <div className="form-group">
            <label>Upload Resume (PDF) *</label>
            <div
              className={`dropzone ${file ? 'has-file' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current.click()}
            >
              {file ? (
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button className="remove-btn" onClick={(e) => { e.stopPropagation(); setFile(null) }}>✕ Remove</button>
                </div>
              ) : (
                <div className="drop-content">
                  <span className="upload-icon">📂</span>
                  <p className="drop-title">Click to upload or drag and drop</p>
                  <p className="drop-sub">PDF only (max. 10MB)</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {error && <p className="error-text">⚠️ {error}</p>}

          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
              Analyze Resume
          </button>

          <button className="demo-btn" onClick={handleDemo} disabled={loading}>
            🎮 Demo Mode — See Example Results
          </button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="loading-steps">
            <div className="loading-title">
              {isDemoMode ? '🎮 Loading Demo...' : '⚡ Analyzing Your Resume'}
            </div>
            <div className={`loading-step ${loadingStep >= 1 ? 'active' : ''} ${loadingStep >= 2 ? 'done' : ''}`}>
              {loadingStep >= 2 ? '✅' : '⏳'} Uploading PDF to server...
            </div>
            <div className={`loading-step ${loadingStep >= 2 ? 'active' : 'waiting'} ${loadingStep >= 3 ? 'done' : ''}`}>
              {loadingStep >= 3 ? '✅' : loadingStep >= 2 ? '⏳' : '⬜'} Extracting resume text...
            </div>
            <div className={`loading-step ${loadingStep >= 3 ? 'active' : 'waiting'} ${loadingStep >= 4 ? 'done' : ''}`}>
              {loadingStep >= 4 ? '✅' : loadingStep >= 3 ? '⏳' : '⬜'} AI analyzing your resume...
            </div>
            <div className={`loading-step ${loadingStep >= 4 ? 'active' : 'waiting'}`}>
              {loadingStep >= 4 ? '⏳' : '⬜'} Building your results...
            </div>
          </div>
          <div className="spinner"></div>
        </div>
      )}

      {result && !loading && (
        <div className="results">
          <div className="result-header">
            <h2>📋 Resume Review — {candidateName}</h2>
            <p className="result-sub">Role: <strong>{jobTitle}</strong> {experience && `| ${experience} years experience`}</p>
            {isDemoMode && <p className="demo-badge">🎮 Demo Mode</p>}
            <button className="back-btn" onClick={() => { setResult(null); setFile(null); setIsDemoMode(false) }}>← Analyze Another Resume</button>
          </div>

          <div className="score-card">
            <ScoreCircle score={result.atsScore} />
            <div className="score-info">
              <h2>Your Resume Score</h2>
              <p className="score-feedback">{result.atsFeedback}</p>
            </div>
          </div>

          <div className="breakdown-card">
            <h3>📊 Score Breakdown</h3>
            <div className="breakdown-grid">
              {scoreBreakdown.map((item, i) => (
                <div key={i} className="breakdown-item">
                  <div className="breakdown-top">
                    <span className="breakdown-label">{item.label}</span>
                    <span className="breakdown-score" style={{ color: item.color }}>{item.score}/{item.max}</span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div className="breakdown-bar-fill" style={{ width: `${(item.score / item.max) * 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📋 Overview</button>
            <button className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>🌍 Job Roles</button>
            <button className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`} onClick={() => setActiveTab('tips')}>💡 Resume Tips</button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="cards-grid">
                <ResultCard title="✅ Strengths" items={result.strengths} color="green" />
                <ResultCard title="⚠️ Weaknesses" items={result.weaknesses} color="yellow" />
                <ResultCard title="🎯 Missing Skills" items={result.missingSkills} color="red" />
              </div>
              {result.jobMatch && (
                <div className="job-match-card">
                  <h3>🎯 Job Match Analysis — {jobTitle}</h3>
                  <p>{result.jobMatch}</p>
                </div>
              )}
              {result.rewriteSuggestions && (
                <div className="rewrite-card">
                  <div className="rewrite-header">
                    <h3>✏️ AI Rewrite Suggestions</h3>
                    <button className="copy-btn" onClick={handleCopy}>
                      {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p>{result.rewriteSuggestions}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'roles' && (
            <div className="roles-card">
              <h3>🌍 Other Job Roles That Match Your Resume</h3>
              <p className="roles-sub">Based on your skills and experience, you may also be a great fit for:</p>
              <div className="roles-grid">
                {suggestedRoles.map((role, i) => (
                  <div key={i} className="role-item">
                    <span className="role-icon">{role.icon}</span>
                    <div className="role-info">
                      <span className="role-title">{role.title}</span>
                      <span className="role-match">{role.match} match</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="tips-card">
              <h3>💡 Resume Writing Tips</h3>
              <p className="tips-sub">Follow these best practices to improve your resume score</p>
              <div className="tips-grid">
                {resumeTips.map((tip, i) => (
                  <div key={i} className="tip-item">
                    <span className="tip-icon">{tip.icon}</span>
                    <div className="tip-info">
                      <span className="tip-title">{tip.title}</span>
                      <span className="tip-desc">{tip.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="footer">
        <p className="footer-title">  AI Resume Analyzer</p>
        <p className="footer-sub">Designed & Developed by <span className="footer-name">AbdulSalam</span></p>
        <p className="footer-tech">Built with React • Node.js • OpenRouter AI</p>
      </div>
    </div>
  )
}