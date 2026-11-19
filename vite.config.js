import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  function githubApiProxy() {
    return {
      name: 'github-api-proxy',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const match = request.url?.match(/^\/api\/github\/users\/([a-zA-Z0-9-]+)\/?$/)
          if (!match) {
            next()
            return
          }

          try {
            const githubResponse = await fetch(
              `https://api.github.com/users/${encodeURIComponent(match[1])}`,
              {
                headers: {
                  Accept: 'application/vnd.github+json',
                  'X-GitHub-Api-Version': '2022-11-28',
                  'User-Agent': 'handle-username-check',
                },
              },
            )

            if (githubResponse.status === 200 || githubResponse.status === 404) {
              response.statusCode = githubResponse.status
              response.setHeader('Content-Type', 'application/json')
              const profile = githubResponse.status === 200
                ? await githubResponse.json()
                : null
              response.end(JSON.stringify({
                status: githubResponse.status,
                profile: profile && {
                  login: profile.login,
                  name: profile.name,
                  avatarUrl: profile.avatar_url,
                  bio: profile.bio,
                  followers: profile.followers,
                  following: profile.following,
                  publicRepos: profile.public_repos,
                  location: profile.location,
                  profileUrl: profile.html_url,
                },
              }))
              return
            }

            if (githubResponse.status === 403 || githubResponse.status === 429) {
              const profileResponse = await fetch(
                `https://github.com/${encodeURIComponent(match[1])}`,
                {
                  headers: { 'User-Agent': 'handle-username-check' },
                  redirect: 'manual',
                },
              )

              if (profileResponse.status === 200 || profileResponse.status === 404) {
                response.statusCode = profileResponse.status
                response.setHeader('Content-Type', 'application/json')
                response.end(JSON.stringify({ status: profileResponse.status }))
                return
              }
            }

            response.statusCode = githubResponse.status
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ status: githubResponse.status }))
          } catch {
            response.statusCode = 502
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ status: 502 }))
          }
        })
      },
    }
  }

  return {
    plugins: [react(), githubApiProxy()],
  }
})
