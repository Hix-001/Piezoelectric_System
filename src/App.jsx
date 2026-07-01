import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  Environment, 
  ContactShadows, 
  ScrollControls, 
  Scroll, 
  useScroll,
  MeshTransmissionMaterial,
  Stars
} from '@react-three/drei'
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// --- CONSTANTS & DATA ---
const COLORS = {
  bg: '#030303',
  neon: '#3B82F6',
  accent: '#A855F7',
  gold: '#D4A017',
  glass: '#c4d8ff'
}

const SENSOR_POS = [
  [-1.2, 0, -0.6], [0, 0, -0.6], [1.2, 0, -0.6],
  [-1.2, 0,  0.6], [0, 0,  0.6], [1.2, 0,  0.6],
]

// --- 3D SCENE COMPONENT ---
function EnergyHardware() {
  const scroll = useScroll()
  const group = useRef()
  const foamRef = useRef()
  const pcbRef = useRef()
  
  // Component Refs for manual mutation (Performance optimization)
  const sensors = useRef([])

  useFrame((state, delta) => {
    // 1. Calculate precise scroll offset (0 to 1)
    const r1 = scroll.range(0 / 4, 1 / 4) // Hero to Exploded
    const r2 = scroll.range(1 / 4, 1 / 4) // Exploded to PCB
    const r3 = scroll.range(2 / 4, 1 / 4) // PCB to Battery
    
    // 2. Cinematic Camera Movement
    state.camera.position.set(
      THREE.MathUtils.lerp(0, 4, r2) - THREE.MathUtils.lerp(0, 4, r3),
      THREE.MathUtils.lerp(3, 4, r1) + THREE.MathUtils.lerp(0, 2, r3),
      THREE.MathUtils.lerp(8, 6, r1) + THREE.MathUtils.lerp(0, 4, r3)
    )
    state.camera.lookAt(
      THREE.MathUtils.lerp(0, 2, r2), 
      0, 
      0
    )

    // 3. Hardware Assembly/Disassembly Animation
    if (foamRef.current) {
      foamRef.current.position.y = THREE.MathUtils.lerp(0, 2, r1)
      foamRef.current.material.opacity = THREE.MathUtils.lerp(1, 0.2, r1)
    }

    sensors.current.forEach((sensor, i) => {
      if (sensor) {
        const explodeX = SENSOR_POS[i][0] * 1.5
        const explodeZ = SENSOR_POS[i][2] * 1.5
        sensor.position.x = THREE.MathUtils.lerp(SENSOR_POS[i][0], explodeX, r1)
        sensor.position.z = THREE.MathUtils.lerp(SENSOR_POS[i][2], explodeZ, r1)
        sensor.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 4, r2)
      }
    })

    if (pcbRef.current) {
      pcbRef.current.position.y = THREE.MathUtils.lerp(-1, 0, r2)
      pcbRef.current.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 8, r2)
    }
  })

  return (
    <group ref={group}>
      {/* Substrate Base */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[4, 0.1, 2.5]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Impact Layer (Glassmorphism) */}
      <mesh ref={foamRef} position={[0, 0.2, 0]}>
        <boxGeometry args={[4, 0.4, 2.5]} />
        <MeshTransmissionMaterial 
          color={COLORS.glass} transmission={0.9} thickness={0.5} 
          roughness={0.1} iridescence={0.3} transparent
        />
      </mesh>

      {/* Piezoelectric Array */}
      {SENSOR_POS.map((pos, i) => (
        <group key={i} ref={(el) => (sensors.current[i] = el)} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
            <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.2} />
          </mesh>
          {/* Active Energy Glow */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
            <meshBasicMaterial color={COLORS.neon} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Signal Conditioning PCB */}
      <mesh ref={pcbRef} position={[3, -1, 0]}>
        <boxGeometry args={[1.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  )
}

// --- HTML OVERLAY COMPONENT ---
function DOMOverlay() {
  return (
    <Scroll html style={{ width: '100%', height: '100vh' }}>
      
      {/* Premium Navigation */}
      <nav className="fixed w-full flex justify-between items-center px-10 py-6 z-50 mix-blend-difference">
        <div className="font-syne font-bold text-2xl tracking-tighter text-white">PIEZO.</div>
        <div className="flex gap-8 font-inter text-sm text-gray-400">
          <a href="#research" className="hover:text-white transition-colors">Research</a>
          <a href="#tech" className="hover:text-white transition-colors">Technology</a>
          <a href="#team" className="hover:text-white transition-colors">Team</a>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="h-screen flex flex-col justify-center px-[10vw] relative">
        <div className="max-w-3xl pointer-events-none">
          <p className="font-mono text-blue-500 tracking-widest text-sm mb-4 uppercase">Kinetic Transduction</p>
          <h1 className="font-syne text-6xl md:text-8xl font-extrabold leading-none text-white mb-6">
            Power from <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              every step.
            </span>
          </h1>
          <p className="font-inter text-lg text-gray-400 max-w-xl line-clamp-3">
            Every footstep dissipates 5–8 joules of mechanical energy into the ground. We have engineered a solid-state matrix to capture what the world wastes.
          </p>
        </div>
        <div className="absolute bottom-10 left-[10vw] flex flex-col items-center animate-bounce">
          <div className="w-[1px] h-16 bg-gradient-to-b from-blue-500 to-transparent"></div>
          <span className="font-mono text-[10px] tracking-[0.3em] text-gray-500 mt-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>SCROLL</span>
        </div>
      </section>

      {/* Section 2: Mechanical Array */}
      <section className="h-screen flex flex-col justify-center px-[10vw] items-end text-right">
        <div className="max-w-xl pointer-events-none">
          <h2 className="font-syne text-5xl font-bold text-white mb-4">The Mechanical Matrix</h2>
          <p className="font-inter text-gray-400">
            A precision 3×2 array of calibrated brass piezoelectric transducers. Pressure deforms the crystalline internal structure, shifting charge centers to instantly convert physical force into a high-voltage electrical pulse.
          </p>
        </div>
      </section>

      {/* Section 3: Conditioning */}
      <section className="h-screen flex flex-col justify-center px-[10vw]">
        <div className="max-w-xl pointer-events-none glass-card p-8 rounded-2xl">
          <h2 className="font-syne text-4xl font-bold text-white mb-4">AC-to-DC Conditioning</h2>
          <p className="font-inter text-gray-300">
            Raw kinetic spikes are chaotic. Our onboard full-bridge rectifier and LC filtering system tame the erratic AC pulses, converting them into a stable, regulated DC current ready for lithium-ion storage.
          </p>
        </div>
      </section>

      {/* Section 4: Footer & Team */}
      <section className="h-screen flex flex-col justify-end px-[10vw] pb-20">
        <div className="w-full border-t border-white/10 pt-10 flex justify-between items-end">
          <div>
            <h3 className="font-syne text-3xl font-bold text-white mb-2">Ready to scale.</h3>
            <p className="font-mono text-sm text-gray-500">Targetting high-footfall corridors globally.</p>
          </div>
          <div className="text-right font-inter text-xs text-gray-500">
            <p className="text-white mb-1 font-mono uppercase tracking-widest">IILM University CSE</p>
            <p>Engineered by: Harsh Kumar, Abhinav Mishra, Vidit Raj Singh,</p>
            <p>Govind Rao, Sanchita Singh, Lakshya</p>
          </div>
        </div>
      </section>

    </Scroll>
  )
}

// --- MAIN APP ---
export default function App() {
  return (
    <div className="w-screen h-screen bg-[#030303] overflow-hidden">
      <Canvas shadows camera={{ position: [0, 3, 8], fov: 45 }}>
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.bg, 10, 25]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          
          <ScrollControls pages={4} damping={0.15}>
            <EnergyHardware />
            <DOMOverlay />
          </ScrollControls>
          
          <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color={COLORS.neon} />
        </Suspense>

        {/* Cinematic Post-Processing */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
          <Noise opacity={0.03} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}