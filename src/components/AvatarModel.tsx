"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * HERO AVATAR — the 3D character (public/models/avatar.glb) rendered with three.js.
 * The model has no baked animation, so it is animated here through its named rig:
 *  - idle: gentle sway and breathing, hair moving a little
 *  - the head turns to follow the cursor; the eyes blink every few seconds
 *  - waves (right forearm, from the raised peace-sign pose) once after the
 *    loading screen, again on hover, and on tap on touch screens
 * three.js loads only in the browser, after the page, so it doesn't slow the first paint.
 * Paused off screen; with reduced motion it is a still pose.
 */
const MODEL = "/models/avatar.glb";
const WAVE_MS = 1700;

const subscribeTouch = () => () => {};
const isTouch = () => window.matchMedia("(hover: none)").matches;

export default function AvatarModel({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [waved, setWaved] = useState(false);
  const touch = useSyncExternalStore(subscribeTouch, isTouch, () => false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (disposed) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.5));
      const key = new THREE.DirectionalLight(0xfff4ea, 2.2);
      key.position.set(2, 3, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xf43f5e, 2.4); // the site's pink, from behind
      rim.position.set(-3, 2, -3);
      scene.add(rim);

      const gltf = await new GLTFLoader().loadAsync(MODEL);
      if (disposed) {
        renderer.dispose();
        return;
      }
      const root = gltf.scene;
      scene.add(root);
      const get = (name: string) => root.getObjectByName(name)!;
      const rig = get("rig");
      const head = get("head_pivot");
      const eyes = [get("eye_L"), get("eye_R")];
      const brows = [get("brow_L"), get("brow_R")];
      const forearm = get("forearm_R");
      const arm = get("arm_R");
      const hair = get("hair_top");
      const base = {
        headY: head.rotation.y,
        headX: head.rotation.x,
        forearm: forearm.rotation.z,
        arm: arm.rotation.z,
        browY: brows.map((b) => b.position.y),
      };

      // frame the whole body, a little room around it
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
      const fit = () => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const half = (28 * Math.PI) / 360;
        const byHeight = (size.y * 0.56) / Math.tan(half);
        const byWidth = (size.x * 0.6) / (Math.tan(half) * camera.aspect);
        camera.position.set(centre.x, centre.y + size.y * 0.02, centre.z + Math.max(byHeight, byWidth) + size.z / 2);
        camera.lookAt(centre.x, centre.y, centre.z);
        camera.updateProjectionMatrix();
      };
      fit();

      /* ---- interaction ------------------------------------------------- */
      const look = { x: 0, y: 0 }; // where the cursor is, -1…1 around the model
      const lookNow = { x: 0, y: 0 };
      let waveStart = -1e9;
      let nextBlink = performance.now() + 2500;
      let blinkStart = -1e9;
      // byVisitor: hide the "say hi" hint only once someone actually hovers / taps
      const wave = (byVisitor = true) => {
        waveStart = performance.now();
        if (byVisitor) setWaved(true);
      };
      const onMove = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        look.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        look.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight / 2)));
      };
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && performance.now() - waveStart > WAVE_MS) wave();
      };
      const onTap = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") wave();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerup", onTap);
      const onLoaded = () => setTimeout(() => wave(false), 400);
      if (document.documentElement.dataset.loaderGone) onLoaded();
      else window.addEventListener("loader:gone", onLoaded, { once: true });

      /* ---- animation --------------------------------------------------- */
      const pose = (now: number) => {
        const t = now / 1000;
        // idle: sway + breathe, hair follows a touch behind
        rig.rotation.y = Math.sin(t * 0.45) * 0.12;
        rig.position.y = Math.sin(t * 1.7) * 0.003;
        hair.rotation.z = Math.sin(t * 1.1 - 0.6) * 0.025;
        // the head turns toward the cursor (eased)
        lookNow.x += (look.x - lookNow.x) * 0.08;
        lookNow.y += (look.y - lookNow.y) * 0.08;
        head.rotation.y = base.headY + lookNow.x * 0.55 - rig.rotation.y * 0.6;
        head.rotation.x = base.headX + lookNow.y * 0.28;
        head.rotation.z = Math.sin(t * 0.8) * 0.04;
        // blink
        if (now > nextBlink) {
          blinkStart = now;
          nextBlink = now + 2200 + Math.random() * 3200;
        }
        const b = (now - blinkStart) / 140;
        const lid = b < 0 || b > 2 ? 1 : 0.1 + 0.9 * Math.abs(1 - b);
        for (const e of eyes) e.scale.y = lid;
        // wave: the raised forearm swings, brows lift
        const w = (now - waveStart) / WAVE_MS;
        const on = w >= 0 && w < 1 ? Math.sin(Math.PI * w) : 0; // eases in and out
        forearm.rotation.z = base.forearm + Math.sin(w * Math.PI * 7) * 0.38 * on;
        arm.rotation.z = base.arm - 0.12 * on;
        brows.forEach((br, i) => (br.position.y = base.browY[i] + 0.006 * on));
      };

      let raf = 0;
      let visible = true;
      const loop = (now: number) => {
        pose(now);
        renderer.render(scene, camera);
        raf = visible && !reduce ? requestAnimationFrame(loop) : 0;
      };
      const start = () => {
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
      });
      io.observe(wrap);
      const ro = new ResizeObserver(() => {
        fit();
        if (reduce) renderer.render(scene, camera);
      });
      ro.observe(wrap);
      start();
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("loader:gone", onLoaded);
        wrap.removeEventListener("pointerenter", onEnter);
        wrap.removeEventListener("pointerup", onTap);
        root.traverse((o) => {
          const m = o as import("three").Mesh;
          if (m.isMesh) {
            m.geometry.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
          }
        });
        renderer.dispose();
      };
    })().catch((err) => console.error("Avatar failed to load", err));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative touch-manipulation ${className}`} role="img" aria-label="3D cartoon avatar of Sourav waving">
      {/* soft floor shadow under the feet */}
      <div aria-hidden className="pointer-events-none absolute bottom-[3%] left-1/2 h-[4%] w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(244,63,94,0.28),transparent)]" />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
      <span
        className={`pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 transition-opacity duration-500 ${ready && !waved ? "opacity-100" : "opacity-0"}`}
      >
        {touch ? "Tap to say hi" : "Hover to say hi"}
      </span>
    </div>
  );
}
