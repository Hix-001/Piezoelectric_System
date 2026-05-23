import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment, ContactShadows, Stars,
  AdaptiveDpr, PerformanceMonitor, MeshTransmissionMaterial,
} from '@react-three/drei'
import { EffectComposer, Bloom, Glitch, ChromaticAberration } from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const C = {
  bg:     '#0b0c14',
  bgMid:  '#0f1120',
  purple: '#A855F7',
  blue:   '#60a5fa',
  gold:   '#D4A017',
  pcb:    '#f97316',
  text:   '#e2e8f0',
  dim:    '#64748b',
}

const SENSOR_POS = [
  [-0.95,-0.18,-0.55],[0,-0.18,-0.55],[0.95,-0.18,-0.55],
  [-0.95,-0.18, 0.55],[0,-0.18, 0.55],[0.95,-0.18, 0.55],
]
const BATTERY_POS = [[2.35,-0.12,-0.15],[2.35,-0.12,0.25]]

// ─── EXPLODED / ASSEMBLED POSITIONS (module-level, zero allocations at runtime)
// Each sensor fans outward (X) and lifts (Y), with minor Z separation by row
const SENSOR_EXPLODED = SENSOR_POS.map((pos, i) => [
  pos[0] + (i % 3 - 1) * 0.7,   // spread left/center/right
  pos[1] + 0.65,                  // lift up
  pos[2] + (Math.floor(i / 3) - 0.5) * 0.7, // front/back row separation
])

// Batteries pull outward (+X) and rise, fanning slightly on Z
const BATTERY_EXPLODED = BATTERY_POS.map((pos, i) => [
  pos[0] + 0.55,
  pos[1] + 0.35,
  pos[2] + (i === 0 ? -0.3 : 0.3),
])

// PCB slides right and lifts
const PCB_ASSEMBLED = [2.05, -0.18, 0]
const PCB_EXPLODED  = [3.6,   0.55, 0]

const CAM = [
  { pos:[0,2.8,8.5],   look:[0,0,0]       },
  { pos:[0.5,3.8,6.5], look:[0,0.5,0]     },
  { pos:[2.6,0.6,3.2], look:[2.0,-0.15,0] },
  { pos:[0.8,2.2,6.8], look:[1.0,-0.1,0]  },
  { pos:[0,5.5,13],    look:[0,0,0]        },
]

const SECTIONS = [
  {
    tag: 'ENERGY HARVESTING',
    title: ['STEPPING IS', 'THE FUTURE.'],
    sub: 'Piezoelectric Footstep Power Generator',
    body: 'Every footstep dissipates 5–8 joules of mechanical energy into the ground. We capture what the world wastes.',
  },
  {
    tag: 'SENSING MATRIX',
    title: ['THE MECHANICAL', 'MATRIX'],
    sub: '6-Point Piezoelectric Sensing',
    body: 'Six calibrated piezoelectric transducers in a precision 3×2 array. Pressure becomes voltage — every gram of force, a measurable event.',
  },
  {
    tag: 'POWER ELECTRONICS',
    title: ['AC-TO-DC', 'CONDITIONING'],
    sub: 'Harvesting Erratic Pulses Into Stable Power',
    body: 'The full-bridge rectifier and LC filter tame chaotic piezo spikes. Unstable AC becomes clean, regulated DC — ready for storage.',
  },
  {
    tag: 'ENERGY STORAGE',
    title: ['LITHIUM-ION', 'STORAGE'],
    sub: 'Powering the Next Generation of IoT',
    body: 'Harvested microwatts accumulate into milliamp-hours. Dual 18650 cells store enough charge to power edge sensors, beacons, and wireless nodes.',
  },
  {
    tag: 'CONCLUSION',
    title: ['YOUR FOOTSTEPS', 'POWER ANYTHING.'],
    sub: 'The Future of Ambient Energy Harvesting',
    body: 'Airports. Train stations. Stadiums. Every public surface becomes a silent, passive power plant. No panels. No wind. Just motion.',
  },
]

