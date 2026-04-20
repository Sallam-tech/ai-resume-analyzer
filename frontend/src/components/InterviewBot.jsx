import { useState, useRef, useEffect } from 'react'

export default function InterviewBot({ jobTitle, candidateName }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startInterview = async () => {
    setStarted(true)
    setLoading(true)
    try {
      const res = await fetch('https://resume-analyzer-abdulsalam.vercel.app/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          jobTitle: jobTitle || 'Software Engineer',
          candidateName: candidateName || 'Candidate',
        }),
      })
      const data = await res.json()
      setMessages([{ role: 'assistant', content: data.reply }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Connection error. Make sure backend is running.' }])
    }
    setLoading(false)
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://resume-analyzer-abdulsalam.vercel.app/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          jobTitle: jobTitle || 'Software Engineer',
          candidateName: candidateName || 'Candidate',
        }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Error. Try again.' }])
    }
    setLoading(false)
  }

  const reset = () => { setMessages([]); setStarted(false); setInput('') }

  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        position: 'fixed', bottom: '30px', right: '30px',
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#2563eb', color: 'white', fontSize: '1.8rem',
        border: 'none', cursor: 'pointer', zIndex: 9999,
        boxShadow: '0 4px 20px rgba(37,99,235,0.6)'
      }}>
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '30px',
          width: '370px', height: '520px', background: '#111827',
          border: '1px solid #1f2937', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', zIndex: 9998,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden'
        }}>
          <div style={{
            background: '#1f2937', padding: '14px 16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>🤖</span>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Interview Bot</p>
                <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>{jobTitle || 'General'} Interview</p>
              </div>
            </div>
            <button onClick={reset} style={{
              background: 'none', border: 'none', color: '#6b7280',
              cursor: 'pointer', fontSize: '1rem'
            }}>🔄</button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {!started ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '12px' }}>
                <span style={{ fontSize: '3rem' }}>🤖</span>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Ready for Interview?</p>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>
                  {candidateName ? `Hi ${candidateName}!` : 'Hello!'} I'll interview you for <strong style={{ color: 'white' }}>{jobTitle || 'Software Engineer'}</strong>
                </p>
                <button onClick={startInterview} style={{
                  background: '#2563eb', color: 'white', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem', marginTop: '8px'
                }}>🚀 Start Interview</button>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '8px',
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{m.role === 'user' ? '👤' : '🤖'}</span>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: '14px',
                      fontSize: '0.85rem', lineHeight: '1.5',
                      background: m.role === 'user' ? '#2563eb' : '#1f2937',
                      color: 'white',
                      borderBottomRightRadius: m.role === 'user' ? '4px' : '14px',
                      borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '14px',
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1.2rem' }}>🤖</span>
                    <div style={{
                      background: '#1f2937', padding: '14px', borderRadius: '14px',
                      borderBottomLeftRadius: '4px', display: 'flex', gap: '4px'
                    }}>
                      {[0,1,2].map(n => (
                        <span key={n} style={{
                          width: '6px', height: '6px', background: '#6b7280',
                          borderRadius: '50%', display: 'inline-block',
                          animation: 'bounce 1s infinite',
                          animationDelay: `${n * 0.2}s`
                        }}/>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {started && (
            <div style={{
              padding: '12px', borderTop: '1px solid #1f2937',
              display: 'flex', gap: '8px', alignItems: 'flex-end'
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Type your answer... (Enter to send)"
                disabled={loading}
                rows={2}
                style={{
                  flex: 1, background: '#1f2937', color: 'white',
                  border: '1px solid #374151', borderRadius: '10px',
                  padding: '10px 12px', fontSize: '0.85rem',
                  resize: 'none', outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button onClick={send} disabled={loading || !input.trim()} style={{
                background: '#2563eb', color: 'white', border: 'none',
                width: '40px', height: '40px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '1rem',
                opacity: loading || !input.trim() ? 0.5 : 1
              }}>➤</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}