import {
  useRef, useMemo, useState, useEffect, Suspense,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment, ContactShadows, Stars,
  AdaptiveDpr, PerformanceMonitor,
  MeshTransmissionMaterial,
} from '@react-three/drei'
import {
  EffectComposer, Bloom, Glitch, ChromaticAberration
} from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const C = {
  bg:     '#050505',
  purple: '#A855F7',
  blue:   '#3B82F6',
  gold:   '#D4A017',
  pcb:    '#FF6B00',
}

const SENSOR_POS = [
  [-0.95, -0.18, -0.55], [0, -0.18, -0.55], [0.95, -0.18, -0.55],
  [-0.95, -0.18,  0.55], [0, -0.18,  0.55], [0.95, -0.18,  0.55],
]

const BATTERY_POS = [
  [2.35, -0.12, -0.15],
  [2.35, -0.12,  0.25],
]

const CAM = [
  { pos: [0, 2.8, 8.5],   look: [0, 0, 0]      },
  { pos: [0.5, 3.8, 6.5], look: [0, 0.5, 0]     },
  { pos: [2.6, 0.6, 3.2], look: [2.0, -0.15, 0] },
  { pos: [0.8, 2.2, 6.8], look: [1.0, -0.1, 0]  },
  { pos: [0, 5.5, 13],    look: [0, 0, 0]        },
]

const SECTIONS = [
  {
    tag: '// SECTION 01 — ENERGY HARVESTING',
    title: ['STEPPING IS', 'THE FUTURE.'],
    sub: 'Piezoelectric Footstep Power Generator',
    body: 'Every footstep dissipates 5–8 joules of mechanical energy into the ground. We capture what the world wastes.',
  },
  {
    tag: '// SECTION 02 — SENSING MATRIX',
    title: ['THE MECHANICAL', 'MATRIX'],
    sub: '6-Point Piezoelectric Sensing',
    body: 'Six calibrated piezoelectric transducers in a precision 3×2 array. Pressure becomes voltage — every gram of force, a measurable event.',
  },
  {
    tag: '// SECTION 03 — POWER ELECTRONICS',
    title: ['AC-TO-DC', 'CONDITIONING'],
    sub: 'Harvesting Erratic Pulses Into Stable Power',
    body: 'The full-bridge rectifier and LC filter tame chaotic piezo spikes. Unstable AC becomes clean, regulated DC — ready for storage.',
  },
  {
    tag: '// SECTION 04 — ENERGY STORAGE',
    title: ['LITHIUM-ION', 'STORAGE'],
    sub: 'Powering the Next Generation of IoT',
    body: 'Harvested microwatts accumulate into milliamp-hours. Dual 18650 cells store enough charge to power edge sensors, beacons, and wireless nodes.',
  },
  {
    tag: '// SECTION 05 — CONCLUSION',
    title: ['YOUR FOOTSTEPS', 'POWER ANYTHING.'],
    sub: 'The Future of Ambient Energy Harvesting',
    body: 'Airports. Train stations. Stadiums. Every public surface becomes a silent, passive power plant. No panels. No wind. Just motion.',
  },
]

// ─── SENSOR ──────────────────────────────────────────────────────────────────
function Sensor({ position, active }) {
  const meshRef  = useRef()
  const glowRef  = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const pulse = active
      ? Math.max(0, Math.sin(t * 4.0 + position[0] * 3)) * 0.8 + 0.4
      : 0.15
    meshRef.current.material.emissiveIntensity = pulse
    if (lightRef.current) lightRef.current.intensity = active ? pulse * 1.5 : 0
    if (glowRef.current) {
      glowRef.current.scale.setScalar(active ? 1 + pulse * 0.3 : 1)
      glowRef.current.material.opacity = active ? pulse * 0.25 : 0
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.07, 24]} />
        <meshStandardMaterial color={C.gold} emissive={C.blue} emissiveIntensity={0.15} metalness={0.95} roughness={0.08} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
        <meshBasicMaterial color={C.blue} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.135, 0.012, 8, 24]} />
        <meshStandardMaterial color={C.gold} metalness={1} roughness={0} />
      </mesh>
      <pointLight ref={lightRef} color={C.blue} intensity={0} distance={1.2} decay={2} />
    </group>
  )
}

