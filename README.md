<div align="center">

```
██████╗ ██╗███████╗███████╗ ██████╗ 
██╔══██╗██║██╔════╝╚════██║██╔═████╗
██████╔╝██║█████╗      ██╔╝██║██╔██║
██╔═══╝ ██║██╔══╝     ██╔╝ ████╔╝██║
██║     ██║███████╗   ██║  ╚██████╔╝
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═════╝ 
```

# ⚡ Piezoelectric Footstep Power Generator
### *A 3D Scrollytelling Learning Project*

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-Visit_Now-A855F7?style=for-the-badge&labelColor=0b0c14)](https://hix-001.github.io/Piezoelectric_System/)
[![GitHub](https://img.shields.io/badge/GitHub-Hix--001-60a5fa?style=for-the-badge&logo=github&labelColor=0b0c14)](https://github.com/Hix-001)
[![Built With](https://img.shields.io/badge/Built_With-React_Three_Fiber-orange?style=for-the-badge&labelColor=0b0c14)](https://docs.pmnd.rs/react-three-fiber)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-22c55e?style=for-the-badge&labelColor=0b0c14)](https://pages.github.com/)

<br/>

> *"I built this to learn — and honestly had way too much fun doing it."*

<br/>

**[→ Open the live experience](https://hix-001.github.io/Piezoelectric_System/)**

</div>

---

## 🧠 What & Why

This is a **learning project** — plain and simple. I wanted to understand how modern 3D scrollytelling websites work after getting obsessed with sites like [chkstepan.com](https://chkstepan.com), [killianherzer.com](https://killianherzer.com), and [darkstarlabs.io](https://darkstarlabs.io). The goal wasn't to ship a product — it was to answer the question:

> *How do you take a real engineering concept and turn it into an immersive, cinematic web experience?*

The engineering topic — a **Piezoelectric Footstep Power Generator** — is real. Piezoelectric tiles can generate electricity from the pressure of footsteps. I used it as the theme because it's visual, layered, and actually interesting to explain in 3D.

What you'll find here is me learning React Three Fiber, WebGL post-processing, scroll-driven camera animation, and shader effects — all stitched together into something that hopefully looks intentional.

---

## 🎬 The Experience

The site is a **5-section scroll journey** through the assembly and function of a piezoelectric energy system:

| # | Section | What Happens |
|---|---------|-------------|
| 01 | **Energy Harvesting** | The full 3D mat assembly rotates slowly in the dark |
| 02 | **Sensing Matrix** | The foam top layer lifts to reveal 6 glowing piezo sensors |
| 03 | **AC-to-DC Conditioning** | Camera dives into the PCB — glitch & chromatic aberration fire |
| 04 | **Lithium-Ion Storage** | White spark particles fly from sensors into the batteries |
| 05 | **Conclusion** | Wide cinematic pullback with full purple bloom glow |

Every section has animated text, a tag line, and a body description — all synced to scroll progress, no click required.

---

## 🛠 Tech Stack

This project uses a fully **browser-side, zero-cost** architecture. No backend. No paid APIs. Deployed for free on GitHub Pages.

### Core

| Tool | Version | Purpose |
|------|---------|---------|
| [React](https://react.dev/) | 18 | Component model and state |
| [Vite](https://vitejs.dev/) | 5 | Bundler and dev server |
| [Three.js](https://threejs.org/) | 0.169 | 3D math, geometry, materials |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 8 | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | 9 | Three.js helpers (MeshTransmission, Stars, ContactShadows, etc.) |
| [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) | 2 | Bloom, Glitch, ChromaticAberration |
| [Framer Motion](https://www.framer.com/motion/) | 11 | HTML text animations and loading screen |

### 3D Components (all procedural — no model files)

```
EnergyMat Assembly
├── Base substrate (BoxGeometry + dark metallic material)
├── Circuit traces (3 thin boxes with emissive blue glow)
├── Foam top layer (MeshTransmissionMaterial — frosted glass)
├── 6× Piezo Sensors (CylinderGeometry + TorusGeometry rings + PointLight)
├── PCB board (BoxGeometry + orange emissive material)
├── 2× 18650 Batteries (CylinderGeometry + purple emissive)
├── Connecting Wires (QuadraticBezierCurve3 → TubeGeometry)
└── Spark Particles (BufferGeometry points flying sensor → battery)
```

### Fonts

| Font | Weight | Used For |
|------|--------|---------|
| [Syne](https://fonts.google.com/specimen/Syne) | 700, 800 | Section headings |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | 300, 400 | Body text |
| [Space Mono](https://fonts.google.com/specimen/Space+Mono) | 400, 700 | Technical labels, tags |

---

## 🚀 Run It Locally

You need **Node.js v18+** installed. That's it.

### 1. Clone the repo

```bash
git clone https://github.com/Hix-001/Piezoelectric_System.git
cd Piezoelectric_System
```

### 2. Install dependencies

```bash
npm install
```

> This pulls down Three.js, React Three Fiber, and friends (~350MB in `node_modules`). Normal. Don't push `node_modules` to git.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Hot reload is on — any change to `src/App.jsx` or `src/App.css` reflects instantly.

### 4. Build for production

```bash
npm run build
```

Output goes to `/dist`. You can preview it locally with:

```bash
npm run preview
```

### File Structure

```
Piezoelectric_System/
│
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions auto-build & deploy
│
├── src/
│   ├── App.jsx                 ← All 3D components + scroll logic + UI
│   ├── App.css                 ← Full dark stylesheet
│   └── main.jsx                ← React entry point
│
├── index.html                  ← Google Fonts + root div
├── vite.config.js              ← Build config + GitHub Pages base path
├── package.json
└── package-lock.json
```

### Troubleshooting

**Blank white page on localhost?**
Make sure `src/main.jsx` exists. It's the React entry point — without it nothing renders.

**Site works locally but broken on GitHub Pages?**
Check `vite.config.js`. The `base` field must exactly match your repo name:
```js
base: '/Piezoelectric_System/',  // capital P, capital S
```

**Low FPS / laggy?**
The `PerformanceMonitor` component auto-reduces particle count and pixel ratio when it detects drops. If it's still rough, try a different browser — Safari handles WebGL differently than Chrome.

---

## ⚡ Performance Decisions

Running a full WebGL scene in the browser on a mid-range laptop requires some thought:

- **`PerformanceMonitor`** — watches framerate and automatically drops particle count from 160 → 55 if FPS falls. Scales back up if it recovers.
- **`AdaptiveDpr`** — lowers device pixel ratio dynamically under load. Keeps the GPU from overheating on 4K displays.
- **`dpr={[1, 1.5]}`** — hard cap on pixel ratio. Not rendering at Retina resolution unnecessarily.
- **`multisampling={0}`** on EffectComposer — the single biggest post-processing optimization. MSAA is expensive.
- **`MeshTransmissionMaterial`** — only used once (the foam layer). This is the heaviest material in Drei. Using it on multiple objects would tank performance.
- **Spark particles** — `BufferGeometry` with manual `Float32Array` position updates. Faster than instanced meshes for this use case since positions change every frame.
- **Window scroll instead of container scroll** — the original version used a Framer Motion container ref which broke on mobile. Switched to `window.addEventListener('scroll')` which is native, passive, and works everywhere.

---

## 🎨 Design Notes

**Color palette** — Dark navy (`#0b0c14`) instead of pure black. Pure black makes colors look neon-harsh. Navy gives depth without washing out the purple/blue glow effects.

**Typography choices:**
- `Syne` feels editorial and geometric — it's what luxury/tech brands use for large display text
- `DM Sans` at weight 300 keeps body text readable without competing with the headings
- `Space Mono` for technical labels adds the "embedded systems" feel without going full terminal aesthetic

**The foam layer** — `MeshTransmissionMaterial` gives it that frosted acrylic look. The iridescence parameters add subtle rainbow shifts when the camera moves. This was the single most visually impactful material choice.

**Scroll-driven camera** — instead of GSAP ScrollTrigger (which requires configuring a scroll proxy with R3F), I used a simple `useFrame` lerp between keyframe positions. Smoother transitions, less configuration.

---

## 📚 What I Learned

Building this taught me things no tutorial covers:

- **Quantized model pitfalls** — INT8 models need dtype matching. Float32 input silently bypasses quantization.
- **Framer Motion + R3F** — you can't use `useScroll` with a container ref inside `overflow:hidden` on mobile. Window scroll is always safer.
- **MeshTransmissionMaterial** — incredible visual result but expensive. One per scene max on mid-range hardware.
- **Particle systems without libraries** — manually managing `Float32Array` positions in `useFrame` is faster than Drei's `<Sparkles>` for dynamic trajectories.
- **GitHub Pages + Vite** — the `base` config option is case-sensitive and must match the repo name exactly. Spent too long learning this.

---

## 🔮 If I Were to Continue

Things I'd explore next if this weren't a learning project:

- [ ] Replace `MeshTransmissionMaterial` with a custom GLSL shader for better performance
- [ ] Add audio — piezo click sounds when sensors pulse
- [ ] Mobile touch-scroll camera rotation in the Hero section
- [ ] WASM-powered physics for the spark particles
- [ ] A real data dashboard showing simulated voltage output as you scroll

---

<div align="center">

**Built by [Hix-001](https://github.com/Hix-001) · A learning experiment in 3D web design**

*React Three Fiber · Three.js · Framer Motion · Vite · GitHub Pages*

<br/>

```
Every footstep dissipates 5–8 joules of energy.
This site dissipates far more. Worth it.
```

</div>