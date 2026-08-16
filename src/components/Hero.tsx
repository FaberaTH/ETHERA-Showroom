import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Html } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, SpotLight } from 'three'
import gsap from 'gsap'

// Simple stylized car silhouette made from basic geometry. Isolated so it can be
// replaced with a GLB in the future without changing UI logic.
function StylizedCar({ headlightLeftRef, headlightRightRef, bodyRef, groupRef }: any) {
  return (
    <group ref={groupRef} rotation={[0, 0.3, 0]} position={[0, -0.4, 0]}> 
      {/* main body */}
      <mesh ref={bodyRef} castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.5, 1.1]} />
        <meshStandardMaterial color="#0b0b0b" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* roof */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.18, 0.95]} />
        <meshStandardMaterial color="#070707" metalness={0.55} roughness={0.3} />
      </mesh>

      {/* left headlight */}
      <mesh ref={headlightLeftRef} position={[1.25, 0.05, 0.36]}> 
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial emissive={'#ffe8d6'} emissiveIntensity={0} color="#111" />
      </mesh>

      {/* right headlight */}
      <mesh ref={headlightRightRef} position={[1.25, 0.05, -0.36]}> 
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial emissive={'#ffe8d6'} emissiveIntensity={0} color="#111" />
      </mesh>
    </group>
  )
}

