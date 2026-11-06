# HTML & CSS – grunderna

En liten HTML/CSS-tutorial för nybörjare. Eleven bygger en produktsida för det påhittade
företaget **Nordvik Audio** i 10 steg, i riktiga filer i VS Code, med live-förhandsvisning.

## Kom igång

```bash
npm install
npm run dev
```

Öppna sedan mappen i VS Code. Servern startar automatiskt via `.vscode/tasks.json`
(VS Code frågar en gång om automatiska tasks får köras, välj **Allow**).
Webbläsaren öppnar `http://localhost:5173/tutorial/`.

## Vad eleven ser

`.vscode/settings.json` döljer allt utom sajtfilerna i VS Codes filträd:

```
index.html
assets/css/styles.css
assets/images/
public/favicon.svg
```

## Hur det funkar

- `tutorial/` är tutorial-skalet: uppgifter, tips, fusklapp och automatiska bockar.
  Lektionerna finns i `tutorial/steps.js`.
- Skärmen till höger är en iframe som visar `/` (elevens `index.html`).
  CSS-ändringar hot-reloadas, HTML-ändringar laddar bara om iframen.
- Skalet serveras utan Vites HMR-klient (se `vite.config.js`), så panelen laddas inte om
  när eleven sparar.
- Progress sparas i webbläsarens localStorage.

## Återställ

```bash
npm run reset
```

Kopierar `tutorial/starter/` över `index.html`, `assets/` och `public/`. Tips: kör
`git init` och committa efter varje steg, så kan ni gå tillbaka mer exakt.

## Facit

`tutorial/solution/` innehåller en färdig version där alla steg är gröna.

## Sluttest: Lumo

När steg 1–10 är klara låses fliken **Test** upp. Eleven bygger då Lumos startsida från
[Figma-designen](https://www.figma.com/design/zEUSW5Peq4msD7mTdwkk3M/Figma-Course-Del-2?node-id=7-98)
i mappen `final-test/`. Skärmen visar sidan i 1440px, nedskalad.

- `final-test/assets/css/variables.css` innehåller alla tokens från Figma (färger, typografi,
  avstånd, radier). `main.css` importerar `reset → variables → base → layout → components`.
- Facit: `tutorial/final/solution/`. Designbilden: `tutorial/final/design.png`.
- Förhandsgranska testet utan att göra klart stegen: `http://localhost:5173/tutorial/?unlock`
- Återställ: `npm run reset:final`
