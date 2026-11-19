import { useState } from 'react'
import './App.css'

const USERNAME_PATTERN = /^(?!.*--)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i

function GithubMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.42-4.04-1.42-.55-1.4-1.33-1.77-1.33-1.77-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17a4.7 4.7 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.28c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" strokeWidth="1.8" />
      <path d="m16 16 5 5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function StatusIcon({ status }) {
  if (status === 'available') {
    return <span className="status-icon check">✓</span>
  }
  if (status === 'taken') {
    return <span className="status-icon cross">×</span>
  }
  return <span className="status-icon alert">!</span>
}

function App() {
  const [username, setUsername] = useState('')
  const [result, setResult] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  async function checkUsername(event) {
    event.preventDefault()
    const value = username.trim()

    if (!value) {
      setResult({ status: 'error', message: 'Enter a username to get started.' })
      return
    }

    if (!USERNAME_PATTERN.test(value)) {
      setResult({
        status: 'error',
        message: 'Use 1–39 letters, numbers, or hyphens. Usernames cannot start with a hyphen.',
      })
      return
    }

    setIsChecking(true)
    setResult(null)

    try {
      const response = await fetch(
        `/api/github/users/${encodeURIComponent(value)}`,
      )
      const payload = await response.json().catch(() => ({ status: response.status }))
      const status = payload.status ?? response.status

      if (status === 404) {
        setResult({ status: 'available', username: value })
      } else if (status === 200) {
        setResult({ status: 'taken', username: value, profile: payload.profile })
      } else if (status === 403) {
        const resetTime = payload.reset ? new Date(Number(payload.reset) * 1000) : null
        const resetCopy = resetTime && !Number.isNaN(resetTime.getTime())
          ? ` GitHub availability resets at ${resetTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
          : ''
        setResult({
          status: 'error',
          message: `GitHub is rate limiting requests.${resetCopy}`,
        })
      } else {
        setResult({
          status: 'error',
          message: 'GitHub could not complete that check. Please try again.',
        })
      }
    } catch {
      setResult({
        status: 'error',
        message: 'Could not reach GitHub. Check your connection and try again.',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const resultCopy = {
    available: {
      title: 'Username is available',
      description: 'Looks like this username is ready to claim.',
    },
    taken: {
      title: 'Username is taken',
      description: 'Someone is already using this username.',
    },
    error: {
      title: 'We could not check that',
      description: result?.message,
    },
  }

  return (
    <main className="app-shell">
      <nav className="nav">
        <a className="brand" href="/" aria-label="Handle home">
          <GithubMark className="brand-mark" />
          <span>handle<span className="brand-dot">.</span></span>
        </a>
        <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer">
          <span>GitHub</span>
          <span className="arrow">↗</span>
        </a>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> CHECK THE HANDLE</div>
        <h1>My GitHub Checker</h1>

        <form className="checker" onSubmit={checkUsername}>
          <label htmlFor="username">GitHub username</label>
          <div className="input-row">
            <div className="input-wrap">
              <span className="prefix">@</span>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (result) setResult(null)
                }}
                placeholder="your-username"
                autoComplete="off"
                spellCheck="false"
                maxLength="39"
                aria-describedby="username-hint"
              />
            </div>
            <button type="submit" disabled={isChecking}>
              {isChecking ? 'Checking...' : 'Check User'}
              {!isChecking && <SearchIcon />}
            </button>
          </div>
          <p id="username-hint" className="hint">GitHub usernames can contain letters, numbers, and hyphens.</p>
        </form>

        {result?.status === 'taken' && result.profile ? (
          <div className="profile-card" role="status">
            <img className="profile-avatar" src={result.profile.avatarUrl} alt="" />
            <h2>{result.profile.name || result.profile.login}</h2>
            <p>Username: {result.profile.login}</p>
            <p>Public Repositories: {result.profile.publicRepos}</p>
            <p>Followers: {result.profile.followers}</p>
            <p>Following: {result.profile.following}</p>
            <a href={result.profile.profileUrl} target="_blank" rel="noreferrer">
              Visit GitHub Profile
            </a>
          </div>
        ) : result && (
          <div className={`result-card ${result.status}`} role="status">
            <StatusIcon status={result.status} />
            <div className="result-content">
              <strong>{resultCopy[result.status].title}</strong>
              <span>
                {result.status !== 'error' && <b>@{result.username}</b>}
                {resultCopy[result.status].description}
              </span>
            </div>
            {result.status === 'taken' && (
              <>
                {result.profile && (
                  <div className="profile-details">
                    <img src={result.profile.avatarUrl} alt="" />
                    <div>
                      <strong>{result.profile.name || `@${result.profile.login}`}</strong>
                      <span>{result.profile.bio || 'No bio provided.'}</span>
                      <small>
                        {result.profile.followers} followers · {result.profile.publicRepos} repositories
                      </small>
                    </div>
                  </div>
                )}
                <a href={result.profile?.profileUrl || `https://github.com/${result.username}`} target="_blank" rel="noreferrer">
                  View profile <span>↗</span>
                </a>
              </>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>Powered by the GitHub API</span>
        <span className="footer-line" />
        <span>Made for finding your next handle</span>
      </footer>
    </main>
  )
}

export default App