function Scene({ onSequenceUpdate, start, pointer, parallax }: { onSequenceUpdate: (stage: string) => void, start: boolean, pointer?: React.MutableRefObject<{ x: number; y: number }>, parallax?: boolean }) {
  const cameraRef = useRef<any>()
  const dirLightRef = useRef<any>()
  const spotRef = useRef<any>()
  const headL = useRef<Mesh>(null!)
  const headR = useRef<Mesh>(null!)
  const body = useRef<Mesh>(null!)
  const groupRef = useRef<any>()

  // subtle idle motion
  useFrame((state, delta) => {
    if (cameraRef.current) {
      const t = state.clock.getElapsedTime() * 0.03
      // base idle
      const baseX = Math.sin(t) * 0.08
      const baseY = 1.6 + Math.sin(t * 0.6) * 0.02

      // pointer-based parallax (only when parallax enabled)
      if (parallax && pointer && pointer.current) {
        // read normalized pointer -1..1
        const pxRaw = pointer.current.x
        const pyRaw = pointer.current.y

        // subtle multipliers for camera parallax in the 3D scene (very small)
        const px = pxRaw * 0.04 // horizontal camera offset
        const py = pyRaw * 0.02 // vertical camera offset

        // lerp camera position for smoothness (slower to be more subtle)
        const lerp = 0.04
        cameraRef.current.position.x += (baseX + px - cameraRef.current.position.x) * lerp
        cameraRef.current.position.y += (baseY + py - cameraRef.current.position.y) * lerp
        cameraRef.current.lookAt(0 + (px * 0.9), 0.15 + (py * 0.35), 0)

        // parallax on car group to enhance depth (more noticeable)
        if (groupRef.current) {
          const gx = pxRaw * -0.02
          const gy = Math.abs(pyRaw) * -0.008
          groupRef.current.position.x += (gx - groupRef.current.position.x) * lerp
          groupRef.current.position.y += (gy - groupRef.current.position.y) * lerp
          // rotation target (very subtle)
          const targetRy = pxRaw * -0.01
          groupRef.current.rotation.y += (targetRy - groupRef.current.rotation.y) * lerp
        }
      } else {
        // when no pointer, gently return group to default
        const lerpBack = 0.08
        if (groupRef.current) {
          groupRef.current.position.x += (0 - groupRef.current.position.x) * lerpBack
          groupRef.current.position.y += (0 - groupRef.current.position.y) * lerpBack
          groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * lerpBack
        }
      }
    }
  })

  useEffect(() => {
    if (!start) return

    // Cinematic GSAP timeline (starts only when parent signals via `start` prop)
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    // start dark (lights off)
    gsap.set([dirLightRef.current, spotRef.current], { intensity: 0 })
    gsap.set([headL.current!.material as MeshStandardMaterial, headR.current!.material as MeshStandardMaterial], { emissiveIntensity: 0 })

    // Wait a small beat (the parent coordinates when to call start)
    tl.to({}, { duration: 0.05 })

      // 2. gradual environment light
      .to(dirLightRef.current, { intensity: 0.18, duration: 2.2 }, 'lightUp')

      // 3. headlights warm up (first clearly perceptible element)
      .to([headL.current!.material as any, headR.current!.material as any], { emissiveIntensity: 3.2, duration: 1.8 }, 'lightUp+=0.5')

      // 4. soft spotlight to carve silhouette
      .to(spotRef.current, { intensity: 1.0, angle: 0.65, distance: 6, duration: 1.6 }, 'silhouette')

      // 5. nudge camera forward slightly
      .to(cameraRef.current.position, { x: 0.2, z: 3.2, duration: 2.2 }, 'silhouette+=0.3')

      // 6. reveal tagline and CTA
      .call(() => onSequenceUpdate('reveal'))
      .to({}, { duration: 0.5 })

    return () => tl.kill()
  }, [start])

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 1.6, 4]} fov={38} />

      {/* directional fill (very subtle) */}
      <directionalLight ref={dirLightRef} position={[0, 3, 2]} intensity={0} color={0xffffff} />

      {/* focused spot to create silhouette/backlight */}
      <spotLight ref={spotRef} position={[-3, 2.6, -1]} intensity={0} penumbra={0.6} castShadow />

      {/* ground subtle reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}> 
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#050505" metalness={0.6} roughness={0.5} />
      </mesh>

      <StylizedCar headlightLeftRef={headL} headlightRightRef={headR} bodyRef={body} groupRef={groupRef} />
    </>
  )
}

export default function Hero({ onExplore }: { onExplore?: () => void }) {
  const [stage, setStage] = useState<'intro' | 'reveal'>('intro')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoSrc = new URL('../../assets_veicles/Aston_Martin_Headlights_silhouette.mp4', import.meta.url).href
  const [lightsStarted, setLightsStarted] = useState(false)
  const pointer = useRef({ x: 0, y: 0 })

  // enable pointer tracking only after reveal; attaches to the hero section
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = document.querySelector('.hero-root') as HTMLElement | null
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      // normalized -1..1
      const nx = (e.clientX - cx) / (rect.width / 2)
      const ny = (e.clientY - cy) / (rect.height / 2)
      // clamp
      pointer.current.x = Math.max(-1, Math.min(1, nx))
      pointer.current.y = Math.max(-1, Math.min(1, ny))
    }

    if (stage === 'reveal') {
      window.addEventListener('mousemove', onMove)
    } else {
      // ensure pointer resets when not in reveal
      pointer.current.x = 0
      pointer.current.y = 0
    }
    return () => window.removeEventListener('mousemove', onMove)
  }, [stage])

  // Apply parallax transform to the VIDEO element itself for broad visibility
  useEffect(() => {
    let raf = 0
    const videoEl = document.getElementById('hero-video') as HTMLVideoElement | null
    if (!videoEl) return

    // working values
    let tx = 0, ty = 0, ry = 0

    // further reduced amplitude for an even subtler parallax
    const maxTx = 5 // px horizontal
    const maxTy = 2.5 // px vertical
    const maxRy = 0.9 // deg rotationY

    // response smoothing: this creates a subtle delay in reaction
    let smoothPx = 0
    let smoothPy = 0
    const responseLerp = 0.06 // how quickly the internal target follows the pointer (smaller = more delay)

    const loop = () => {
      // only run when in reveal
      if (stage !== 'reveal') {
        // gently return transform to neutral (lerp)
        tx += (0 - tx) * 0.08
        ty += (0 - ty) * 0.08
        ry += (0 - ry) * 0.08
        // apply via CSS variables to preserve centering transform
        videoEl.style.setProperty('--tx', `${tx}px`)
        videoEl.style.setProperty('--ty', `${ty}px`)
        videoEl.style.setProperty('--ry', `${ry}deg`)
        raf = requestAnimationFrame(loop)
        return
      }

      const px = pointer.current.x || 0
      const py = pointer.current.y || 0

      // update internal smoothed pointer to introduce subtle delay
      smoothPx += (px - smoothPx) * responseLerp
      smoothPy += (py - smoothPy) * responseLerp

      const targetX = smoothPx * maxTx
      const targetY = smoothPy * maxTy
      const targetRy = smoothPx * -maxRy

      // lerp towards targets for smoothness (slower for subtlety)
      const visualLerp = 0.06
      tx += (targetX - tx) * visualLerp
      ty += (targetY - ty) * visualLerp
      ry += (targetRy - ry) * visualLerp

      // apply via CSS variables so we don't overwrite the centering translate
      videoEl.style.setProperty('--tx', `${tx}px`)
      videoEl.style.setProperty('--ty', `${ty}px`)
      videoEl.style.setProperty('--ry', `${ry}deg`)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage])

  // initial brand animation (fade in/out) — replaced content may be an image
  useEffect(() => {
    const t = gsap.timeline()
    t.set('#brand', { opacity: 0, scale: 1.05 })
      .to('#brand', { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' })
      .to('#brand', { duration: 1.0 })
      .to('#brand', { opacity: 0, scale: 0.995, duration: 1.0, ease: 'power2.inOut' })
      .call(() => setStage('reveal'))
  }, [])

  useEffect(() => {
    if (stage !== 'reveal') return

    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    video.muted = true
    video.loop = false
    video.playsInline = true

    const showVideo = async () => {
      // 2s delay before starting the lights/video (explicit per brief)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // signal Scene to start its cinematic lighting (headlights first)
      setLightsStarted(true)

      // small delay to allow lights to begin (so headlights are visible before full video visibility)
      await new Promise((resolve) => setTimeout(resolve, 200))

      // make the video visible first to prevent showing the poster/last-frame prematurely
      try {
        if (video) {
          video.style.visibility = 'visible'
        }
      } catch (e) {}
      gsap.to('#hero-video', { opacity: 1, duration: 1.4, ease: 'power2.out' })
      gsap.to('#initial-black', {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => {
          const el = document.getElementById('initial-black')
          if (el) el.style.display = 'none'
        },
      })

      try {
        await video.play()
      } catch (error) {
        // ignore autoplay restrictions; the last frame still remains visible
      }
    }

    showVideo()
  }, [stage])

  const handleSequence = (s: string) => {
    if (s === 'reveal') setStage('reveal')
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onEnded = () => {
      try {
        video.pause()
        video.currentTime = Math.max(0, video.duration - 0.02)
      } catch (error) {
        // ignore playback edge cases and keep the last frame visible
      }
    }

    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [])

  return (
    <section className="hero-root">
      <Canvas className="hero-canvas" shadows gl={{ antialias: true }}>
        <Scene onSequenceUpdate={handleSequence} start={lightsStarted} parallax={stage === 'reveal'} pointer={pointer} />
      </Canvas>

        <div id="initial-black" />

      <video
        id="hero-video"
        ref={videoRef}
        src={heroVideoSrc}
        playsInline
        muted
        preload="auto"
      />

      {/* still image used when transitioning to brands to emphasize headlights */}
      <img id="hero-still" src={new URL('../../assets_veicles/car_headligh_off.jpg', import.meta.url).href} alt="car still" />
      <div id="hero-dim" />

        <div className="ui-overlay">
        <div id="brand" className={`brand ${stage === 'intro' ? 'visible' : ''}`}>
          {/* replace the textual brand with an image from assets */}
          <img src={new URL('../../assets_veicles/hetera/hetera_logo_only_name.png', import.meta.url).href} alt="ETHERA" style={{ maxWidth: 420 }} />
        </div>

        <header className={`site-header ${stage === 'reveal' ? 'visible' : ''}`}>
          <img src={new URL('../../assets_veicles/hetera/hetera_only_logo.png', import.meta.url).href} alt="logo" className="header-logo" />
        </header>

        <div className={`tagline ${stage === 'reveal' ? 'visible' : ''}`}>
          <div>The journey begins</div>
          <div className="muted">when the lights awaken</div>
        </div>

        <button onClick={async () => {
          // run a subtle video -> still transition locally, then notify parent to animate page
          try {
            const vid = videoRef.current
            const still = document.getElementById('hero-still') as HTMLImageElement | null
            const dim = document.getElementById('hero-dim') as HTMLElement | null
            const t = gsap.timeline()
            // make still visible and dim the scene while fading the video out
            if (still) still.style.visibility = 'visible'
            t.to(vid, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0)
              .to(still, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
              .to(dim, { opacity: 0.36, duration: 0.9, ease: 'power2.out' }, 0)
            // nudge the still upwards so headlights align near the top of the viewport
            try {
            if (still) {
                // animate a shared CSS variable on the hero-root so the still and UI overlay
                // move together. Use a smaller offset to avoid pushing the still out of view.
                const root = document.querySelector('.hero-root') as HTMLElement | null
                if (root) gsap.to(root, { duration: 0.9, css: { '--reveal-offset': '-12vh' }, ease: 'power2.out' })
              }
            } catch (e) {}
            await t.finished
          } catch (e) {}
          onExplore?.()
        }} className={`cta ${stage === 'reveal' ? 'visible' : ''}`} aria-label="Explore Collection">
          <span className="label">EXPLORE COLLECTION</span>
          <svg className="btn-stroke" viewBox="0 0 180 44" preserveAspectRatio="none" aria-hidden>
            <rect x="0.5" y="0.5" width="179" height="43" rx="8" ry="8" fill="none" />
          </svg>
        </button>

        <nav className={`mini-nav ${stage === 'reveal' ? 'visible' : ''}`}>
          <span>COLLECTION</span>
          <span>GARAGE</span>
          <span>ABOUT</span>
        </nav>
      </div>
    </section>
  )
}