// ─── SENSOR ──────────────────────────────────────────────────────────────────
// groupRef: plain ref object { current: null } passed by EnergyMat so the
// parent can mutate .position directly inside its own useFrame without
// triggering a React re-render.
function Sensor({ position, active, groupRef }) {
  const meshRef  = useRef()
  const glowRef  = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t     = clock.elapsedTime
    const pulse = active
      ? Math.max(0, Math.sin(t * 4 + position[0] * 3)) * 0.8 + 0.4
      : 0.12
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity, pulse, 0.08,
    )
    if (lightRef.current) lightRef.current.intensity = active ? pulse * 1.5 : 0
    if (glowRef.current) {
      glowRef.current.scale.setScalar(active ? 1 + pulse * 0.3 : 1)
      glowRef.current.material.opacity = THREE.MathUtils.lerp(
        glowRef.current.material.opacity, active ? pulse * 0.3 : 0, 0.1,
      )
    }
  })

  return (
    // groupRef is a plain { current } object — React assigns the Three.js
    // Group to it on mount, letting EnergyMat's useFrame move it imperatively.
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.13,0.13,0.07,24]} />
        <meshStandardMaterial color={C.gold} emissive={C.blue} emissiveIntensity={0.12} metalness={0.95} roughness={0.08} />
      </mesh>
      <mesh ref={glowRef} position={[0,0.01,0]}>
        <cylinderGeometry args={[0.22,0.22,0.02,24]} />
        <meshBasicMaterial color={C.blue} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.135,0.012,8,24]} />
        <meshStandardMaterial color={C.gold} metalness={1} roughness={0} />
      </mesh>
      <pointLight ref={lightRef} color={C.blue} intensity={0} distance={1.2} decay={2} />
    </group>
  )
}

// ─── WIRE ─────────────────────────────────────────────────────────────────────
function Wire({ from, to, color }) {
  const mid = useMemo(() => [
    (from[0]+to[0])/2, (from[1]+to[1])/2+0.15, (from[2]+to[2])/2
  ], [from, to])
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...from), new THREE.Vector3(...mid), new THREE.Vector3(...to)
  ), [from, mid, to])
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.008, 6, false), [curve])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  )
}

// ─── SPARK PARTICLES ──────────────────────────────────────────────────────────
function SparkParticles({ active, count }) {
  const ref        = useRef()
  const opacityRef = useRef(0)

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
    if (!ref.current) return
    const targetOpacity = active ? 0.9 : 0
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 3.5)
    ref.current.material.opacity = opacityRef.current

    if (opacityRef.current < 0.02) return
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
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  )
}

