# True Cat Years
An open-source, mobile-first **cat years to human years calculator** using a maturity-adjusted analogy anchored to the longest verified feline and human lives.

## What makes it different?
- 7× cat years assumes a fixed rate of ageing. We model faster early development with a power curve.
- The curve is anchored to **Creme Puff (38 years, 3 days)** and **Jeanne Calment (122 years, 164 days)** and constrained to map 2 cat years to 24 human years.
- Toggle a direct percentage-of-record conversion, and compare the result with the familiar veterinary life-stage chart and the simplistic 7× rule.
- A **separate** empirical survival chart (Teng et al., 2024) and kidney disease treatment evidence avoid conflating biological age with observed mortality.
- Explicitly **not** a medically validated predictor of biological age or an individual cat's remaining lifespan.

## Equation
H = Hmax × (C / Cmax)^p
where Cmax = 38 + 3/365.2425, Hmax = 122 + 164/365.2425, and p = ln(24/Hmax)/ln(2/Cmax).

## Hosting: Cloudflare Pages (no GitHub Actions)
Pure HTML, CSS and vanilla JavaScript: **no build step, dependencies, or GitHub Actions**. The site is safe to serve from the repository root, from a GitHub Pages repository subpath, or via Cloudflare Pages.

To publish without using GitHub Actions:
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Choose GitHub and select **dunctk/true-cat-year-calculator**, branch **main**.
3. Set **Framework preset: None**, **Build command: empty**, **Build output directory: /** (repository root, or leave the documented default for static HTML in your dashboard).
4. Deploy. Every push to main updates the site with Cloudflare's Git integration, without GitHub Actions minutes.
5. Optionally attach a custom domain and update SEO canonical/OG URLs once the actual public address is known.

Alternatively, GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root). GitHub Pages still triggers its own Actions-powered deployment workflow, so Cloudflare is recommended when avoiding Actions minutes is important.

## Files
- index.html — accessible content and citations
- styles.css — responsive visual design
- app.js — age conversion, accessible controls, SVG charts and URL sharing
- favicon.svg — brand favicon
- .nojekyll — prevents Jekyll processing if served via GitHub Pages

## Evidence
- [Guinness: Oldest cat](https://www.guinnessworldrecords.com/world-records/oldest-cat-ever)
- [Guinness: Oldest person](https://www.guinnessworldrecords.com/world-records/oldest-person)
- [AAHA/AAFP 2021 feline life stages](https://www.aaha.org/resources/2021-aaha-aafp-feline-life-stage-guidelines/feline-life-stage-definitions/)
- [Teng et al. 2024, UK VetCompass life tables](https://doi.org/10.1177/1098612X241234556)
- [ISFM CKD treatment guidelines](https://pmc.ncbi.nlm.nih.gov/articles/PMC11148907/)

## Privacy and maintenance
Fully client-side. No cookies, analytics, API calls, fonts or third-party JS. Run on any static server or simply open index.html. All medical and longevity values are sourced or explicitly identified as illustrative.

Licensed under the repository's LICENSE.