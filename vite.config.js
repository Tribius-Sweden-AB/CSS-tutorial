import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// The tutorial shell (/tutorial/) is served as a plain file WITHOUT Vite's HMR
// client. Otherwise every save of the root index.html would reload the whole
// tutorial, not just the "screen" iframe that shows Måns's site.
function tutorialShell() {
  const projectRoot = path.resolve(import.meta.dirname)
  const shellFile = path.resolve(projectRoot, 'tutorial/index.html')
  return {
    name: 'tutorial-shell',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        if (url === '/tutorial') {
          res.writeHead(302, { Location: '/tutorial/' })
          return res.end()
        }
        if (url === '/tutorial/' || url === '/tutorial/index.html') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          return res.end(fs.readFileSync(shellFile))
        }
        // Raw source of one of Måns's CSS files, so checks can see things Vite
        // rewrites before the browser gets them (e.g. @import is inlined).
        // Read-only, and limited to .css files inside the project.
        if (url === '/__tutorial/source') {
          const rel = new URL(req.url, 'http://x').searchParams.get('path') ?? ''
          const file = path.resolve(projectRoot, rel)
          const inside = file.startsWith(projectRoot + path.sep) && !file.includes(`${path.sep}node_modules${path.sep}`)
          res.setHeader('Cache-Control', 'no-store')
          if (!inside || !file.endsWith('.css') || !fs.existsSync(file)) {
            res.statusCode = 404
            return res.end()
          }
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          return res.end(fs.readFileSync(file))
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [tutorialShell()],
  server: {
    port: 5173,
    open: '/tutorial/',
  },
})
