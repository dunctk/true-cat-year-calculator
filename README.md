# True Cat Years
An open-source, mobile-first **cat years to human years calculator** using a maturity-adjusted analogy anchored to the longest verified feline and human lives.

## Blender production kit (separate from the live site)

The original anime/Parisian cat redesign is now organised in [blender/](blender/README.md). Coding agents with Blender installed should start with [the art director brief](blender/AGENT_BRIEF.md), see the [four-stage cat turnaround](blender/references/character-turnaround.svg) and [Paris lighting reference](blender/references/paris-lighting.svg), then run the starter scene generator. The script makes an editable Blender BLOCKOUT and matched-camera preview renders; it is **not a polished 3D character yet**. These Blender studies are an optional offline production kit; the deployed site uses independent, lightweight original vector artwork.

## What makes it different?
- 7× cat years assumes a fixed rate of ageing. Our baseline is the verified longevity-record percentage with a rapidly fading boost for early maturation.
- The curve is anchored to **Creme Puff (38 years, 3 days)** and **Jeanne Calment (122 years, 164 days)**. We deliberately model 2 cat years as **17 human years** (a subjective teenage analogy, not a scientific conversion), while 15 and 20 cat years remain close to the longevity-record percentage.
- Toggle a direct percentage-of-record conversion, and compare the result with the familiar veterinary life-stage chart and the simplistic 7× rule.
- A **separate** empirical survival chart (Teng et al., 2024) avoids conflating biological age with observed mortality.
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

Run `node --test tests/*.test.cjs` locally. No workflow, dependencies or Actions minutes.

## English and Spanish

- English: [catyear.pages.dev/](https://catyear.pages.dev/), Spanish: [catyear.pages.dev/es/](https://catyear.pages.dev/es/).
- `es/index.html` is a standalone, indexable translation; assets and age models are shared from the repository root. Both pages declare self-canonicals and reciprocal `hreflang` links, also listed in `sitemap.xml`.
- UI calculations, data and chart logic stay identical. Shared scripts localize age-stage names, scene captions, day/night labels, copying/sharing messages and the table. Decimal commas are for display only: sliders, CSS widths and URL query parameters retain machine-readable decimal points.
- The EN/ES switch preserves the currently selected age, conversion method and optional 3D view. No geolocation, redirect or language cookie is needed.
- Run `node --test tests/*.test.cjs` to check both language pages and the calculation anchors.

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
- styles.css — foundational responsive design
- storyboard.css — anime storybook art direction, layouts, portrait-mode controls and accessible motion handling
- storybook.js — SVG portrait growth, chapter captions and optional 3D-mode switch
- model.js — pure, independently testable age-conversion model
- app.js — accessible controls, SVG charts, URL sharing and age→cat scene updates
- cat-growth.js — pure, testable kitten-to-adult growth and proportion model
- cat-scene.js — optional native WebGL portrait with frame loop suspended when the illustrated version is selected
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
## Original anime illustrated portrait (default) and optional WebGL

The first viewport opens with an original, hand-authored **inline SVG anime cat**: rich ink outlines, reflective eyes, blush, a warm cel-shaded coat and a ribbon with a gold charm. The age controls change the cat's pose proportions, subtle senior silver accents, the chapter number and the narrative caption. There is no network-loaded artwork, library or external font. The SVG is also a reliable fallback without GPU acceleration.

Visitors can opt into the original **native WebGL 1.0 3D character** using the Illustration / 3D switch. The 3D option is disabled if rendering is unsupported. The WebGL animation loop is paused whenever the illustrated mode is active; switching back resumes it. Shareable links preserve `age`, `method`, and the optional `view=3d`. Both portraits remain illustrations, **not** biological-age measurements or predictions.

The scene's Parisian time-of-day remains deterministically tied to the age slider. Portrait blinks and subtle tail movement respect `prefers-reduced-motion`. The life-stage tiles are keyboard-accessible buttons that jump to representative ages.

### Cat growth design

In the stylised 3D portrait, total character size grows smoothly from 43% (newborn) to full adult size by 2.5 cat years, while relative head, body, leg and muzzle proportions also mature. Paws remain grounded through the scale change. The numerical years conversion remains unchanged. Senior greying is subtle and illustrative rather than a health or diagnostic claim. Run the pure-model checks with `node --test tests/cat-growth.test.cjs`.

## Parisian anime storybook identity

The site uses an original illustrated Paris balcony, warm ivory paper, lavender shadows, rose controls, antique-gold details, and oversized editorial serif typography. It is visually inspired by mid-century Parisian animation and Japanese anime backgrounds without copying characters or artwork. The calculator remains above the fold, stays interactive and remains dependency-free. The inline anime portrait takes priority by default, while the WebGL character retains cel-shaded artwork in `cat-scene.js`.

## WebGL character refinement

The original October anime restyle looked uncanny because of glued-on spheres, bulging eye layers and black ear-cones. The current lightweight native WebGL character has triangular 3D ears, much smaller embedded almond eyes, a short feline muzzle, subtle mouth and whiskers, a tapered curved tail and a sitting silhouette with calmer proportions. The shader uses *matte* pastel cel shading (no shiny plastic highlights). The existing `cat-growth.js` remains the only source for overall age-to-size changes; feet stay grounded and animation respects reduced-motion. The picture remains artistic rather than medical.

## Paris age-slider timelapse

The Paris balcony's backdrop **only changes when the cat's age changes**. To evoke years flying past, **every two cat years scrub one full fast-forward Parisian day/night cycle** (sunrise → day → sunset → moon/stars and illuminated windows → dawn). There are about 19 cycles between birth and Creme Puff's record age, instead of a single stretched-out day for the whole lifespan. Dragging backwards reverses the cycles. The background stays completely still when the slider stops; year/month inputs, age presets, reset and shareable links select the same deterministic storyboard frame. No timer or autoplay is involved. The existing slight background blur stays in place while the WebGL cat remains crisp and independently morphs with the age slider. No videos, network calls, timers or new dependencies; this behaviour respects reduced-motion users because it changes only in response to age input, never on its own.

