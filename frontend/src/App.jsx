import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { api, errorMessage, getToken, getSavedUser, saveSession, clearSession } from './api'
import AuthForm from './AuthForm'
import History from './History'
import './App.css'

function App() {
  const [ code, setCode ] = useState(` function sum() {
  return 1 + 1
}`)

  const [ review, setReview ] = useState(``)
  const [ loading, setLoading ] = useState(false)

  const [ user, setUser ] = useState(() => (getToken() ? getSavedUser() : null))
  const [ showAuth, setShowAuth ] = useState(false)
  const [ showHistory, setShowHistory ] = useState(false)
  const [ historyKey, setHistoryKey ] = useState(0)
  const [ activeReviewId, setActiveReviewId ] = useState(null)

  useEffect(() => {
    prism.highlightAll()
  }, [])

  // Check the saved login is still valid when the app opens
  useEffect(() => {
    if (!getToken()) return
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(error => {
        if (error.response && error.response.status === 401) logout()
      })
  }, [])

  function login(token, loggedInUser) {
    saveSession(token, loggedInUser)
    setUser(loggedInUser)
    setShowAuth(false)
    setShowHistory(true)
    setHistoryKey(key => key + 1)
  }

  function logout() {
    clearSession()
    setUser(null)
    setShowHistory(false)
    setActiveReviewId(null)
  }

  async function reviewCode() {
    if (loading) return
    setLoading(true)
    setReview(`Reviewing...`)
    try {
      const response = await api.post('/ai/get-review', { code })
      setReview(response.data)
      const savedId = response.headers['x-review-id']
      if (savedId) {
        setActiveReviewId(savedId)
        setHistoryKey(key => key + 1)
      }
    } catch (error) {
      if (user && error.response && error.response.status === 401) {
        logout()
        setShowAuth(true)
      }
      setReview(`**Error** — ${errorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }

  async function openReview(id) {
    try {
      const { data } = await api.get(`/reviews/${id}`)
      setCode(data.code)
      setReview(data.review)
      setActiveReviewId(data.id)
    } catch (error) {
      setReview(`**Error** — ${errorMessage(error)}`)
    }
  }

  function newReview() {
    setCode('')
    setReview('')
    setActiveReviewId(null)
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">AI Code Review</span>
        <div className="topbar-actions">
          {user ? (
            <>
              <button onClick={newReview}>New</button>
              <button onClick={() => setShowHistory(open => !open)}>
                {showHistory ? 'Hide history' : 'History'}
              </button>
              <span className="user-email" title={user.email}>{user.email}</span>
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="primary" onClick={() => setShowAuth(true)}>Log in to save reviews</button>
          )}
        </div>
      </header>

      <main>
        {user && showHistory && (
          <History
            refreshKey={historyKey}
            activeId={activeReviewId}
            onOpen={openReview}
            onDeleted={id => { if (id === activeReviewId) setActiveReviewId(null) }}
            onClose={() => setShowHistory(false)}
          />
        )}
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: "5px",
                height: "100%",
                width: "100%"
              }}
            />
          </div>
          <div
            onClick={reviewCode}
            className={`review${loading ? " disabled" : ""}`}>{loading ? "Reviewing..." : "Review"}</div>
        </div>
        <div className="right">
          <Markdown

            rehypePlugins={[ rehypeHighlight ]}

          >{review}</Markdown>
        </div>
      </main>

      {showAuth && <AuthForm onSuccess={login} onClose={() => setShowAuth(false)} />}
    </>
  )
}



export default App
