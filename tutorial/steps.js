import {
  $,
  $$,
  text,
  px,
  css,
  isTransparent,
  isWhite,
  imgLoaded,
  linkedStylesheet,
  findByText,
  sameRow,
  roundedAncestor,
  countVarUsage,
} from './checks.js'

// ---------------------------------------------------------------------------
// Hjälpare för att skriva lektionstext
// ---------------------------------------------------------------------------

const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** Inline-kod: c('<h1>') */
const c = (s) => `<code>${escape(s)}</code>`

/** Kodblock med kopiera-knapp. lang = 'html' | 'css' */
const code = (lang, s) =>
  `<pre class="code" data-lang="${lang}"><button class="copy" type="button">Kopiera</button><code>${escape(
    s.replace(/^\n/, '').replace(/\s+$/, '')
  )}</code></pre>`

/** Ledtråd när ett element saknas helt. Visas under uppgiften. */
const missing = (tag) => `Det finns ingen <${tag}> på sidan just nu.`
const noCards = 'Hittar inga element med class="card" på sidan.'

/** Tar bort CSS-kommentarer, så att exempel i kommentarer inte räknas. */
const stripComments = (cssText) => cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** Namnen på variablerna som skapas i :root, t.ex. ['--color-brand']. */
const rootVariables = (cssText) => {
  const root = stripComments(cssText).match(/:root\s*\{([^}]*)\}/)
  return root ? [...root[1].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]) : []
}

// ---------------------------------------------------------------------------
// Stegen
// Varje task.check(doc, win) får iframens document + window och returnerar
// true (klar), false (inte klar) eller en sträng med en ledtråd.
// ---------------------------------------------------------------------------

