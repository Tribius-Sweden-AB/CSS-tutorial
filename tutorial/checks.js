// Små hjälpfunktioner för att kolla Måns sida (dokumentet i iframen).

export const $ = (doc, sel) => doc.querySelector(sel)
export const $$ = (doc, sel) => [...doc.querySelectorAll(sel)]
export const text = (el) => (el?.textContent ?? '').trim()
export const px = (value) => parseFloat(value) || 0

export const isTransparent = (color) =>
  !color || color === 'transparent' || /rgba\(.*,\s*0\)$/.test(color)

export const isWhite = (color) => color === 'rgb(255, 255, 255)'

export const imgLoaded = (img) => img.complete && img.naturalWidth > 0

/** Hämtar computed style för ett element i iframen. */
export const css = (win, el) => win.getComputedStyle(el)

/** Hittar <link rel="stylesheet"> som pekar på styles.css och har laddats. */
export const linkedStylesheet = (doc) =>
  $$(doc, 'link[rel="stylesheet"]').find(
    (link) => /styles\.css/.test(link.getAttribute('href') ?? '') && link.sheet
  )

// ── Hjälpare för sluttestet ────────────────────────────────────────────────

/** Det djupaste elementet vars text är exakt `t` (t.ex. en rubrik "Små steg"). */
export const findByText = (doc, t) =>
  $$(doc, 'body *').find(
    (el) => text(el) === t && ![...el.children].some((child) => text(child) === t)
  )

/** Alla element ligger på samma rad, bredvid varandra. */
export const sameRow = (els) => {
  if (els.some((el) => !el)) return false
  const rects = els.map((el) => el.getBoundingClientRect())
  const lefts = new Set(rects.map((r) => Math.round(r.left)))
  return rects.every((r) => Math.abs(r.top - rects[0].top) < 6) && lefts.size === els.length
}

/** Närmaste förälder (eller elementet självt) som har rundade hörn. */
export const roundedAncestor = (win, el) => {
  for (let node = el; node && node.tagName !== 'BODY'; node = node.parentElement) {
    if (px(css(win, node).borderTopLeftRadius) > 0) return node
  }
  return null
}

/** Räknar hur många gånger var(--...) används i sidans CSS (utom i :root). */
export const countVarUsage = (doc) => {
  let count = 0
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.styleSheet) walk(rule.styleSheet.cssRules) // @import
      else if (rule.cssRules) walk(rule.cssRules) // @media
      if (rule.selectorText && rule.selectorText !== ':root') {
        count += (rule.style.cssText.match(/var\(--/g) ?? []).length
      }
    }
  }
  for (const sheet of doc.styleSheets) {
    try {
      walk(sheet.cssRules)
    } catch {} // t.ex. Google Fonts, som vi inte får läsa
  }
  return count
}