// ─── ENERGY MAT ──────────────────────────────────────────────────────────────
function EnergyMat({ scrollT, particleCount }) {
  const groupRef = useRef()
  const foamRef  = useRef()
  const pcbRef   = useRef()
  const { camera } = useThree()

  // Camera state — persists across frames without re-renders
  const camPos  = useRef(new THREE.Vector3(...CAM[0].pos))
  const camLook = useRef(new THREE.Vector3(...CAM[0].look))

  // ── Disassembly refs ───────────────────────────────────────────────────────
  // Plain { current: null } objects — React will populate .current with the
  // Three.js Group/Mesh on mount. We then mutate .position directly in
  // useFrame, which is the correct R3F imperative pattern and never triggers
  // a React re-render.
  const sensorRefs  = useRef(SENSOR_POS.map(() => ({ current: null })))
  const batteryRefs = useRef(BATTERY_POS.map(() => ({ current: null })))

  useFrame((_, delta) => {
    // ── Camera ──────────────────────────────────────────────────────────────
    const sec = Math.min(4, Math.floor(scrollT * 5))
    const tgt = CAM[sec]
    camPos.current.lerp(new THREE.Vector3(...tgt.pos),  delta * 1.8)
    camLook.current.lerp(new THREE.Vector3(...tgt.look), delta * 1.8)
    camera.position.copy(camPos.current)
    camera.lookAt(camLook.current)

    if (!groupRef.current) return

    // ── Base rotation ────────────────────────────────────────────────────────
    if (sec === 0) {
      groupRef.current.rotation.y += delta * 0.2
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 0, delta * 2.5,
      )
    }

    // ── Foam glass lift ──────────────────────────────────────────────────────
    if (foamRef.current) {
      const targetY = sec >= 1 ? 1.9 : 0.18
      foamRef.current.position.y = THREE.MathUtils.lerp(
        foamRef.current.position.y, targetY, delta * 2,
      )
    }

    // ── PCB emissive pulse ────────────────────────────────────────────────────
    if (pcbRef.current) {
      const targetE = sec === 2 ? 1.2 : 0.15
      pcbRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        pcbRef.current.material.emissiveIntensity, targetE, delta * 3,
      )
    }

    // ── Disassembly / Assembly position animation ─────────────────────────────
    //
    // scrollT 0.0 → 0.4 : components move from assembled → exploded  (disassembly)
    // scrollT 0.4 → 0.6 : components stay at full exploded state
    // scrollT 0.6 → 1.0 : components move from exploded → assembled  (assembly)
    //
    // `explodedT` is a single 0→1 scalar:
    //   0 = fully assembled, 1 = fully exploded
    //
    const clamp01 = (v) => Math.min(1, Math.max(0, v))
    let explodedT
    if (scrollT <= 0.4) {
      // Disassembly: ramp 0 → 1 as scrollT goes 0 → 0.4
      explodedT = clamp01(THREE.MathUtils.mapLinear(scrollT, 0.0, 0.4, 0, 1))
    } else if (scrollT >= 0.6) {
      // Assembly: ramp 1 → 0 as scrollT goes 0.6 → 1.0
      explodedT = clamp01(THREE.MathUtils.mapLinear(scrollT, 0.6, 1.0, 1, 0))
    } else {
      // Dwell zone: stay fully exploded
      explodedT = 1
    }

    // ── Sensors ──────────────────────────────────────────────────────────────
    SENSOR_POS.forEach((assembled, i) => {
      const ref = sensorRefs.current[i]
      if (!ref.current) return
      const exploded = SENSOR_EXPLODED[i]
      ref.current.position.set(
        THREE.MathUtils.lerp(assembled[0], exploded[0], explodedT),
        THREE.MathUtils.lerp(assembled[1], exploded[1], explodedT),
        THREE.MathUtils.lerp(assembled[2], exploded[2], explodedT),
      )
    })

    // ── PCB ───────────────────────────────────────────────────────────────────
    if (pcbRef.current) {
      pcbRef.current.position.set(
        THREE.MathUtils.lerp(PCB_ASSEMBLED[0], PCB_EXPLODED[0], explodedT),
        THREE.MathUtils.lerp(PCB_ASSEMBLED[1], PCB_EXPLODED[1], explodedT),
        THREE.MathUtils.lerp(PCB_ASSEMBLED[2], PCB_EXPLODED[2], explodedT),
      )
    }

    // ── Batteries ─────────────────────────────────────────────────────────────
    BATTERY_POS.forEach((assembled, i) => {
      const ref = batteryRefs.current[i]
      if (!ref.current) return
      const exploded = BATTERY_EXPLODED[i]
      ref.current.position.set(
        THREE.MathUtils.lerp(assembled[0], exploded[0], explodedT),
        THREE.MathUtils.lerp(assembled[1], exploded[1], explodedT),
        THREE.MathUtils.lerp(assembled[2], exploded[2], explodedT),
      )
    })
  })

  const sec           = Math.min(4, Math.floor(scrollT * 5))
  const sensorActive  = sec >= 1 && sec <= 3
  const storageActive = sec === 3
  const conclusionSec = sec === 4

  const batEmiTarget = storageActive || conclusionSec ? 1.8 : 0.3

  return (
    <group ref={groupRef}>
      {/* Base plate */}
      <mesh receiveShadow position={[0,-0.28,0]}>
        <boxGeometry args={[3.6,0.09,2.1]} />
        <meshStandardMaterial color="#0d0f1f" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Circuit traces */}
      {[-0.6,0,0.6].map((z,i) => (
        <mesh key={i} position={[0,-0.23,z]}>
          <boxGeometry args={[3.4,0.005,0.02]} />
          <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={sensorActive ? 1.5 : 0.25} />
        </mesh>
      ))}

      {/* Foam / glass layer — lifts to expose components on scroll */}
      <mesh ref={foamRef} position={[0,0.18,0]} castShadow>
        <boxGeometry args={[3.6,0.32,2.1]} />
        <MeshTransmissionMaterial
          color="#c4d8ff" transmission={0.78} thickness={0.6}
          roughness={0.04} chromaticAberration={0.03} anisotropy={0.3}
          distortion={0.08} distortionScale={0.15} temporalDistortion={0.04}
          iridescence={0.25} iridescenceIOR={1.3} iridescenceThicknessRange={[0,1200]}
        />
      </mesh>

      {/* Sensors — each receives a plain ref object so EnergyMat's useFrame
          can imperatively move the group without React re-renders           */}
      {SENSOR_POS.map((pos, i) => (
        <Sensor
          key={i}
          position={pos}
          active={sensorActive}
          groupRef={sensorRefs.current[i]}
        />
      ))}

      {/* PCB — ref points to the mesh; useFrame writes to .position directly */}
      <mesh ref={pcbRef} position={PCB_ASSEMBLED} castShadow>
        <boxGeometry args={[0.75,0.04,0.65]} />
        <meshStandardMaterial color={C.pcb} emissive={C.pcb} emissiveIntensity={0.15} metalness={0.2} roughness={0.7} />
      </mesh>
      {/* PCB surface components (static relative to PCB mesh position) */}
      {[[-0.1,0.04],[0.1,0.03],[0,0.025]].map(([x,h],i) => (
        <mesh key={i} position={[2.05+x,-0.14,i*0.1-0.1]}>
          <boxGeometry args={[0.08,h,0.06]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Batteries — ref on each group so useFrame can move them */}
      {BATTERY_POS.map((pos, i) => (
        <group key={i} ref={batteryRefs.current[i]} position={pos}>
          <mesh rotation={[Math.PI/2,0,0]} castShadow>
            <cylinderGeometry args={[0.09,0.09,0.36,20]} />
            <meshStandardMaterial
              color={C.purple} emissive={C.purple}
              emissiveIntensity={batEmiTarget}
              metalness={0.75} roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI/2,0,0]} position={[0,0,0.19]}>
            <cylinderGeometry args={[0.045,0.045,0.015,12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.1} />
          </mesh>
          <pointLight color={C.purple} intensity={storageActive || conclusionSec ? 2.5 : 0.15} distance={2} decay={2} />
        </group>
      ))}

      <Wire from={[1.8,-0.18,-0.05]} to={[2.2,-0.12,-0.15]} color={C.purple} />
      <Wire from={[1.8,-0.18, 0.05]} to={[2.2,-0.12, 0.25]} color={C.blue} />
      <Wire from={[2.2,-0.12,-0.15]} to={[2.2,-0.12, 0.25]} color={C.purple} />

      <SparkParticles active={storageActive} count={particleCount} />

      <pointLight position={[0,-0.4,0]} color={C.blue} intensity={sensorActive ? 3 : 0.3} distance={6} decay={2} />
      {conclusionSec && <pointLight position={[0,2,0]} color={C.purple} intensity={4} distance={14} decay={2} />}
    </group>
  )
}