// ─── WIRE ─────────────────────────────────────────────────────────────────────
function Wire({ from, to, color = C.purple }) {
  const mid = useMemo(() => [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.15,
    (from[2] + to[2]) / 2,
  ], [from, to])

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...from),
    new THREE.Vector3(...mid),
    new THREE.Vector3(...to),
  ), [from, mid, to])

  const geo = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.008, 6, false), [curve])

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  )
}

// ─── SPARK PARTICLES ─────────────────────────────────────────────────────────
function SparkParticles({ active, count }) {
  const ref = useRef()

  const data = useMemo(() => {
    const starts = new Float32Array(count * 3)
    const ends   = new Float32Array(count * 3)
    const ts     = new Float32Array(count)
    const speeds = new Float32Array(count)
    const arcs   = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const sp = SENSOR_POS[Math.floor(Math.random() * SENSOR_POS.length)]
      const bp = BATTERY_POS[Math.floor(Math.random() * BATTERY_POS.length)]
      starts[i*3]=sp[0]; starts[i*3+1]=sp[1]; starts[i*3+2]=sp[2]
      ends[i*3]=bp[0];   ends[i*3+1]=bp[1];   ends[i*3+2]=bp[2]
      ts[i]     = Math.random()
      speeds[i] = 0.25 + Math.random() * 0.45
      arcs[i]   = 0.5  + Math.random() * 1.0
    }
    return { starts, ends, ts, speeds, arcs }
  }, [count])

  const positions = useMemo(() => new Float32Array(count * 3), [count])

  useFrame((_, delta) => {
    if (!ref.current || !active) return
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      data.ts[i] += delta * data.speeds[i]
      if (data.ts[i] > 1) {
        data.ts[i] = 0
        const sp = SENSOR_POS[Math.floor(Math.random() * SENSOR_POS.length)]
        const bp = BATTERY_POS[Math.floor(Math.random() * BATTERY_POS.length)]
        data.starts[i*3]=sp[0]; data.starts[i*3+1]=sp[1]; data.starts[i*3+2]=sp[2]
        data.ends[i*3]=bp[0];   data.ends[i*3+1]=bp[1];   data.ends[i*3+2]=bp[2]
      }
      const t = data.ts[i]
      pos[i*3]   = THREE.MathUtils.lerp(data.starts[i*3],   data.ends[i*3],   t)
      pos[i*3+1] = THREE.MathUtils.lerp(data.starts[i*3+1], data.ends[i*3+1], t) + Math.sin(t * Math.PI) * data.arcs[i]
      pos[i*3+2] = THREE.MathUtils.lerp(data.starts[i*3+2], data.ends[i*3+2], t)
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} visible={active}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.045} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  )
}

