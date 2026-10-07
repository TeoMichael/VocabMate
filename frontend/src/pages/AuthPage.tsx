import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  BookHeart,
  Check,
  Eye,
  EyeOff,
  Heart,
  LoaderCircle,
  Sparkles,
  Star,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Layout'
import { ErrorMessage } from '../components/ui'
import { useAuth } from '../context/auth'
import { errorMessage } from '../lib/api'
import { returnPath } from '../lib/navigation'

export default function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (register) await auth.register(name.trim(), email.trim(), password)
      else await auth.login(email.trim(), password)
      navigate(returnPath(location.state), { replace: true })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <p className="eyebrow">A HAPPY PLACE FOR YOUR WORDS</p>
          <h2>
            Little words.
            <br />
            Big possibilities.
            <br />
            <em>You’ve got this.</em>
          </h2>
          <p>
            Collect the words you love, practice at your own pace, and feel a little more confident
            every day.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="illustration-card">
              <BookHeart size={31} />
              <span>acquire</span>
              <small>to gain something new</small>
              <div>
                <Check size={14} /> A tiny learning win
              </div>
            </div>
            <span className="illustration-leaf leaf-one">
              <Heart size={32} fill="currentColor" strokeWidth={1.4} />
            </span>
            <span className="illustration-leaf leaf-two">
              <Star size={21} fill="currentColor" strokeWidth={1.4} />
            </span>
          </div>
        </div>
        <span className="auth-story-footer">Your words. Your pace. Your progress.</span>
      </section>
      <main className="auth-form-section">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          <span className="auth-greeting">
            <Sparkles size={23} />
          </span>
          <h1>{register ? 'Start your word journey' : 'Welcome back'}</h1>
          <p className="auth-subtitle">
            {register
              ? 'Create your own vocabulary learning space.'
              : 'Your next little step starts here.'}
          </p>
          <ErrorMessage message={error} />
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label className="field">
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={80}
                  placeholder="What should we call you?"
                  autoFocus
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                placeholder="you@example.com"
                autoFocus={!register}
              />
            </label>
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <div className="password-field">
                <input
                  id="auth-password"
                  aria-describedby={register ? 'password-hint' : undefined}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={register ? 8 : undefined}
                  maxLength={128}
                  placeholder={register ? 'At least 8 characters' : 'Enter your password'}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {register && (
                <span id="password-hint" className="field-hint">
                  Use at least 8 characters. A longer password is a good idea.
                </span>
              )}
            </div>
            <button className="button primary full-width auth-submit" disabled={busy}>
              {busy ? <LoaderCircle size={18} className="spinner" /> : <ArrowRight size={18} />}
              {busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to VocabMate?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Log in' : 'Create an account'}
            </Link>
          </p>
          <div className="auth-private">
            <span /> Your vocabulary belongs to you.
          </div>
        </div>
      </main>
    </div>
  )
}
