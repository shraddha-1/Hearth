# Hearth

A tiny handcrafted 3D fantasy village builder that runs in the browser. No build step, no framework: plain HTML, CSS and JavaScript (ES modules) with [three.js](https://threejs.org/).

Name your village, then place houses, plants, a pond, a well, a farm, a central barn, a market square and a kids garden. Drag things around, click a roof to add a storey, rename buildings and recolour their walls, timber, roof, shutters and doors.

## Run it locally

ES modules need to be served over HTTP (opening `index.html` from the file system will not work). Any static server is fine:

```bash
# Python
python3 -m http.server 8080

# or Node
npx serve .
```

Then open <http://localhost:8080>.

## Publish on GitHub Pages

1. Create a new repository and push these files to the `main` branch.
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, then save.
4. After a minute your village is live at `https://<your-username>.github.io/<repository-name>/`.

## Project structure

```
index.html            page shell and UI markup
css/style.css         all styles (desktop and mobile)
js/main.js            scene, camera, UI, placing, dragging, selecting
js/buildings.js       the six building styles, colours, names
js/roofs.js           gable, cone and pyramid roofs
js/parts.js           windows, doors, balconies, signs and other details
js/core.js            procedural textures, materials, geometry merging
js/plants.js          trees, flowers and bushes
js/features.js        pond, well, farm, barn, market square and kids garden
js/people.js          animated villagers and workers
js/icons.js           3D menu icons (img/icons, baked from the models)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
js/butterflies.js     procedural butterflies (wing textures, flight)
fonts/                Cinzel Decorative and Nunito (woff2)
vendor/three/         three.js r166 (module build plus the few add-ons used)
```

## Credits and licences

- Coded with Claude Code.
- [three.js](https://threejs.org/): MIT (`vendor/three/LICENSE`).
- Fonts [Nunito](https://fonts.google.com/specimen/Nunito) and [Cinzel Decorative](https://fonts.google.com/specimen/Cinzel+Decorative): SIL Open Font License 1.1, free to use and redistribute.
