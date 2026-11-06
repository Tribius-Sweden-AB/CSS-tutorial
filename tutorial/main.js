import { steps } from './steps.js'

const STORAGE_KEY = 'css-tutorial-v1'

const els = {
  progress: document.getElementById('progress'),
  lesson: document.getElementById('lesson'),
  prev: document.getElementById('prev'),
  next: document.getElementById('next'),
  frame: document.getElementById('frame'),
  url: document.getElementById('url'),
  home: document.getElementById('home'),
  reload: document.getElementById('reload'),
  newTab: document.getElementById('new-tab'),
  bar: document.querySelector('.browser-bar'),
}

// ---------------------------------------------------------------------------
// State (sparas i localStorage)
// ---------------------------------------------------------------------------

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && Number.isInteger(saved.current)) {
      return { current: Math.min(Math.max(saved.current, 0), steps.length - 1), done: saved.done ?? [] }
    }
  } catch {}
  return { current: 0, done: [] }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

const state = load()

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const lessonCount = steps.filter((s) => !s.final).length

/** Sluttestet låses upp när alla vanliga steg är klara (eller med ?unlock i adressen). */
function isUnlocked(step) {
  if (!step.final) return true
  if (new URLSearchParams(location.search).has('unlock')) return true
  return steps.filter((s) => !s.final).every((s) => state.done.includes(s.id))
}

function renderProgress() {
  els.progress.innerHTML = steps
    .map((step, i) => {
      const classes = ['dot']
      if (step.final) classes.push('final')
      if (i === state.current) classes.push('current')
      if (state.done.includes(step.id)) classes.push('done')
      const locked = !isUnlocked(step)
      const title = locked ? `Sluttest: gör klart steg 1–${lessonCount} först` : step.final ? step.title : `${i + 1}. ${step.title}`
      return `<button class="${classes.join(' ')}" data-step="${i}" type="button" title="${title}"${
        locked ? ' disabled' : ''
      }>${step.final ? (locked ? 'Test 🔒' : 'Test') : i + 1}</button>`
    })
    .join('')
}

function renderLesson() {
  const step = steps[state.current]
  showPage(step.page ?? '/')
  fitFrame()
  els.lesson.innerHTML = `
    <p class="kicker">${step.final ? 'Sluttest' : `Steg ${state.current + 1} av ${lessonCount}`}</p>
    <h1>${step.title}</h1>
    <div class="intro">${step.intro}</div>

    <h2>Uppgifter</h2>
    <ol class="tasks">
      ${step.tasks.map((t) => `<li class="task"><span class="tick" aria-hidden="true"></span><div>${t.text}<p class="hint" hidden></p></div></li>`).join('')}
    </ol>
    <p class="all-done" hidden>Alla uppgifter klara. Gå vidare när du vill.</p>

    ${
      step.tips.length
        ? `<h2>Tips</h2>
           ${step.tips
             .map((tip) => `<details class="tip"><summary>${escapeHtml(tip.title)}</summary>${tip.body}</details>`)
             .join('')}`
        : ''
    }

    ${
      step.cheatsheet
        ? `<details class="cheat">
            <summary>Visa lösningsexempel</summary>
            <p class="cheat-note">Försök själv först. Det är så man lär sig.</p>
            ${step.cheatsheet}
          </details>`
        : ''
    }
  `
  els.lesson.scrollTop = 0
  els.prev.disabled = state.current === 0
  runChecks()
}