// ─── POST FX ──────────────────────────────────────────────────────────────────
function PostFX({ scrollT }) {
  const isCircuit    = scrollT >= 0.4 && scrollT < 0.6
  const isConclusion = scrollT >= 0.8
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={isConclusion ? 2.2 : 1.0} luminanceThreshold={0.28} luminanceSmoothing={0.9} radius={0.8} />
      {isCircuit && <Glitch delay={[1,2.5]} duration={[0.06,0.2]} strength={[0.05,0.18]} mode={GlitchMode.SPORADIC} active ratio={0.85} />}
      {isCircuit && <ChromaticAberration offset={[0.0012,0.0012]} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={1} />}
    </EffectComposer>
  )
}

// ─── SCENE ────────────────────────────────────────────────────────────────────
function SceneInner({ scrollT }) {
  const [particleCount, setParticleCount] = useState(160)
  return (
    <>
      <PerformanceMonitor onDecline={() => setParticleCount(55)} onIncline={() => setParticleCount(160)} flipflops={3} factor={0.5} iterations={5} />
      <AdaptiveDpr pixelated />
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 20, 50]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[4,8,4]} intensity={0.5} castShadow />
      <pointLight position={[-6,4,-4]} color={C.purple} intensity={1.0} />
      <pointLight position={[6,2,6]}   color={C.blue}   intensity={0.7} />
      <Stars radius={100} depth={60} count={1600} factor={4} fade speed={0.25} />
      <Suspense fallback={null}>
        <Environment preset="night" />
        <ContactShadows position={[0,-0.34,0]} opacity={0.45} scale={12} blur={2.5} far={5} color={C.blue} />
        <EnergyMat scrollT={scrollT} particleCount={particleCount} />
      </Suspense>
      <PostFX scrollT={scrollT} />
    </>
  )
}

