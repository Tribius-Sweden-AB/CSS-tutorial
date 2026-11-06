// Återställer Måns filer till startläget.
//
//   npm run reset          övningssajten (index.html, assets/, public/)
//   npm run reset:final    sluttestet (final-test/)
//
// Lägg till -- --yes för att hoppa över frågan, t.ex. npm run reset -- --yes
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'

const root = path.resolve(import.meta.dirname, '..')

const projects = {
  site: {
    from: path.join(import.meta.dirname, 'starter'),
    to: root,
    entries: ['index.html', 'assets', 'public'],
    label: 'index.html, assets/ och public/',
  },
  final: {
    from: path.join(import.meta.dirname, 'final', 'starter'),
    to: path.join(root, 'final-test'),
    entries: ['index.html', 'assets'],
    label: 'final-test/',
  },
}

const project = projects[process.argv.includes('--final') ? 'final' : 'site']

if (!process.argv.includes('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(
    `Detta raderar alla dina ändringar i ${project.label}.\nÄr du säker? (j/n) `
  )
  rl.close()
  if (!['j', 'ja', 'y', 'yes'].includes(answer.trim().toLowerCase())) {
    console.log('Avbrutet. Inget ändrades.')
    process.exit(0)
  }
}

fs.mkdirSync(project.to, { recursive: true })
for (const name of project.entries) {
  const dest = path.join(project.to, name)
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(path.join(project.from, name), dest, { recursive: true })
}
console.log(`Klart. ${project.label} är tillbaka i startläget.`)