function escapeHtml(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function goTo(index) {
  index = Math.min(Math.max(index, 0), steps.length - 1)
  if (!isUnlocked(steps[index])) return
  state.current = index
  save()
  renderProgress()
  renderLesson()
}

// ---------------------------------------------------------------------------
// Checks: läser Måns sida i iframen och bockar av uppgifter
// ---------------------------------------------------------------------------

function getFrameDoc() {
  try {
    const doc = els.frame.contentDocument
    if (!doc || doc.readyState === 'loading' || !doc.body) return null
    return doc
  } catch {
    return null // annan domän (t.ex. om man klickat på en extern länk)
  }
}

/**
 * Råa källfiler (step.sources) som checks kan läsa, t.ex. för att se en @import
 * som Vite redan har bakat ihop. null = filen finns inte.
 */
let sources = {}

async function loadSources(step) {
  if (!step.sources) return (sources = {})
  const entries = await Promise.all(
    step.sources.map(async (p) => {
      try {
        const res = await fetch(`/__tutorial/source?path=${encodeURIComponent(p)}`, { cache: 'no-store' })
        return [p, res.ok ? await res.text() : null]
      } catch {
        return [p, null]
      }
    })
  )
  sources = Object.fromEntries(entries)
}

async function runChecks() {
  const step = steps[state.current]
  await loadSources(step)
  if (step !== steps[state.current]) return // bytte steg medan vi hämtade
  const doc = getFrameDoc()
  const win = els.frame.contentWindow

  // En check returnerar true (klar), false (inte klar) eller en sträng:
  // en ledtråd om varför den inte är klar, t.ex. att ett element saknas.
  const results = step.tasks.map((task) => {
    if (!doc) return { ok: false }
    try {
      const result = task.check(doc, win, sources)
      return typeof result === 'string' ? { ok: false, hint: result } : { ok: !!result }
    } catch {
      return { ok: false }
    }
  })

  const taskEls = els.lesson.querySelectorAll('.task')
  results.forEach(({ ok, hint }, i) => {
    const el = taskEls[i]
    if (!el) return
    el.classList.toggle('ok', ok)
    const hintEl = el.querySelector('.hint')
    if (hintEl.textContent !== (hint ?? '')) hintEl.textContent = hint ?? ''
    hintEl.hidden = !hint
  })

  const allOk = results.every((r) => r.ok)
  els.lesson.querySelector('.all-done').hidden = !allOk
  els.next.classList.toggle('ready', allOk)
  const isLast = state.current === steps.length - 1
  const nextStep = steps[state.current + 1]
  els.next.textContent = isLast ? 'Klart' : nextStep.final ? 'Till sluttestet →' : 'Nästa steg →'
  els.next.disabled = isLast ? !allOk : !isUnlocked(nextStep)

  if (allOk) markDone(step)
}

/** Första gången ett steg blir helt klart: spara det. */
function markDone(step) {
  if (state.done.includes(step.id)) return
  state.done.push(step.id)
  save()
  renderProgress()
}

// ---------------------------------------------------------------------------
// Skärmen (iframen)
// ---------------------------------------------------------------------------

function updateUrl() {
  try {
    const loc = els.frame.contentWindow.location
    els.url.textContent = `localhost:${location.port}${loc.pathname}${loc.hash}`
  } catch {
    els.url.textContent = '(en annan webbplats)'
  }
}

els.frame.addEventListener('load', () => {
  updateUrl()
  runChecks()
  // Hash-länkar (#smaker) laddar inte om sidan, men ändrar adressen.
  try {
    els.frame.contentWindow.addEventListener('hashchange', updateUrl)
  } catch {}
})

const currentPage = () => steps[state.current].page ?? '/'

/** Visar rätt projekt i skärmen: övningssajten (/) eller sluttestet (/final-test/). */
function showPage(page) {
  els.newTab.href = page
  try {
    const path = els.frame.contentWindow.location.pathname.replace(/index\.html$/, '')
    if (path === page) return
  } catch {}
  els.frame.src = page
}

/**
 * Steg med viewportWidth (sluttestet) visar sidan i full desktop-bredd,
 * nedskalad så att den får plats i skärmen.
 */
function fitFrame() {
  const width = steps[state.current].viewportWidth
  const frame = els.frame
  if (!width) {
    frame.style.cssText = ''
    return
  }
  const box = frame.parentElement
  const availableWidth = box.clientWidth
  const availableHeight = box.clientHeight - els.bar.offsetHeight
  const scale = Math.min(1, availableWidth / width)
  frame.style.cssText = `flex: none; width: ${width}px; height: ${availableHeight / scale}px;
    transform: scale(${scale}); transform-origin: 0 0;`
}

new ResizeObserver(fitFrame).observe(els.frame.parentElement)

els.home.addEventListener('click', () => (els.frame.src = currentPage()))
els.reload.addEventListener('click', () => {
  try {
    els.frame.contentWindow.location.reload()
  } catch {
    els.frame.src = currentPage()
  }
})

// CSS-ändringar laddar inte om iframen (hot reload), så vi kollar igen ofta.
setInterval(runChecks, 800)

// ---------------------------------------------------------------------------
// Knappar
// ---------------------------------------------------------------------------

els.prev.addEventListener('click', () => goTo(state.current - 1))
els.next.addEventListener('click', () => goTo(state.current + 1))
els.progress.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-step]')
  if (btn) goTo(Number(btn.dataset.step))
})

els.lesson.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy')
  if (!btn) return
  const codeText = btn.parentElement.querySelector('code').textContent
  try {
    await navigator.clipboard.writeText(codeText)
    btn.textContent = 'Kopierat!'
  } catch {
    btn.textContent = 'Markera och kopiera'
  }
  setTimeout(() => (btn.textContent = 'Kopiera'), 1500)
})

// Sparat steg kan vara sluttestet, som kanske är låst igen (t.ex. efter ?unlock).
if (!isUnlocked(steps[state.current])) state.current = 0

renderProgress()
renderLesson()
