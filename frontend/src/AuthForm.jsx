import { useState } from 'react'
import { api, errorMessage } from './api'

function AuthForm({ onSuccess, onClose }) {
  const [ mode, setMode ] = useState('login')
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ error, setError ] = useState('')
  const [ busy, setBusy ] = useState(false)

  const isLogin = mode === 'login'

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/auth/${isLogin ? 'login' : 'register'}`, { email, password })
      onSuccess(data.token, data.user)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h2>{isLogin ? 'Log in' : 'Create account'}</h2>
        <p className="modal-hint">Your reviews are saved so you can come back to them.</p>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 8}
            maxLength={72}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        {!isLogin && <p className="modal-hint">At least 8 characters.</p>}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <button
          type="button"
          className="link"
          onClick={() => { setMode(isLogin ? 'register' : 'login'); setError('') }}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  )
}

export default AuthForm
