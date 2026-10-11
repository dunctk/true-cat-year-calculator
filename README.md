# True Cat Years
An open-source, mobile-first **cat years to human years calculator** using a maturity-adjusted analogy anchored to the longest verified feline and human lives.

## What makes it different?
- 7× cat years assumes a fixed rate of ageing. Our baseline is the verified longevity-record percentage with a rapidly fading boost for early maturation.
- The curve is anchored to **Creme Puff (38 years, 3 days)** and **Jeanne Calment (122 years, 164 days)**. We deliberately model 2 cat years as **17 human years** (a subjective teenage analogy, not a scientific conversion), while 15 and 20 cat years remain close to the longevity-record percentage.
- Toggle a direct percentage-of-record conversion, and compare the result with the familiar veterinary life-stage chart and the simplistic 7× rule.
- A **separate** empirical survival chart (Teng et al., 2024) and kidney disease treatment evidence avoid conflating biological age with observed mortality.
- Explicitly **not** a medically validated predictor of biological age or an individual cat's remaining lifespan.

## Equation
H(C) = r*C + B*C*exp(-C/3)*(1-C/Cmax)

- Cmax = 38 + 3/365.2425 (cat longevity record), Hmax = 122 + 164/365.2425 (human longevity record)
- r = Hmax/Cmax ≈ 3.221646
- B = (17 - 2*r) / (2*exp(-2/3)*(1-2/Cmax)) ≈ 10.8518563
- Decay scale = 3 cat years, chosen for a modest, early-concentrated correction.
- Thus H(0)=0, H(2)=17, H(15)≈49.0, H(20)≈64.6, and H(Cmax)=Hmax.

The formula is a designed analogy with transparent assumptions, **not a validated biological-age model**. Cats aged 1–6 are classified as young adults in the [AAHA/AAFP guidelines](https://www.aaha.org/resources/2021-aaha-aafp-feline-life-stage-guidelines/feline-life-stage-definitions/); the guideline does not prescribe an age conversion to humans.

## Tests

Run `node --test tests/model.test.cjs` locally. No workflow, dependencies or Actions minutes.

## Hosting: Cloudflare Pages (no GitHub Actions)
Pure HTML, CSS and vanilla JavaScript: **no build step, dependencies, or GitHub Actions**. The site is safe to serve from the repository root, from a GitHub Pages repository subpath, or via Cloudflare Pages.

To publish without using GitHub Actions:
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Choose GitHub and select **dunctk/true-cat-year-calculator**, branch **main**.
3. Set **Framework preset: None**, **Build command: empty**, **Build output directory: /** (repository root, or leave the documented default for static HTML in your dashboard).
4. Deploy. Every push to main updates the site with Cloudflare's Git integration, without GitHub Actions minutes.
5. The live production URL is [https://catyear.pages.dev/](https://catyear.pages.dev/) and the site's canonical URL and Open Graph metadata point there.

Alternatively, GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root). GitHub Pages still triggers its own Actions-powered deployment workflow, so Cloudflare is recommended when avoiding Actions minutes is important.

## Files
- index.html — accessible content and citations
- styles.css — responsive visual design
- model.js — pure, independently testable age-conversion model
- app.js — accessible controls, SVG charts, URL sharing and age→cat scene updates
- cat-growth.js — pure, testable kitten-to-adult growth and proportion model
- cat-scene.js — standalone procedural WebGL cat, ground-planted full-body growth, progressive ageing, reduced-motion & 2D fallback
- tests/model.test.cjs — zero-dependency Node tests of anchors and monotonicity
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
## Interactive 3D portrait

The calculator and its slider are now in the opening viewport. The accompanying character is rendered with **native WebGL 1.0**, without Three.js, network fonts, external assets or build tools. Its mesh proportions, eyes, ear/whisker details, warm fur tint and later-life silver fur transition smoothly as age changes. Animated breathing and an occasional blink stop when motion reduction is requested or the scene leaves the viewport. A bundled SVG appears if WebGL is unavailable. This is an *illustration*, not a claim that individual cats physically age in this pattern.

### Cat growth design

In the stylised 3D portrait, total character size grows smoothly from 43% (newborn) to full adult size by 2.5 cat years, while relative head, body, leg and muzzle proportions also mature. Paws remain grounded through the scale change. The numerical years conversion remains unchanged. Senior greying is subtle and illustrative rather than a health or diagnostic claim. Run the pure-model checks with `node --test tests/cat-growth.test.cjs`.

## Parisian anime storybook identity

The site uses an original illustrated Paris balcony, warm ivory paper, Paris blue, dusty-rose controls, antique-gold details, and oversized editorial serif typography. It is visually inspired by mid-century Parisian animation and Japanese anime backgrounds without copying characters or artwork. The calculator remains above the fold, stays interactive and remains dependency-free. The WebGL character receives corresponding cel-shaded artwork in `cat-scene.js`.