export const steps = [
  // 1 ────────────────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    title: 'Kom igång',
    intro: `
      <p>Du ska bygga en produktsida för <strong>Nordvik Audio</strong>, ett påhittat företag
      som gör hörlurar och högtalare. Byt gärna namn och innehåll, det är din sajt.</p>
      <p>Till höger ser du sidan i webbläsaren. Du skriver koden i ${c('index.html')} i
      VS Code, och när du sparar uppdateras sidan direkt. Samma upplägg som de flesta
      webbutvecklare jobbar med.</p>
      <p>HTML består av <strong>taggar</strong>. De flesta har en start-tagg och en slut-tagg,
      och innehållet hamnar emellan:</p>
      ${code('html', '<h1>Det här är en rubrik</h1>')}
    `,
    tasks: [
      {
        text: `Ändra texten i ${c('<h1>')} till företagets namn.`,
        check: (doc) => {
          if (!$(doc, 'h1')) return missing('h1')
          const h1 = text($(doc, 'h1'))
          return h1.length > 0 && h1 !== 'Mitt företag'
        },
      },
      {
        text: `Ändra texten i ${c('<title>')}. Den syns i webbläsarens flik.`,
        check: (doc) => doc.title.trim().length > 0 && doc.title.trim() !== 'Min sajt',
      },
    ],
    tips: [
      {
        title: 'Spara',
        body: `<p><kbd>Cmd</kbd> + <kbd>S</kbd>. VS Code är också inställt på att spara
        automatiskt efter en kort stund.</p>`,
      },
      {
        title: '<head> och <body>',
        body: `<p>Allt i ${c('<head>')} är information om sidan (titel, typsnitt, CSS-filer)
        och syns inte på själva sidan. Allt i ${c('<body>')} är det som visas.</p>`,
      },
    ],
    cheatsheet: code(
      'html',
      `
<title>Nordvik Audio</title>
...
<h1>Nordvik Audio</h1>`
    ),
  },

  // 2 ────────────────────────────────────────────────────────────────────────
  {
    id: 'text',
    title: 'Text-taggar',
    intro: `
      <p>Taggarna beskriver vad innehållet <em>är</em>. Webbläsare, sökmotorer och
      skärmläsare använder dem för att förstå sidan.</p>
      <ul>
        <li>${c('<h1>')}–${c('<h6>')}: rubriker, där ${c('<h1>')} är den viktigaste</li>
        <li>${c('<p>')}: ett textstycke (paragraph)</li>
        <li>${c('<ul>')} + ${c('<li>')}: en punktlista (unordered list / list item)</li>
        <li>${c('<a href="...">')}: en länk</li>
      </ul>
    `,
    tasks: [
      {
        text: `Lägg texten om företaget i en ${c('<p>')}.`,
        check: (doc) => $$(doc, 'p').some((p) => text(p).length > 10),
      },
      {
        text: `Lägg till en underrubrik med ${c('<h2>')}, t.ex. "Produkter".`,
        check: (doc) => text($(doc, 'h2')).length > 0,
      },
      {
        text: `Gör en lista (${c('<ul>')}) med minst 3 ${c('<li>')}, t.ex. tre saker som gör produkterna bra.`,
        check: (doc) => $$(doc, 'ul, ol').some((list) => list.querySelectorAll('li').length >= 3),
      },
      {
        text: `Lägg till en länk med ${c('<a href="#">')}.`,
        check: (doc) => $$(doc, 'a[href]').some((a) => text(a).length > 0),
      },
    ],
    tips: [
      {
        title: 'Emmet: skriv mindre',
        body: `<p>VS Code har Emmet inbyggt. Skriv ${c('p')} och tryck <kbd>Tab</kbd>, så får du
        ${c('<p></p>')}. Det funkar även med längre uttryck: ${c('ul>li*3')} + <kbd>Tab</kbd>
        ger en lista med tre punkter.</p>`,
      },
      {
        title: 'Attribut',
        body: `<p>${c('href')} är ett <strong>attribut</strong>, alltså extra information i
        start-taggen. Här talar det om vart länken går. ${c('#')} betyder att den inte går
        någonstans än, vilket är vanligt medan man bygger.</p>`,
      },
      {
        title: 'Sidan ser konstig ut',
        body: `<p>Oftast saknas en slut-tagg. Glömmer du ${c('</h2>')} tror webbläsaren att
        resten av sidan också är en rubrik.</p>`,
      },
    ],
    cheatsheet: code(
      'html',
      `
<h1>Nordvik Audio</h1>
<p>Nordvik Audio gör hörlurar och högtalare i Göteborg.</p>

<h2>Produkter</h2>
<ul>
  <li>40 timmars batteri</li>
  <li>Aktiv brusreducering</li>
  <li>Två års garanti</li>
</ul>

<a href="#">Se alla produkter</a>`
    ),
  },

  // 3 ────────────────────────────────────────────────────────────────────────
  {
    id: 'semantic',
    title: 'Semantisk HTML',
    intro: `
      <p>Nästan alla webbsidor har samma grundstruktur: ett sidhuvud, huvudinnehåll och en
      sidfot. HTML har egna taggar för de delarna. Det kallas <strong>semantisk HTML</strong>
      (semantik = betydelse).</p>
      <ul>
        <li>${c('<header>')}: sidhuvudet, med logga och meny</li>
        <li>${c('<nav>')}: navigeringen (menyn)</li>
        <li>${c('<main>')}: huvudinnehållet</li>
        <li>${c('<section>')}: en avgränsad del av innehållet, oftast med en egen rubrik</li>
        <li>${c('<footer>')}: sidfoten</li>
      </ul>
      <p>Taggarna ändrar inte utseendet än, men de ger dig något att styla med CSS senare.</p>
    `,
    tasks: [
      {
        text: `Lägg din ${c('<h1>')} i en ${c('<header>')}.`,
        check: (doc) => {
          if (!$(doc, 'h1')) return missing('h1')
          if (!$(doc, 'header')) return missing('header')
          return !!$(doc, 'header h1') || 'Din <h1> ligger inte inuti <header>.'
        },
      },
      {
        text: `Lägg en ${c('<nav>')} i headern med minst 2 länkar, t.ex. "Produkter" och "Kontakt".`,
        check: (doc) => {
          if (!$(doc, 'nav')) return missing('nav')
          if (!$(doc, 'header nav')) return 'Din <nav> ligger inte inuti <header>.'
          return $$(doc, 'header nav a').length >= 2
        },
      },
      {
        text: `Lägg resten av innehållet i en ${c('<main>')}.`,
        check: (doc) => (!$(doc, 'main') ? missing('main') : !!$(doc, 'main p, main h2')),
      },
      {
        text: `Dela upp innehållet i ${c('<main>')} i minst en ${c('<section>')}.`,
        check: (doc) => {
          if (!$(doc, 'section')) return missing('section')
          return !!$(doc, 'main section') || 'Din <section> ligger inte inuti <main>.'
        },
      },
      {
        text: `Lägg till en ${c('<footer>')} längst ner, t.ex. med "© Nordvik Audio".`,
        check: (doc) => (!$(doc, 'footer') ? missing('footer') : text($(doc, 'footer')).length > 0),
      },
    ],
    tips: [
      {
        title: 'Indrag',
        body: `<p>Taggar som ligger i andra taggar dras in ett steg. Då syns strukturen direkt.
        Markera rader och tryck <kbd>Tab</kbd> eller <kbd>Shift</kbd> + <kbd>Tab</kbd>.</p>`,
      },
      {
        title: 'Formatera automatiskt',
        body: `<p><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> (eller högerklick →
        Format Document) fixar indragen åt dig.</p>`,
      },
    ],
    cheatsheet: code(
      'html',
      `
<body>
  <header>
    <h1>Nordvik Audio</h1>
    <nav>
      <a href="#produkter">Produkter</a>
      <a href="#kontakt">Kontakt</a>
    </nav>
  </header>

  <main>
    <section>
      <p>Nordvik Audio gör hörlurar och högtalare i Göteborg.</p>
    </section>

    <section id="produkter">
      <h2>Produkter</h2>
      <ul>
        <li>40 timmars batteri</li>
        <li>Aktiv brusreducering</li>
        <li>Två års garanti</li>
      </ul>
    </section>
  </main>

  <footer id="kontakt">
    <p>© Nordvik Audio · hej@nordvik.audio</p>
  </footer>
</body>`
    ),
  },

  // 4 ────────────────────────────────────────────────────────────────────────
  {
    id: 'images',
    title: 'Bilder',
    intro: `
      <p>Bilder läggs in med ${c('<img>')}. Den har ingen slut-tagg, men behöver två attribut:</p>
      <ul>
        <li>${c('src')}: sökvägen till bildfilen (source)</li>
        <li>${c('alt')}: en text som beskriver bilden, för skärmläsare och om bilden inte laddar</li>
      </ul>
      ${code('html', '<img src="assets/images/logo.svg" alt="Nordvik Audio logotyp" />')}
      <p>Bilderna ligger i ${c('assets/images')}. Sökvägen i ${c('src')} följer mapparna
      i filträdet, räknat från ${c('index.html')}.</p>
    `,
    tasks: [
      {
        text: `Lägg in loggan (${c('logo.svg')}) i ${c('<header>')}.`,
        check: (doc) => {
          const imgs = $$(doc, 'header img')
          if (!imgs.length) return 'Det finns ingen <img> inuti <header>.'
          return imgs.some(imgLoaded) || 'Bilden i <header> laddar inte. Kolla sökvägen i src.'
        },
      },
      {
        text: `Lägg in de tre produktbilderna (${c('product-1.svg')}–${c('product-3.svg')}) i ${c('<main>')}.`,
        check: (doc) => {
          const imgs = $$(doc, 'main img')
          if (imgs.some((img) => img.complete && !imgLoaded(img)))
            return 'Minst en bild laddar inte. Kolla sökvägen i src.'
          return imgs.filter(imgLoaded).length >= 3
        },
      },
      {
        text: `Ge alla bilder en ${c('alt')}-text som beskriver vad bilden visar.`,
        check: (doc) => {
          const imgs = $$(doc, 'img')
          return imgs.length > 0 && imgs.every((img) => (img.getAttribute('alt') ?? '').trim().length > 0)
        },
      },
    ],
    tips: [
      {
        title: 'Bilden syns inte',
        body: `<p>Då stämmer inte sökvägen. Kolla stavningen. VS Code föreslår filnamn om du
        skriver ${c('src="')} och väntar en sekund.</p>`,
      },
      {
        title: 'Extra: hero-bild',
        body: `<p>${c('hero.svg')} är en bred bild som passar högst upp i ${c('<main>')}.
        En stor bild överst på en sida kallas ofta för "hero".</p>`,
      },
      {
        title: 'Bilderna är för stora',
        body: `<p>Det fixar vi med CSS i ett senare steg.</p>`,
      },
    ],
    cheatsheet: code(
      'html',
      `
<header>
  <img src="assets/images/logo.svg" alt="Nordvik Audio logotyp" />
  <h1>Nordvik Audio</h1>
  ...
</header>

<section id="produkter">
  <h2>Produkter</h2>
  <img src="assets/images/product-1.svg" alt="Svarta over-ear-hörlurar" />
  <img src="assets/images/product-2.svg" alt="Cylinderformad bluetooth-högtalare" />
  <img src="assets/images/product-3.svg" alt="Trådlösa in-ear-lurar med laddfodral" />
</section>`
    ),
  },

  // 5 ────────────────────────────────────────────────────────────────────────
  {
    id: 'link-css',
    title: 'Koppla in CSS',
    intro: `
      <p>HTML bestämmer <em>vad</em> som finns på sidan. <strong>CSS</strong> bestämmer hur
      det ser ut. CSS-koden ligger i en egen fil: ${c('assets/css/styles.css')}.</p>
      <p>HTML-filen måste veta att CSS-filen finns. Det gör du med en ${c('<link>')} i
      ${c('<head>')}:</p>
      ${code('html', '<link rel="stylesheet" href="assets/css/styles.css" />')}
      <p>I ${c('<head>')} finns redan en ${c('<link>')} till ${c('reset.css')}. Det är en
      fil med grundinställningar som nästan alla projekt har. Lägg din nya ${c('<link>')}
      <em>under</em> den. CSS läses uppifrån och ned, så det som kommer sist vinner.</p>
      <p>En CSS-regel ser ut så här:</p>
      ${code(
        'css',
        `
h1 {
  color: tomato;
}`
      )}
      <p>${c('h1')} är <strong>selektorn</strong> (vad som ska stylas), ${c('color')} är
      <strong>egenskapen</strong> och ${c('tomato')} är <strong>värdet</strong>. Varje rad
      avslutas med semikolon.</p>
    `,
    tasks: [
      {
        text: `Lägg till ${c('<link>')}-taggen i ${c('<head>')} i ${c('index.html')}.`,
        check: (doc) => {
          if (linkedStylesheet(doc)) return true
          const ownLinks = $$(doc, 'link[rel="stylesheet"]').filter(
            (link) => !/reset\.css|fonts\.googleapis/.test(link.getAttribute('href') ?? '')
          )
          if (ownLinks.length) return 'Det finns en <link>, men den hittar inte styles.css. Kolla href.'
          return false
        },
      },
      {
        text: `Öppna ${c('styles.css')} och ge ${c('h1')} en färg med ${c('color')}.`,
        check: (doc, win) => {
          if (!linkedStylesheet(doc)) return 'CSS-filen är inte inkopplad än (uppgift 1).'
          const h1 = $(doc, 'h1')
          if (!h1) return missing('h1') + ' Regeln h1 { } har inget att styla.'
          return css(win, h1).color !== 'rgb(0, 0, 0)'
        },
      },
    ],
    tips: [
      {
        title: 'Inget händer',
        body: `<p>Kolla att ${c('href')} är exakt ${c('assets/css/styles.css')}, och att
        reglerna i CSS-filen har ${c('{')} och ${c('}')} runt sig.</p>`,
      },
      {
        title: 'Färgnamn',
        body: `<p>CSS har ett 140-tal inbyggda färgnamn, t.ex. ${c('tomato')}, ${c('teal')},
        ${c('slategray')} och ${c('orange')}. VS Code föreslår fler när du börjar skriva.</p>`,
      },
    ],
    cheatsheet:
      code('html', '<link rel="stylesheet" href="assets/css/styles.css" />') +
      code(
        'css',
        `
h1 {
  color: tomato;
}`
      ),
  },

  // 6 ────────────────────────────────────────────────────────────────────────
  {
    id: 'colors',
    title: 'Färger',
    intro: `
      <p>Två egenskaper styr nästan all färg:</p>
      <ul>
        <li>${c('color')}: textens färg</li>
        <li>${c('background-color')}: bakgrundens färg</li>
      </ul>
      <p>Färgnamn är bra för att testa, men i riktiga projekt används nästan alltid
      <strong>hex-koder</strong> som ${c('#e8613c')}. Det är så designers anger färger i t.ex. Figma.</p>
      ${code(
        'css',
        `
body {
  background-color: #f5f3ef;
  color: #1f2328;
}`
      )}
      <p>${c('body')} är hela sidan. Det mesta du sätter där, som textfärg och typsnitt,
      <strong>ärvs</strong> av allt som ligger inuti.</p>
    `,
    tasks: [
      {
        text: `Ge ${c('body')} en ${c('background-color')} (inte helt vit).`,
        check: (doc, win) => {
          const bg = css(win, doc.body).backgroundColor
          return !isTransparent(bg) && !isWhite(bg)
        },
      },
      {
        text: `Ändra textfärgen på ${c('body')} med ${c('color')}.`,
        check: (doc, win) => css(win, doc.body).color !== 'rgb(0, 0, 0)',
      },
      {
        text: `Ge ${c('header')} en annan bakgrundsfärg än ${c('body')}.`,
        check: (doc, win) => {
          const header = $(doc, 'header')
          if (!header) return missing('header')
          const bg = css(win, header).backgroundColor
          return !isTransparent(bg) && bg !== css(win, doc.body).backgroundColor
        },
      },
      {
        text: `Ge ${c('footer')} en egen bakgrundsfärg.`,
        check: (doc, win) => {
          const footer = $(doc, 'footer')
          if (!footer) return missing('footer')
          return !isTransparent(css(win, footer).backgroundColor)
        },
      },
    ],
    tips: [
      {
        title: 'Färgväljaren i VS Code',
        body: `<p>Bredvid varje färg i CSS-filen visas en liten ruta. Håll muspekaren över den
        så får du en färgväljare.</p>`,
      },
      {
        title: 'En palett som passar',
        body: `<p>Off-white ${c('#f5f3ef')}, nästan svart ${c('#1f2328')}, orange
        ${c('#e8613c')}, grå ${c('#6e7781')}. Bra sajter använder få färger.</p>`,
      },
      {
        title: 'Läsbarhet',
        body: `<p>Mörk text på ljus bakgrund eller tvärtom. Har headern mörk bakgrund behöver
        texten och länkarna där en ljus färg:</p>
        ${code('css', 'header {\n  background-color: #1f2328;\n  color: white;\n}\n\nheader a {\n  color: white;\n}')}`,
      },
    ],
    cheatsheet: code(
      'css',
      `
body {
  background-color: #f5f3ef;
  color: #1f2328;
}

header {
  background-color: #1f2328;
  color: white;
}

header a {
  color: white;
}

footer {
  background-color: #e8e4dc;
}`
    ),
  },

  // 7 ────────────────────────────────────────────────────────────────────────
  {
    id: 'typography',
    title: 'Typografi',
    intro: `
      <p>Typografi gör stor skillnad för hur proffsig en sida känns. De viktigaste egenskaperna:</p>
      <ul>
        <li>${c('font-family')}: typsnitt</li>
        <li>${c('font-size')}: storlek, t.ex. ${c('48px')}</li>
        <li>${c('font-weight')}: tjocklek, från ${c('100')} (tunn) till ${c('900')} (fet)</li>
        <li>${c('text-align')}: ${c('left')}, ${c('center')} eller ${c('right')}</li>
        <li>${c('line-height')}: radavstånd, t.ex. ${c('1.6')}</li>
      </ul>
      ${code(
        'css',
        `
body {
  font-family: system-ui, sans-serif;
}`
      )}
      <p>Man listar flera typsnitt med komma. Finns inte det första används nästa, och så vidare.</p>
    `,
    tasks: [
      {
        text: `Byt typsnitt på ${c('body')} med ${c('font-family')}.`,
        check: (doc, win) => !/^"?times/i.test(css(win, doc.body).fontFamily),
      },
      {
        text: `Ändra storleken på ${c('h1')} med ${c('font-size')}.`,
        check: (doc, win) => {
          const h1 = $(doc, 'h1')
          if (!h1) return missing('h1')
          return css(win, h1).fontSize !== '32px'
        },
      },
      {
        text: `Centrera en rubrik eller text med ${c('text-align: center;')}.`,
        check: (doc, win) => $$(doc, 'body *').some((el) => css(win, el).textAlign === 'center'),
      },
      {
        text: `Ge ${c('p')} bättre radavstånd med ${c('line-height')}.`,
        check: (doc, win) => {
          const p = $(doc, 'p')
          if (!p) return missing('p')
          return css(win, p).lineHeight !== 'normal'
        },
      },
    ],
    tips: [
      {
        title: 'Typsnitt från Google Fonts',
        body: `<ol>
          <li>Gå till <a href="https://fonts.google.com" target="_blank">fonts.google.com</a>
          och välj ett typsnitt, t.ex. "Inter", "Space Grotesk" eller "DM Sans".</li>
          <li>Klicka <strong>Get font</strong> → <strong>Get embed code</strong>.</li>
          <li>Kopiera ${c('<link>')}-taggarna till ${c('<head>')}, <em>ovanför</em> din egen ${c('<link>')}.</li>
          <li>Använd namnet i CSS:</li>
        </ol>
        ${code('css', "body {\n  font-family: 'Space Grotesk', sans-serif;\n}")}`,
      },
      {
        title: 'Flera selektorer samtidigt',
        body: `<p>Separera med komma:</p>
        ${code('css', 'h1, h2 {\n  font-weight: 700;\n}')}`,
      },
      {
        title: 'Fler egenskaper att testa',
        body: `<p>${c('text-transform: uppercase;')}, ${c('letter-spacing: 1px;')} och
        ${c('text-decoration: none;')} (tar bort understrykningen på länkar).</p>`,
      },
    ],
    cheatsheet: code(
      'css',
      `
body {
  font-family: system-ui, sans-serif;
}

h1 {
  font-size: 24px;
  font-weight: 700;
}

h2 {
  font-size: 40px;
  text-align: center;
}

p {
  line-height: 1.6;
}`
    ),
  },

  // 8 ────────────────────────────────────────────────────────────────────────
  {
    id: 'boxes',
    title: 'Box-modellen',
    intro: `
      <p>Varje element på en webbsida är en rektangel, en <strong>box</strong>. Varje box har fyra lager:</p>
      <div class="boxmodel">
        <div class="bm-margin"><span>margin</span>
          <div class="bm-border"><span>border</span>
            <div class="bm-padding"><span>padding</span>
              <div class="bm-content">content</div>
            </div>
          </div>
        </div>
      </div>
      <ul>
        <li>${c('padding')}: luft innanför kanten</li>
        <li>${c('border')}: kanten, t.ex. ${c('1px solid #d0d7de')}</li>
        <li>${c('margin')}: luft utanför kanten</li>
        <li>${c('border-radius')}: rundade hörn</li>
      </ul>
      <p>För att styla bara produkterna ger vi dem en <strong>klass</strong>. I CSS skriver man
      en punkt före klassnamnet:</p>
      ${code('html', '<article class="card">...</article>')}
      ${code('css', '.card {\n  border-radius: 12px;\n}')}
    `,
    tasks: [
      {
        text: `Lägg varje produkt (bild, namn och text) i en ${c('<article class="card">')}. Minst 3 st.`,
        check: (doc) => {
          const n = $$(doc, '.card').length
          if (n >= 3) return true
          return n === 0 ? noCards : `Hittar ${n} av 3 element med class="card".`
        },
      },
      {
        text: `Ge ${c('.card')} en ${c('background-color')}.`,
        check: (doc, win) => {
          const cards = $$(doc, '.card')
          if (!cards.length) return false
          return cards.every((el) => !isTransparent(css(win, el).backgroundColor))
        },
      },
      {
        text: `Ge ${c('.card')} ${c('padding')}.`,
        check: (doc, win) => {
          const cards = $$(doc, '.card')
          if (!cards.length) return false
          return cards.every((el) => px(css(win, el).paddingTop) > 0)
        },
      },
      {
        text: `Ge ${c('.card')} rundade hörn med ${c('border-radius')}.`,
        check: (doc, win) => {
          const cards = $$(doc, '.card')
          if (!cards.length) return false
          return cards.every((el) => px(css(win, el).borderTopLeftRadius) > 0)
        },
      },
    ],
    tips: [
      {
        title: 'Varför blir bredden som jag skrev?',
        body: `<p>I ${c('reset.css')} finns ${c('box-sizing: border-box;')}. Det betyder att
        padding och border räknas <em>in</em> i bredden. Ett kort med ${c('width: 280px;')}
        blir 280px brett, oavsett hur mycket padding du ger det. Utan den raden blir det
        bredare, något som förvirrat många utvecklare.</p>`,
      },
      {
        title: 'Vad betyder ".card img"?',
        body: `<p>Mellanslaget betyder "inuti". ${c('.card img')} träffar alla ${c('img')} som
        ligger i ett element med klassen ${c('card')}, men inga andra bilder.</p>`,
      },
      {
        title: 'Inspektera i webbläsaren',
        body: `<p>Öppna sidan i en egen flik (pilen uppe till höger i skärmen), högerklicka på ett
        element och välj <strong>Inspect</strong>. Där ser du box-modellen för varje element.
        Det är så utvecklare felsöker CSS.</p>`,
      },
      {
        title: 'Extra: skugga',
        body: `${code('css', '.card {\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);\n}')}`,
      },
    ],
    cheatsheet:
      code(
        'html',
        `
<article class="card">
  <img src="assets/images/product-1.svg" alt="Svarta over-ear-hörlurar" />
  <h3>Nordvik One</h3>
  <p>Over-ear med brusreducering och 40 timmars batteri.</p>
</article>`
      ) +
      code(
        'css',
        `
.card {
  background-color: white;
  padding: 16px;
  border: 1px solid #e1ddd5;
  border-radius: 12px;
}

.card img {
  border-radius: 8px;
}`
      ),
  },

  // 9 ────────────────────────────────────────────────────────────────────────
  {
    id: 'flexbox',
    title: 'Layout med Flexbox',
    intro: `
      <p>Just nu hamnar allt under varandra. <strong>Flexbox</strong> lägger saker bredvid
      varandra och är det vanligaste sättet att bygga layout på webben. Du sätter
      ${c('display: flex;')} på <em>föräldern</em>, alltså elementet som innehåller sakerna:</p>
      ${code(
        'css',
        `
.cards {
  display: flex;
  gap: 24px;
}`
      )}
      <ul>
        <li>${c('gap')}: avstånd mellan barnen</li>
        <li>${c('justify-content')}: fördelning i sidled (${c('center')}, ${c('space-between')} …)</li>
        <li>${c('align-items')}: placering i höjdled (${c('center')} …)</li>
      </ul>
    `,
    tasks: [
      {
        text: `Lägg korten i en ${c('<div class="cards">')} och ge den ${c('display: flex;')}.`,
        check: (doc, win) => {
          const card = $(doc, '.card')
          if (!card) return noCards
          return css(win, card.parentElement).display === 'flex'
        },
      },
      {
        text: `Lägg avstånd mellan korten med ${c('gap')}.`,
        check: (doc, win) => {
          const parent = $(doc, '.card')?.parentElement
          if (!parent) return false
          return px(css(win, parent).columnGap) > 0
        },
      },
      {
        text: `Gör ${c('header')} till en flexbox med loggan till vänster och menyn till höger
          (${c('justify-content: space-between;')}).`,
        check: (doc, win) => {
          const header = $(doc, 'header')
          if (!header) return missing('header')
          const s = css(win, header)
          return s.display === 'flex' && s.justifyContent === 'space-between'
        },
      },
      {
        text: `Centrera innehållet i headern i höjdled med ${c('align-items: center;')}.`,
        check: (doc, win) => {
          const header = $(doc, 'header')
          if (!header) return missing('header')
          return css(win, header).alignItems === 'center'
        },
      },
      {
        text: `Gör ${c('nav')} till en flexbox med ${c('gap')} mellan länkarna.`,
        check: (doc, win) => {
          const nav = $(doc, 'nav')
          if (!nav) return missing('nav')
          const flexWithGap = (el) => css(win, el).display === 'flex' && px(css(win, el).columnGap) > 0
          return flexWithGap(nav) || $$(doc, 'nav ul').some(flexWithGap)
        },
      },
    ],
    tips: [
      {
        title: 'Loggan och rubriken hamnar isär',
        body: `<p>Lägg loggan och ${c('<h1>')} i en ${c('<div class="brand">')} och gör den till
        en egen flexbox. Då har headern bara två barn, brand och nav, och
        ${c('space-between')} lägger dem i var sin kant.</p>`,
      },
      {
        title: 'Korten blir för smala i mobilen',
        body: `<p>${c('flex-wrap: wrap;')} på ${c('.cards')} låter korten hoppa ner på en ny rad
        när det inte får plats. Ge korten en bredd, t.ex. ${c('width: 260px;')}.</p>`,
      },
      {
        title: 'Extra: hover',
        body: `<p>${c(':hover')} gäller när muspekaren är över elementet:</p>
        ${code('css', '.card {\n  transition: transform 0.2s;\n}\n\n.card:hover {\n  transform: translateY(-4px);\n}')}`,
      },
      {
        title: 'Extra: favicon från public/',
        body: `<p>Filer i ${c('public/')} serveras från sajtens rot, utan att sökvägen ändras.
        Lägg till det här i ${c('<head>')} så får fliken en ikon:</p>
        ${code('html', '<link rel="icon" href="/favicon.svg" />')}`,
      },
    ],
    cheatsheet:
      code(
        'html',
        `
<header>
  <div class="brand">
    <img src="assets/images/logo.svg" alt="Nordvik Audio logotyp" />
    <h1>Nordvik Audio</h1>
  </div>
  <nav>
    <a href="#produkter">Produkter</a>
    <a href="#kontakt">Kontakt</a>
  </nav>
</header>
...
<div class="cards">
  <article class="card">...</article>
  <article class="card">...</article>
  <article class="card">...</article>
</div>`
      ) +
      code(
        'css',
        `
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

nav {
  display: flex;
  gap: 24px;
}

.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}`
      ),
  },

  // 10 ───────────────────────────────────────────────────────────────────────
  {
    id: 'variables',
    title: 'Variabler och flera CSS-filer',
    sources: ['assets/css/styles.css', 'assets/css/variables.css'],
    intro: `
      <p>Just nu står samma färg förmodligen på flera ställen i din CSS. Vill du byta den
      måste du hitta och ändra varje ställe. Med <strong>variabler</strong> skriver du värdet
      en gång, ger det ett namn och använder namnet överallt:</p>
      ${code(
        'css',
        `
:root {
  --color-brand: #e8613c;
  --space-md: 16px;
}

.card {
  border-color: var(--color-brand);
  padding: var(--space-md);
}`
      )}
      <ul>
        <li>${c(':root')} är hela sidan. Variabler som skapas där kan användas överallt.</li>
        <li>Namnet börjar alltid med två bindestreck: ${c('--color-brand')}.</li>
        <li>${c('var(--color-brand)')} hämtar värdet.</li>
      </ul>
      <p>I riktiga projekt kommer variablerna oftast direkt från designen. I Figma heter de
      ofta "variables" eller "tokens". De ligger i en egen fil, som hämtas in med
      ${c('@import')} högst upp i huvudfilen:</p>
      ${code('css', `@import './variables.css';`)}
      <p>Så är sluttestet uppbyggt, så det här är bra träning inför det.</p>
    `,
    tasks: [
      {
        text: `Skapa filen ${c('assets/css/variables.css')} med ett ${c(':root { }')} som innehåller minst 3 variabler.`,
        check: (doc, win, src) => {
          const file = src['assets/css/variables.css']
          if (file == null) return 'Filen assets/css/variables.css finns inte än.'
          const names = rootVariables(file)
          if (!/:root\s*\{/.test(stripComments(file))) return 'Hittar inget :root { } i variables.css.'
          return names.length >= 3 || `Hittar ${names.length} av 3 variabler i :root.`
        },
      },
      {
        text: `Hämta in den med ${c("@import './variables.css';")} allra först i ${c('styles.css')}.`,
        check: (doc, win, src) => {
          const styles = stripComments(src['assets/css/styles.css'] ?? '')
          if (!/@import\s+(url\()?\s*['"]?(\.\/)?variables\.css/.test(styles)) return false
          if (!/^\s*@import/.test(styles)) return '@import måste stå först i filen, före alla regler.'
          const name = rootVariables(src['assets/css/variables.css'] ?? '')[0]
          if (!name) return false
          return (
            css(win, doc.documentElement).getPropertyValue(name).trim() !== '' ||
            'Variablerna når inte sidan. Kolla sökvägen i @import.'
          )
        },
      },
      {
        text: `Byt ut hårdkodade värden i ${c('styles.css')} mot ${c('var(--...)')}. Minst 5 gånger.`,
        check: (doc, win, src) => {
          const n = (stripComments(src['assets/css/styles.css'] ?? '').match(/var\(--/g) ?? []).length
          return n >= 5 || `Du använder var() ${n} gånger i styles.css.`
        },
      },
      {
        text: `Använd samma variabel på minst två ställen, t.ex. din accentfärg.`,
        check: (doc, win, src) => {
          const uses = stripComments(src['assets/css/styles.css'] ?? '').match(/var\(\s*--[\w-]+/g) ?? []
          const counts = {}
          for (const u of uses) counts[u] = (counts[u] ?? 0) + 1
          return Object.values(counts).some((n) => n >= 2)
        },
      },
      {
        text: `Använd en avstånds-variabel (t.ex. ${c('--space-md')}) i en ${c('padding')}, ${c('margin')} eller ${c('gap')}.`,
        check: (doc, win, src) =>
          /(padding|margin|gap)[\w-]*\s*:[^;]*var\(--/.test(stripComments(src['assets/css/styles.css'] ?? '')),
      },
    ],
    tips: [
      {
        title: 'Testa kraften',
        body: `<p>När allt är klart: ändra färgen i ${c('variables.css')} och spara. Alla ställen
        som använder variabeln byter färg samtidigt.</p>`,
      },
      {
        title: 'Bra namn',
        body: `<p>Döp efter <em>vad värdet används till</em>, inte hur det ser ut. ${c('--color-brand')}
        är bättre än ${c('--orange')}: byter ni varumärkesfärg till blå blir ${c('--orange')} fel.</p>
        <p>Vanliga mönster: ${c('--color-…')}, ${c('--font-size-…')}, ${c('--space-…')}, ${c('--radius-…')}.</p>`,
      },
      {
        title: 'VS Code hjälper dig',
        body: `<p>Skriv ${c('var(--')} så föreslår VS Code alla variabler du har skapat.</p>`,
      },
      {
        title: 'Inget händer',
        body: `<p>Kolla stavningen: ${c('var(--color-brand)')} måste matcha namnet i ${c(':root')}
        exakt, med båda bindestrecken. En variabel som inte finns ger inget fel, värdet ignoreras bara.</p>`,
      },
    ],
    cheatsheet:
      code(
        'css',
        `
/* assets/css/variables.css */
:root {
  --color-text: #1f2328;
  --color-brand: #e8613c;
  --color-surface: #ffffff;
  --space-md: 16px;
  --radius: 12px;
}`
      ) +
      code(
        'css',
        `
/* assets/css/styles.css */
@import './variables.css';

body {
  color: var(--color-text);
}

a {
  color: var(--color-brand);
}

.card {
  background-color: var(--color-surface);
  padding: var(--space-md);
  border: 1px solid var(--color-brand);
  border-radius: var(--radius);
}`
      ),
  },

  // Sluttest ─────────────────────────────────────────────────────────────────
  {
    id: 'final',
    final: true, // låst tills steg 1–9 är klara
    page: '/final-test/', // skärmen visar sluttest-projektet
    viewportWidth: 1440, // designen är gjord för 1440px, skärmen skalar ned den
    title: 'Sluttest: Lumo',
    intro: `
      <p>Nu är det dags att bygga en riktig sida från en riktig design, precis som på en
      webbyrå. Designen är gjord i Figma för en skärm som är 1440px bred.</p>
      <a class="design-preview" href="/tutorial/final/design.png" target="_blank" title="Öppna i full storlek">
        <img src="/tutorial/final/design.png" alt="Figma-designen för Lumos startsida" />
      </a>
      <p><a href="https://www.figma.com/design/zEUSW5Peq4msD7mTdwkk3M/Figma-Course-Del-2?node-id=7-98" target="_blank">Öppna designen i Figma</a>
      för att mäta avstånd och se exakta värden.</p>

      <p>Projektet ligger i mappen ${c('final-test/')}. CSS:en är uppdelad i flera filer,
      som i ett riktigt projekt:</p>
      <ul>
        <li>${c('variables.css')}: alla färger, storlekar och avstånd från Figma. Färdig.</li>
        <li>${c('base.css')}: hur taggar som ${c('h1')}, ${c('p')} och ${c('a')} ser ut</li>
        <li>${c('layout.css')}: container, sektioner, header och footer</li>
        <li>${c('components.css')}: knappar, kort, loggan</li>
        <li>${c('main.css')}: hämtar in alla filer i rätt ordning</li>
      </ul>
      <p>Skärmen till höger visar sidan i 1440px, nedskalad så att den får plats.</p>
    `,
    tasks: [
      {
        text: `Header: logga, en ${c('<nav>')} med fyra länkar och en blå "Kom igång"-knapp.`,
        check: (doc, win) => {
          const header = $(doc, 'header')
          if (!header) return missing('header')
          if ($$(doc, 'header nav a').length < 4) return 'Headern behöver en <nav> med fyra länkar.'
          const cta = $$(header, '*').find((el) => text(el) === 'Kom igång')
          if (!cta) return 'Hittar ingen "Kom igång" i headern.'
          for (let el = cta; el && el !== header; el = el.parentElement) {
            if (css(win, el).backgroundColor === 'rgb(59, 130, 246)') return true
          }
          return 'Knappen "Kom igång" ska ha färgen var(--color-brand-primary).'
        },
      },
      {
        text: `Hero: en ${c('<h1>')} i ${c('--font-size-display')} (48px) och två knappar.`,
        check: (doc, win) => {
          const h1 = $(doc, 'h1')
          if (!h1) return missing('h1')
          if (css(win, h1).fontSize !== '48px') return 'Rubriken ska ha font-size: var(--font-size-display).'
          const hero = h1.closest('section') ?? h1.parentElement
          const buttons = $$(hero, 'a, button').filter((el) => !isTransparent(css(win, el).backgroundColor))
          return buttons.length >= 2 || 'Hittar inte två knappar med bakgrundsfärg bredvid rubriken.'
        },
      },
      {
        text: `Bilder: ${c('hero.png')} med rundade hörn och tre ${c('avatar.png')} i kontaktkorten.`,
        check: (doc, win) => {
          const hero = $$(doc, 'img[src*="hero.png"]').filter(imgLoaded)
          if (!hero.length) return 'Hittar ingen hero.png som laddar.'
          if (!hero.some((img) => px(css(win, img).borderTopLeftRadius) > 0))
            return 'Hero-bilden ska ha border-radius: var(--radius-card).'
          return $$(doc, 'img[src*="avatar.png"]').filter(imgLoaded).length >= 3
        },
      },
      {
        text: `Logo-raden: ACME, Nordic, Kvadrat, Bolt och Hemma på en rad.`,
        check: (doc) => {
          const logos = ['ACME', 'Nordic', 'Kvadrat', 'Bolt', 'Hemma'].map((t) => findByText(doc, t))
          if (logos.some((el) => !el)) return false
          return sameRow(logos) || 'Namnen ligger inte på en rad än.'
        },
      },
      {
        text: `Funktioner: tre kort bredvid varandra, med kant och rundade hörn.`,
        check: (doc, win) => {
          const titles = ['Små steg', 'Ingen press', 'Dina data'].map((t) => findByText(doc, t))
          if (titles.some((el) => !el)) return false
          const cards = titles.map((el) => roundedAncestor(win, el))
          if (cards.some((el) => !el)) return 'Korten saknar rundade hörn (var(--radius-card)).'
          if (!cards.every((el) => px(css(win, el).borderTopWidth) >= 1)) return 'Korten saknar kant (border).'
          return sameRow(cards) || 'Korten ligger inte bredvid varandra än.'
        },
      },
      {
        text: `Innehåll: bilden till vänster och texten till höger.`,
        check: (doc) => {
          const heading = findByText(doc, 'Byggt för vardagen, inte för appbutiken')
          if (!heading) return false
          const section = heading.closest('section') ?? heading.parentElement.parentElement
          const img = section && $(section, 'img[src*="hero.png"]')
          if (!img) return 'Lägg hero.png i samma sektion som rubriken.'
          return (
            img.getBoundingClientRect().right <= heading.getBoundingClientRect().left + 1 ||
            'Bilden ska ligga till vänster om texten.'
          )
        },
      },
      {
        text: `Kontakt: tre kontaktkort bredvid varandra, med centrerad text.`,
        check: (doc, win) => {
          const names = ['Anna Berg', 'Erik Lund', 'Sara Holm'].map((t) => findByText(doc, t))
          if (names.some((el) => !el)) return false
          if (!sameRow(names)) return 'Kontaktkorten ligger inte bredvid varandra än.'
          return names.every((el) => css(win, el).textAlign === 'center') || 'Texten i kontaktkorten ska vara centrerad.'
        },
      },
      {
        text: `Footer: tre länkkolumner (Produkt, Företag, Hjälp) bredvid varandra.`,
        check: (doc) => {
          if (!$(doc, 'footer')) return missing('footer')
          const cols = ['Produkt', 'Företag', 'Hjälp'].map((t) => findByText(doc, t))
          if (cols.some((el) => !el)) return false
          return sameRow(cols) || 'Kolumnerna ligger inte bredvid varandra än.'
        },
      },
      {
        text: `Använd variablerna: minst 30 ${c('var(--...)')} i din CSS, i stället för hårdkodade värden.`,
        check: (doc) => {
          const n = countVarUsage(doc)
          return n >= 30 || `Du använder var() ${n} gånger hittills.`
        },
      },
    ],
    tips: [
      {
        title: 'Arbetsordning',
        body: `<ol>
          <li>Skriv HTML för en sektion i taget, uppifrån och ned.</li>
          <li>Styla den sektionen, och jämför med designen.</li>
          <li>Gå vidare till nästa.</li>
        </ol>
        <p>Det är lättare att hitta fel när man bara har ändrat lite i taget.</p>`,
      },
      {
        title: 'Variabler med var()',
        body: `<p>Skriv aldrig ${c('#3b82f6')} direkt. Använd variabeln i stället:</p>
        ${code('css', '.btn--primary {\n  background-color: var(--color-brand-primary);\n  border-radius: var(--radius-button);\n}')}
        <p>Börja skriva ${c('var(--')} så föreslår VS Code alla variabler.</p>`,
      },
      {
        title: 'Container: centrera innehållet',
        body: `<p>Innehållet är max 1200px brett och centrerat. Lägg en ${c('<div class="container">')}
        i varje sektion:</p>
        ${code('css', '.container {\n  max-width: var(--container-width);\n  margin: 0 auto;\n}')}`,
      },
      {
        title: 'Klassnamn som håller (BEM)',
        body: `<p>Ett vanligt sätt att namnge klasser:</p>
        <ul>
          <li>${c('.card')}: en komponent</li>
          <li>${c('.card__icon')}: en del <em>inuti</em> komponenten (två understreck)</li>
          <li>${c('.btn--primary')}: en <em>variant</em> av komponenten (två bindestreck)</li>
        </ul>
        ${code('html', '<a class="btn btn--primary" href="#">Kom igång</a>')}`,
      },
      {
        title: 'Tre kort bredvid varandra',
        body: `<p>Flexbox, och låt korten dela lika på bredden med ${c('flex: 1')}:</p>
        ${code('css', '.cards {\n  display: flex;\n  gap: var(--space-card);\n}\n\n.card {\n  flex: 1;\n}')}`,
      },
      {
        title: 'Bilden blir utdragen',
        body: `<p>Ge bilden en fast bredd och höjd och låt den beskäras i stället för att töjas:</p>
        ${code('css', '.split__image {\n  width: 560px;\n  height: var(--image-height);\n  object-fit: cover;\n}')}`,
      },
      {
        title: 'Mät i Figma',
        body: `<p>Markera ett element i Figma och håll ned <kbd>Option</kbd> medan du för musen över
        ett annat. Då ser du avståndet mellan dem. I Dev Mode ser du padding, gap och vilken
        variabel som används.</p>`,
      },
    ],
  },
]
