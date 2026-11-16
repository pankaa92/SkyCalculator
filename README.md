# SkyCalc

A dark-mode arithmetic calculator with a sky blue theme, keyboard support, and a persistent calculation tape.

## Development

```bash
npm install
npm run dev
```

## Static Build

```bash
npm run build
```

The production static site is generated in the `dist/` directory with relative asset paths (`base: './'`).

## Deploying to GitHub Pages

Do **not** point GitHub Pages at the unbuilt repository root (`/` on `main`), because the root `index.html` references `/src/main.tsx` which browsers cannot execute directly and will show a blank white page.

### Option 1: Automatic via GitHub Actions (Recommended)

This repository includes `.github/workflows/deploy.yml`.

1. Push the project to GitHub (`main` or `master` branch).
2. Open your repository **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The workflow automatically runs `npm run build` and deploys `dist/` to GitHub Pages.

### Option 2: Manual Static Upload / Netlify / Vercel

- **Netlify / Vercel**: Connect the repository with build command `npm run build` and output directory `dist`.
- **Manual upload**: Run `npm run build` locally and deploy the contents of the `dist/` folder.
