import './App.css'
import ResumeAnalyzer from './components/ResumeAnalyzer'
import InterviewBot from './components/InterviewBot'
import { useState } from 'react'

function App() {
  const [jobTitle, setJobTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')

  return (
    <div>
      <ResumeAnalyzer
        onJobTitle={setJobTitle}
        onCandidateName={setCandidateName}
      />
      <InterviewBot
        jobTitle={jobTitle}
        candidateName={candidateName}
      />
    </div>
  )
}

export default App