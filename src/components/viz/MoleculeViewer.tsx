import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { Suspense, useMemo } from "react";

function MockCluster() {
  const atoms = useMemo(
    () => [
      { pos: [0, 0, 0] as [number, number, number], color: "#00d4ff", r: 0.35 },
      { pos: [0.55, 0.35, 0.1] as [number, number, number], color: "#a855f7", r: 0.28 },
      { pos: [-0.45, 0.25, -0.2] as [number, number, number], color: "#fb923c", r: 0.22 },
      { pos: [0.35, -0.4, 0.25] as [number, number, number], color: "#7c3aed", r: 0.24 },
      { pos: [-0.3, -0.35, 0.15] as [number, number, number], color: "#22d3ee", r: 0.2 },
    ],
    []
  );

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} color="#e0e7ff" />
      <pointLight position={[-3, -2, 2]} intensity={0.6} color="#a855f7" />
      {atoms.map((a, i) => (
        <Sphere key={i} args={[a.r, 32, 32]} position={a.pos}>
          <meshStandardMaterial
            color={a.color}
            metalness={0.35}
            roughness={0.35}
            emissive={a.color}
            emissiveIntensity={0.15}
          />
        </Sphere>
      ))}
      <OrbitControls enablePan={false} minDistance={1.8} maxDistance={5} />
    </group>
  );
}

export function MoleculeViewer() {
  return (
    <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-ink/80 to-void shadow-inner">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.08),transparent_70%)]" />
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Initializing WebGL…
          </div>
        }
      >
        <Canvas camera={{ position: [1.8, 1.4, 2.2], fov: 42 }}>
          <MockCluster />
        </Canvas>
      </Suspense>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-400 backdrop-blur">
        Mock active-site cluster · drag to rotate
      </div>
    </div>
  );
}
