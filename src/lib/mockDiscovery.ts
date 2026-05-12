import type {
  AICandidate,
  DiscoveryInput,
  DiscoveryResult,
  KnownEntity,
  ParetoPoint,
} from "../types/discovery";

const KNOWN_POOL: KnownEntity[] = [
  {
    id: "k1",
    name: "Cu/ZnO/Al₂O₃",
    type: "catalyst",
    knownActivity: 82,
    knownSelectivity: 74,
    knownStability: 85,
    notes: "Industrial methanol synthesis catalyst.",
    composition: { Cu: 2, Zn: 1, Al: 2, O: 5 },
  },
  {
    id: "k2",
    name: "In₂O₃/ZrO₂",
    type: "catalyst",
    knownActivity: 71,
    knownSelectivity: 88,
    knownStability: 76,
    notes: "High methanol selectivity from CO₂.",
    composition: { In: 2, Zr: 1, O: 5 },
  },
  {
    id: "k3",
    name: "Co/Al₂O₃",
    type: "catalyst",
    knownActivity: 85,
    knownSelectivity: 76,
    knownStability: 80,
    notes: "Cobalt-based Fischer-Tropsch catalyst.",
    composition: { Co: 1, Al: 2, O: 3 },
  },
  {
    id: "k4",
    name: "Ni/Al₂O₃",
    type: "catalyst",
    knownActivity: 84,
    knownSelectivity: 92,
    knownStability: 78,
    notes: "Classic Sabatier methanation catalyst.",
    composition: { Ni: 1, Al: 2, O: 3 },
  },
];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function pseudoRandom(seed: number, i: number): number {
  const x = Math.sin(seed * 9999 + i * 777) * 10000;
  return x - Math.floor(x);
}

function pickUncertainty(confidence: number): AICandidate["uncertainty"] {
  if (confidence >= 78) return "low";
  if (confidence >= 62) return "medium";
  return "high";
}

function pickBadge(activity: number, stability: number): AICandidate["badge"] {
  if (activity >= 82 && stability >= 75) return "High";
  if (activity >= 68 && stability >= 60) return "Medium";
  return "Experimental";
}

const MOCK_MUTATIONS = [
  {
    suffix: " -K promoted",
    description: "K promoter suppresses competing side reactions by tuning surface basicity",
    compositionMod: (c: Record<string, number>) => ({ ...c, K: 1 }),
  },
  {
    suffix: "/ZrO₂",
    description: "ZrO₂ support provides strong metal-support interaction enhancing stability",
    compositionMod: (c: Record<string, number>) => ({ ...c, Zr: 1 }),
  },
  {
    suffix: " (single-atom)",
    description: "Single-atom dispersion maximizes atom utilization and exposes uniform active sites",
    compositionMod: (c: Record<string, number>) => c,
  },
];

export function buildMockResult(input: DiscoveryInput): DiscoveryResult {
  const seed = hashStr(
    `${input.reaction}|${input.mode}|${input.temperatureC}|${input.pressureBar}`
  );
  const sus = input.sustainabilityScore / 100;

  const known: KnownEntity[] = KNOWN_POOL.slice(0, 4).map((k, i) => ({
    ...k,
    knownActivity: clamp(
      k.knownActivity + Math.round((pseudoRandom(seed, i) - 0.5) * 8),
      40,
      95
    ),
    knownSelectivity: clamp(
      k.knownSelectivity + Math.round((pseudoRandom(seed, i + 10) - 0.5) * 6),
      40,
      95
    ),
  }));

  const candidates: AICandidate[] = known.slice(0, 3).map((parent, i) => {
    const mut = MOCK_MUTATIONS[i % MOCK_MUTATIONS.length];
    const r1 = pseudoRandom(seed, 20 + i);
    const r2 = pseudoRandom(seed, 30 + i);
    const r3 = pseudoRandom(seed, 40 + i);
    const base = 55 + sus * 22 + (input.costWeight < 40 ? 6 : input.costWeight > 70 ? -4 : 0);

    const predictedActivity = clamp(
      Math.round(base + r1 * 20 + (input.temperatureC > 350 ? 4 : 0)),
      38,
      96
    );
    const predictedSelectivity = clamp(
      Math.round(parent.knownSelectivity + (r2 - 0.5) * 14),
      42,
      97
    );
    const predictedStability = clamp(
      Math.round(parent.knownStability + r3 * 10 - 5),
      40,
      96
    );
    const confidence = clamp(
      Math.round(58 + pseudoRandom(seed, 50 + i) * 32),
      48,
      92
    );
    const uncertainty = pickUncertainty(confidence);
    const badge = pickBadge(predictedActivity, predictedStability);
    const activeLearningHint =
      uncertainty === "high"
        ? "High uncertainty — high information gain if tested experimentally."
        : uncertainty === "medium"
          ? "Moderate epistemic uncertainty on stability branch."
          : undefined;

    return {
      id: `ai-${i + 1}`,
      name: `${parent.name}${mut.suffix}`,
      description: mut.description,
      composition: parent.composition ? mut.compositionMod(parent.composition) : undefined,
      predictedActivity,
      predictedSelectivity,
      predictedStability,
      confidence,
      uncertainty,
      badge,
      activeLearningHint,
    };
  });

  const ELEMENT_COST: Record<string, number> = {
    Fe: 5, Ni: 12, Cu: 15, Zn: 10, Al: 8, Si: 3,
    Co: 35, Pd: 88, Pt: 95, Ru: 82, Rh: 92, Au: 90,
    In: 45, Ga: 40, Zr: 22, Ce: 25,
  };
  function costFromComp(comp: Record<string, number> | undefined, _name: string): number {
    if (comp) {
      const total = Object.entries(comp).reduce(
        (s, [el, amt]) => s + (ELEMENT_COST[el] ?? 30) * amt, 0
      );
      const count = Object.values(comp).reduce((s, v) => s + v, 0);
      return Math.min(95, total / Math.max(count, 1));
    }
    return 30;
  }

  const pareto: ParetoPoint[] = [
    ...known.map((k, i) => ({
      id: k.id,
      name: k.name,
      yield: clamp(k.knownActivity * 0.88 + pseudoRandom(seed, 100 + i) * 4, 35, 95),
      cost: costFromComp(k.composition, k.name),
      stability: k.knownStability,
      source: "known" as const,
    })),
    ...candidates.map((c, _i) => ({
      id: c.id,
      name: c.name,
      yield: clamp(c.predictedActivity * 0.90, 35, 95),
      cost: costFromComp(c.composition, c.name),
      stability: c.predictedStability,
      source: "ai" as const,
    })),
  ].map((p) => ({
    ...p,
    yield: Math.round(p.yield * 10) / 10,
    cost: Math.round(p.cost * 10) / 10,
  }));

  const pathwaySteps = [
    { label: "Precursor adsorption", energy: 0 },
    { label: "C–O scission TS", energy: 42 + (seed % 18) },
    { label: "Surface carbene", energy: 18 + (seed % 12) },
    { label: "Chain growth / coupling", energy: -8 - (seed % 10) },
    { label: "Product desorption", energy: 12 + (seed % 8) },
  ];

  return { known, candidates, pareto, pathwaySteps };
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
