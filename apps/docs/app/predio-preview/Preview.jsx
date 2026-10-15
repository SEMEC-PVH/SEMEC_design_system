"use client";
// TEMPORÁRIO: prévia isolada dos andares da SEMFAZ (apagar ao integrar).
// Query: ?andar=receita, ?cam=x,y,z&alvo=x,y,z, ?jogo=x,y (câmera do jogo
// sobre o tile x,y), ?lite=1. window.__predio = { renderer, scene, camera,
// andar, interior, THREE, planejar, verificarAlcance }.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { readPalette } from "@/components/quem-somos/vila-engine";
import { createEscritorio, planejar, verificarAlcance } from "@/components/quem-somos/predio/escritorio";
import { andarPorId } from "@/components/quem-somos/predio/andares";

export default function Preview() {
  const host = useRef(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const num = (s, d) => (s ? s.split(",").map(Number) : d);
    const lite = q.get("lite") === "1";
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !lite });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lite;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.current.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 150);
    const pal = readPalette();
    const disposables = [];
    const track = (x) => (disposables.push(x), x);
    const andar = andarPorId(q.get("andar") || "receita");
    const interior = createEscritorio({ andar, pal, track, lite, reducedMotion });
    if (q.get("jogo")) {
      const [tx, ty] = num(q.get("jogo"));
      const a = interior.tileToWorld(tx, ty);
      camera.position.set(a.x, 10.5, a.z + 9);
      camera.lookAt(a.x, 0.4, a.z);
    } else {
      const [cx, cy, cz] = num(q.get("cam"), [0, 12, 13]);
      const [ax, ay, az] = num(q.get("alvo"), [0, 0.6, 0]);
      camera.position.set(cx, cy, cz);
      camera.lookAt(ax, ay, az);
    }
    window.__predio = { renderer, scene: interior.scene, camera, andar, interior, THREE, planejar, verificarAlcance };
    const resize = () => {
      const w = host.current.clientWidth;
      const h = host.current.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    addEventListener("resize", resize);
    let last = null;
    let t = 0;
    renderer.setAnimationLoop((ts) => {
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.05);
      last = ts;
      t += dt;
      interior.update(t, dt);
      renderer.render(interior.scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null);
      removeEventListener("resize", resize);
      interior.dispose();
      for (const d of disposables) d.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} style={{ position: "fixed", inset: 0 }} />;
}
