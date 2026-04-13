# ⚡ Piezoelectric Footstep Power Generator — 3D Scrollytelling Site

A high-end, cinematic 3D scrollytelling website built with **React Three Fiber**, **Framer Motion**, and **Three.js** for the Piezoelectric Footstep Power Generator project.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Build for production
npm run build
```

Open `http://localhost:5173` and scroll through the experience.

---

## 🎬 Scroll Sections

| Scroll %  | Scene                          | Description                              |
|-----------|-------------------------------|------------------------------------------|
| 0–20%     | **Hero**                      | Full mat rotates — "STEPPING IS THE FUTURE." |
| 20–40%    | **Exploded View**             | Foam lifts to reveal 6 glowing sensors   |
| 40–60%    | **Circuit / PCB**             | Camera dives to the PCB + glitch effect  |
| 60–80%    | **Energy Storage**            | White sparks fly from sensors → batteries|
| 80–100%   | **Conclusion**                | Wide shot with purple bloom glow         |

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| `@react-three/fiber` | React-based WebGL renderer |
| `@react-three/drei` | MeshTransmissionMaterial, ContactShadows, Stars, AdaptiveDpr |
| `@react-three/postprocessing` | Bloom, Glitch, ChromaticAberration |
| `framer-motion` | HTML section text animations |
| `three` | 3D math, geometry, materials |

---

## ⚡ Performance

- **`PerformanceMonitor`** auto-detects low FPS and reduces particle count from 180 → 60
- **`AdaptiveDpr`** lowers pixel ratio under load
- **`dpr={[1, 1.5]}`** caps resolution for mid-range GPUs
- `postprocessing` multisampling is disabled (`multisampling={0}`)
- `MeshTransmissionMaterial` is used once (only the foam layer)

Tested to run at 60fps on integrated Intel Iris Xe. On very low-end hardware, particles will auto-reduce.

---

## 🎨 Visual Identity

| Element | Value |
|---------|-------|
| Background | `#050505` |
| Neon Purple | `#A855F7` |
| Electric Blue | `#3B82F6` |
| Header Font | Orbitron (Google Fonts) |
| Body Font | Inter |
| Mono Font | Space Mono |

---

## 🗂 File Structure

```
piezo-site/
├── index.html           ← Google Fonts, root div
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx         ← React entry
    ├── App.jsx          ← All 3D components + HTML overlay
    └── App.css          ← Full stylesheet (dark cinematic)
```

---

*Built with React Three Fiber. All geometry is procedural — no external 3D model files required.*
