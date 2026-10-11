# Agent Brief: True Cat Years — premium 3D cat

You are a senior Blender character artist, technical artist and Python engineer. Work in the GitHub repository dunctk/true-cat-year-calculator. Read blender/README.md and the two SVG references before changing anything. Inspect cat-growth.js, cat-scene.js and the live site.

## Assignment

Create a delightful, original, anime-influenced Parisian storybook 3D cat for a mobile-first interactive cat-age calculator. It should feel like a still from an expensive hand-painted animation film: charming and feline, not a robot, plastic toy, cartoon person, or stack of spheres. The supplied Blender starter is an intentional BLOCKOUT. Improve it.

Art language: elegant feline anatomy; continuous silhouette; creamy ivory fur with delicate warm accents; quiet sea-glass eyes with inset almond pupils; small triangular ears with thickness; subtle sculpted fur tufts; flowing tapered tail; a narrow dusty rose silk bow and antique gold bell. Matte cel-shaded material with painterly variation, gentle ink edges and lighting-aware highlights. Original art only: do not copy Disney characters, names, logos, animation cels or copyrighted stills.

## Hard rules

- **One recognisable cat identity at all ages**. Four QA checkpoints: 0, 2, 10 and 25 cat years.
- Newborn is ~43% of adult overall size, with large relative head and short legs. By ~2.5 years the cat reaches adult size, matching cat-growth.js. Then adult height stays fixed.
- 2-year-old is youthful and slightly lanky, not a humanised toddler. 10-year-old is the hero character: elegant and calm. At 25 years, the same cat subtly greys and relaxes; do not portray illness or distress.
- Natural feline muzzle, embedded eyes, gently sculpted cheeks, correct front-leg and haunch silhouette. No exaggerated grin, false eyebrows, glued-on eyes or ear cones.
- At 240 px wide the cat must remain readable and appealing.
- Preserve stable topology and morph target names; blend age poses continuously. Ground contact must not shift when scale changes.
- Use Blender 4.2+ EEVEE for fast previews, accessible source scene, reasonable geometry budget.
- Do not update the website's WebGL renderer until the character renders are reviewed and explicitly approved.

## Scene and colour

Scene: Paris apartment balcony with a faint view of the Eiffel Tower, blush flowers, wrought-iron railing and a pink velvet cushion. Keep the cat crisp, background softly painterly and slightly out of focus. Background timeline in the website runs through repeated Paris day-night cycles **only while the age slider is being moved**. The 3D cat lighting must track sun/sky/moon states when later integrated.

Palette: cream #F5E9D9, Paris ink #344754, rose #B97A8F, jade eye #85B9AC, antique gold #D8B37B, night blue #27365F. Mood: tender, confident, cinematic; never horror-uncanny.

## Rendering and acceptance

Start by running the repo's Blender generator and inspecting its renders. The generator makes a placeholder character, NOT the final art.

Produce same-camera previews at age 0, 2, 10, 25; a front/three-quarter/side turnaround; a strip of dawn/day/golden hour/night lighting. Include a beauty render without the balcony so silhouette quality is clear. Iterate on the face and character shape before decorating.

Deliver an editable scene.blend and exportable cat.glb with actual named age morph targets, no baked Paris background in the character export. Target up to ~25k triangles, max two 1024px textures and <=2 MB web GLB if possible, but visual quality comes first. Record measured triangle count, GLB size and mobile performance estimates.

Reject until:
1. The same cat is recognisable and beautiful at all ages.
2. All age morphs are smooth and non-discontinuous.
3. No visually intersecting geometry, face bulges or floating paws.
4. The cat doesn't look like the former procedural sphere mascot.
5. Surface shading is matte, not shiny plastic.
6. Foreground contacts and light direction match the environment.
7. Renders and editable source are committed; report exact Blender version and commands used.

## Handoff

Agent should run:

~~~bash
blender --background --python blender/scripts/build_scene.py -- --output-dir blender/output
blender --background blender/output/scene.blend --python blender/scripts/validate_scene.py
~~~

Use the illustrated SVG references in blender/references. Generate initial renders and compare them visually before attempting GLB export or website changes. Do not claim tests you have not run.