// ─── ENERGY MAT ──────────────────────────────────────────────────────────────
function EnergyMat({ scrollT, particleCount }) {
  const groupRef = useRef()
  const foamRef  = useRef()
  const pcbRef   = useRef()
  const { camera } = useThree()
  const camPos  = useRef(new THREE.Vector3(...CAM[0].pos))
  const camLook = useRef(new THREE.Vector3(...CAM[0].look))

  useFrame((_, delta) => {
    const sec = Math.min(4, Math.floor(scrollT * 5))
    const tgt = CAM[sec]
    camPos.current.lerp(new THREE.Vector3(...tgt.pos), delta * 2.0)
    camLook.current.lerp(new THREE.Vector3(...tgt.look), delta * 2.0)
    camera.position.copy(camPos.current)
    camera.lookAt(camLook.current)

    if (!groupRef.current) return
    if (sec === 0) {
      groupRef.current.rotation.y += delta * 0.25
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2.5)
    }

    if (foamRef.current) {
      const targetY = sec >= 1 ? 1.9 : 0.18
      foamRef.current.position.y = THREE.MathUtils.lerp(foamRef.current.position.y, targetY, delta * 2.2)
    }

    if (pcbRef.current) {
      const targetEmissive = sec === 2 ? 1.2 : 0.15
      pcbRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        pcbRef.current.material.emissiveIntensity, targetEmissive, delta * 3
      )
    }
  })

  const sec           = Math.min(4, Math.floor(scrollT * 5))
  const sensorActive  = sec >= 1 && sec <= 3
  const storageActive = sec === 3
  const conclusionSec = sec === 4

  return (
    <group ref={groupRef}>
      <mesh receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[3.6, 0.09, 2.1]} />
        <meshStandardMaterial color="#111122" metalness={0.6} roughness={0.4} />
      </mesh>

      {[-0.6, 0, 0.6].map((z, i) => (
        <mesh key={i} position={[0, -0.23, z]}>
          <boxGeometry args={[3.4, 0.005, 0.02]} />
          <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={sensorActive ? 1.5 : 0.3} />
        </mesh>
      ))}

      <mesh ref={foamRef} position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[3.6, 0.32, 2.1]} />
        <MeshTransmissionMaterial
          color="#b8d8ff" transmission={0.75} thickness={0.6}
          roughness={0.05} chromaticAberration={0.04} anisotropy={0.3}
          distortion={0.1} distortionScale={0.2} temporalDistortion={0.05}
          iridescence={0.3} iridescenceIOR={1.3} iridescenceThicknessRange={[0, 1400]}
        />
      </mesh>

      {SENSOR_POS.map((pos, i) => <Sensor key={i} position={pos} active={sensorActive} />)}

      <mesh ref={pcbRef} position={[2.05, -0.18, 0]} castShadow>
        <boxGeometry args={[0.75, 0.04, 0.65]} />
        <meshStandardMaterial color={C.pcb} emissive={C.pcb} emissiveIntensity={0.15} metalness={0.2} roughness={0.7} />
      </mesh>
      {[[-0.1, 0.04], [0.1, 0.03], [0, 0.025]].map(([x, h], i) => (
        <mesh key={i} position={[2.05 + x, -0.14, i * 0.1 - 0.1]}>
          <boxGeometry args={[0.08, h, 0.06]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {BATTERY_POS.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.36, 20]} />
            <meshStandardMaterial
              color={C.purple} emissive={C.purple}
              emissiveIntensity={storageActive || conclusionSec ? 1.8 : 0.35}
              metalness={0.75} roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.19]}>
            <cylinderGeometry args={[0.045, 0.045, 0.015, 12]} />
            <meshStandardMaterial color="#ddd" metalness={1} roughness={0.1} />
          </mesh>
          <pointLight color={C.purple} intensity={storageActive || conclusionSec ? 2.5 : 0.2} distance={2} decay={2} />
        </group>
      ))}

      <Wire from={[1.8, -0.18, -0.05]} to={[2.2, -0.12, -0.15]} color={C.purple} />
      <Wire from={[1.8, -0.18,  0.05]} to={[2.2, -0.12,  0.25]} color={C.blue} />
      <Wire from={[2.2, -0.12, -0.15]} to={[2.2, -0.12, 0.25]}  color={C.purple} />

      <SparkParticles active={storageActive} count={particleCount} />

      <pointLight position={[0, -0.4, 0]} color={C.blue} intensity={sensorActive ? 3.5 : 0.4} distance={6} decay={2} />
      {conclusionSec && <pointLight position={[0, 2, 0]} color={C.purple} intensity={4} distance={12} decay={2} />}
    </group>
  )
}

// ─── POST FX ──────────────────────────────────────────────────────────────────
function PostFX({ scrollT }) {
  const isCircuit    = scrollT >= 0.4 && scrollT < 0.6
  const isConclusion = scrollT >= 0.8
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={isConclusion ? 2.5 : 1.2} luminanceThreshold={0.25} luminanceSmoothing={0.85} radius={0.75} />
      {isCircuit && <Glitch delay={[0.8, 2.0]} duration={[0.08, 0.25]} strength={[0.06, 0.22]} mode={GlitchMode.SPORADIC} active ratio={0.85} />}
      {isCircuit && <ChromaticAberration offset={[0.0015, 0.0015]} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={1} />}
    </EffectComposer>
  )
}

