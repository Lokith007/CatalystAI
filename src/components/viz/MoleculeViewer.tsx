import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { Suspense, useMemo } from "react";

// CPK-inspired color map for catalytic elements
const ELEMENT_COLORS: Record<string, string> = {
  Cu: "#B87333", Zn: "#7d8a8a", Al: "#C0C0C0", O: "#FF4444",
  Fe: "#c0392b", Ni: "#5dade2", Pd: "#2ecc71", Pt: "#ecf0f1",
  Ru: "#8e44ad", Ag: "#bdc3c7", Co: "#2980b9", Mn: "#e67e22",
  Cr: "#27ae60", Mo: "#1abc9c", Si: "#f39c12", Zr: "#9b59b6",
  Ce: "#16a085", Ti: "#3498db", La: "#e91e63", In: "#ff9800",
  Ga: "#4caf50", K: "#9c27b0", Mg: "#607d8b", Ca: "#795548",
  Rh: "#00bcd4", Ir: "#607d8b", Au: "#ffd700", S: "#ffeb3b",
  N: "#4fc3f7", C: "#90a4ae",
};

// Fibonacci sphere placement for up to ~15 atoms
function fibonacciPositions(count: number, radius: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1 || 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    positions.push([radius * r * Math.cos(theta), radius * y, radius * r * Math.sin(theta)]);
  }
  return positions;
}

interface AtomSpec {
  pos: [number, number, number];
  color: string;
  r: number;
}

function MockCluster({ seed = 0, composition }: { seed?: number; composition?: Record<string, number> }) {
  const atoms = useMemo((): AtomSpec[] => {
    if (composition && Object.keys(composition).length > 0) {
      // Build atom list from composition, capped at 12 for rendering performance
      const entries = Object.entries(composition)
        .filter(([, amt]) => amt > 0)
        .sort((a, b) => b[1] - a[1]);

      const atomList: { element: string; color: string }[] = [];
      for (const [el, amt] of entries) {
        const color = ELEMENT_COLORS[el] ?? "#00d4ff";
        const repeat = Math.min(amt, 4);
        for (let i = 0; i < repeat; i++) {
          atomList.push({ element: el, color });
          if (atomList.length >= 12) break;
        }
        if (atomList.length >= 12) break;
      }

      // Central atom is largest element
      const positions = atomList.length === 1
        ? [[0, 0, 0] as [number, number, number]]
        : fibonacciPositions(atomList.length, 0.75);

      return atomList.map((a, i) => ({
        pos: positions[i] ?? [0, 0, 0],
        color: a.color,
        r: i === 0 ? 0.35 : 0.22,
      }));
    }

    // Fallback: seed-based pseudo-random cluster
    const rand = (i: number) => {
      const x = Math.sin(seed * 9999 + i * 777) * 10000;
      return x - Math.floor(x);
    };
    const baseAtoms: AtomSpec[] = [
      { pos: [0, 0, 0], color: "#00d4ff", r: 0.35 },
      { pos: [0.55, 0.35, 0.1], color: "#a855f7", r: 0.28 },
      { pos: [-0.45, 0.25, -0.2], color: "#fb923c", r: 0.22 },
      { pos: [0.35, -0.4, 0.25], color: "#7c3aed", r: 0.24 },
      { pos: [-0.3, -0.35, 0.15], color: "#22d3ee", r: 0.2 },
    ];
    return baseAtoms.map((a, i) => ({
      ...a,
      pos: [
        a.pos[0] + (rand(i * 3) - 0.5) * 0.3,
        a.pos[1] + (rand(i * 3 + 1) - 0.5) * 0.3,
        a.pos[2] + (rand(i * 3 + 2) - 0.5) * 0.3,
      ] as [number, number, number],
    }));
  }, [seed, composition]);

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

export function MoleculeViewer({
  seed = 0,
  composition,
}: {
  seed?: number;
  composition?: Record<string, number>;
}) {
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
          <MockCluster seed={seed} composition={composition} />
        </Canvas>
      </Suspense>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-400 backdrop-blur">
        Active-site cluster · drag to rotate
      </div>
    </div>
  );
}