// ─── LOADING SCREEN ────────────────────────────────────────────────────────────
function LoadingScreen({ done }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (done) return
    const timers = [
      setTimeout(() => setPhase(1),  80),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(4), 1400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          {/* Horizontal scan line */}
          <motion.div
            className="loader-scan"
            initial={{ top: '-2px' }}
            animate={{ top: '100%' }}
            transition={{ duration: 0.55, ease: 'linear' }}
          />

          {/* Grid lines */}
          <div className={`loader-grid ${phase >= 1 ? 'visible' : ''}`} />

          {/* Center content */}
          <div className="loader-center">
            <motion.div
              className="loader-bolt"
              initial={{ scale: 0, rotate: -20 }}
              animate={phase >= 1 ? { scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.3, ease: [0.34,1.56,0.64,1] }}
            >
              ⚡
            </motion.div>

            <div className="loader-title-wrap">
              {['PIEZOELECTRIC', 'POWER SYSTEM'].map((word, wi) => (
                <div key={wi} className="loader-line-clip">
                  <motion.div
                    className="loader-title"
                    initial={{ y: '100%' }}
                    animate={phase >= 2 ? { y: 0 } : {}}
                    transition={{ duration: 0.4, ease: [0.16,1,0.3,1], delay: wi * 0.08 }}
                  >
                    {word}
                  </motion.div>
                </div>
              ))}
            </div>

            <motion.div
              className="loader-readout"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.2 }}
            >
              <span className="loader-mono">SENSORS: <em>6×PZT</em></span>
              <span className="loader-mono">STORAGE: <em>2×18650</em></span>
              <span className="loader-mono">STATUS: <em className="loader-ok">OK</em></span>
            </motion.div>

            <div className="loader-bar-wrap">
              <motion.div
                className="loader-bar"
                initial={{ scaleX: 0 }}
                animate={phase >= 1 ? { scaleX: 1 } : {}}
                transition={{ duration: 1.1, ease: [0.16,1,0.3,1] }}
              />
            </div>
          </div>

          <div className={`loader-corner tl ${phase >= 2 ? 'visible' : ''}`} />
          <div className={`loader-corner tr ${phase >= 2 ? 'visible' : ''}`} />
          <div className={`loader-corner bl ${phase >= 2 ? 'visible' : ''}`} />
          <div className={`loader-corner br ${phase >= 2 ? 'visible' : ''}`} />

          <motion.div
            className="loader-flash"
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: [0, 0.7, 0] } : {}}
            transition={{ duration: 0.3 }}
          />
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

      <AnimatePresence mode="wait">
        <motion.div key={section.tag} className="section-tag"
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.3 }}>
          — {section.tag}
        </motion.div>
      </AnimatePresence>

      <div className={`text-block ${isHero ? 'text-hero' : 'text-section'}`}>
        <AnimatePresence mode="wait">
          <motion.div key={section.title.join('')}
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -28 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>
            <h1 className="main-title">
              {section.title.map((line, i) => (
                <span key={i} className="title-line">
                  {i === 1 && !isHero ? <em>{line}</em> : line}
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
        {scrollT < 0.03 && (
          <motion.div className="scroll-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="scroll-inner" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
              <div className="scroll-line" />
              <span>SCROLL</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [scrollT, setScrollT] = useState(0)
  const [loading, setLoading] = useState(true)

  const onScroll = useCallback((e) => {
    const scrollY   = e.target.scrollTop
    const scrollMax = e.target.scrollHeight - e.target.clientHeight
    setScrollT(scrollY / scrollMax)
  }, [])

  return (
    <>
      <LoadingScreen done={!loading} />
      <Canvas shadows camera={{ position: CAM[0].pos, fov: 45, near: 0.1, far: 80 }}>
        <SceneInner scrollT={scrollT} />
      </Canvas>
      <TextOverlay scrollT={scrollT} />
      <div className="scroll-container" onScroll={onScroll}>
        <div style={{ height: '500vh' }} />
      </div>
    </>
  )
}