// ─── SCENE ────────────────────────────────────────────────────────────────────
function SceneInner({ scrollT }) {
  const [particleCount, setParticleCount] = useState(180)
  return (
    <>
      <PerformanceMonitor onDecline={() => setParticleCount(60)} onIncline={() => setParticleCount(180)} flipflops={3} factor={0.5} iterations={5} />
      <AdaptiveDpr pixelated />
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 18, 45]} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[4, 8, 4]} intensity={0.6} castShadow />
      <pointLight position={[-6, 4, -4]} color={C.purple} intensity={1.2} />
      <pointLight position={[6, 2, 6]}   color={C.blue}   intensity={0.8} />
      <Stars radius={90} depth={60} count={1800} factor={4} fade speed={0.3} />
      <Suspense fallback={null}>
        <Environment preset="night" />
        <ContactShadows position={[0, -0.34, 0]} opacity={0.55} scale={12} blur={2.5} far={5} color={C.blue} />
        <EnergyMat scrollT={scrollT} particleCount={particleCount} />
      </Suspense>
      <PostFX scrollT={scrollT} />
    </>
  )
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function LoadingScreen({ done }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="loading" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <motion.div className="loading-bar-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="loading-label">INITIALIZING PIEZO MATRIX</div>
            <div className="loading-track">
              <motion.div className="loading-fill" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <div className="loading-sub">LOADING SENSOR ASSEMBLY...</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── TEXT OVERLAY ─────────────────────────────────────────────────────────────
function TextOverlay({ scrollT }) {
  const sec     = Math.min(4, Math.floor(scrollT * 5))
  const section = SECTIONS[sec]
  const isHero  = sec === 0

  return (
    <div className="overlay">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${scrollT * 100}%` }} />
      </div>

      <div className="section-counter">
        <span className="counter-num">0{sec + 1}</span>
        <span className="counter-div">/</span>
        <span className="counter-tot">05</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section.tag} className="section-tag"
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.35 }}>
          {section.tag}
        </motion.div>
      </AnimatePresence>

      <div className={`text-block ${isHero ? 'text-hero' : 'text-section'}`}>
        <AnimatePresence mode="wait">
          <motion.div key={section.title.join('')}
            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -36 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="main-title">
              {section.title.map((line, i) => (
                <span key={i} className="title-line">
                  {i === 1 && !isHero ? <em>{line}</em> : line}
                  {i < section.title.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <div className="divider" />
            <h2 className="sub-title">{section.sub}</h2>
            <p className="body-text">{section.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {scrollT < 0.04 && (
          <motion.div className="scroll-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }} className="scroll-inner">
              <div className="scroll-line" />
              <span>SCROLL</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {sec === 2 && <div className="scanlines" aria-hidden="true" />}

      <div className="spec-strip">
        <span>PIEZO-V1.0</span>
        <span className="spec-dot">◆</span>
        <span>6×PZT SENSORS</span>
        <span className="spec-dot">◆</span>
        <span>DUAL 18650</span>
        <span className="spec-dot">◆</span>
        <span className="spec-live">● LIVE</span>
      </div>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [scrollT, setScrollT] = useState(0)
  const [loaded, setLoaded]   = useState(false)

  // ✅ Window-based scroll — works on mobile, desktop, everywhere
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setScrollT(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Tall page that enables native window scroll */}
      <div className="scroll-spacer" />

      {/* Fixed canvas — behind everything */}
      <div className="canvas-wrap">
        <Canvas
          camera={{ position: [0, 2.8, 8.5], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          shadows
        >
          <SceneInner scrollT={scrollT} />
        </Canvas>
      </div>

      {/* Fixed UI overlay */}
      <TextOverlay scrollT={scrollT} />

      {/* Loading screen on top */}
      <LoadingScreen done={loaded} />
    </>
  )
}
