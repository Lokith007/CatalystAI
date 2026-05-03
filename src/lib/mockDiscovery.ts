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
    name: "Cu-Zn/Al₂O₃ (HT)",
    type: "catalyst",
    knownActivity: 78,
    knownSelectivity: 71,
    notes: "Methanol synthesis; industrial baseline.",
  },
  {
    id: "k2",
    name: "MoS₂ edge sites",
    type: "catalyst",
    knownActivity: 65,
    knownSelectivity: 82,
    notes: "HDS analog; tunable edge density.",
  },
  {
    id: "k3",
    name: "ADH7 (yeast)",
    type: "enzyme",
    knownActivity: 72,
    knownSelectivity: 88,
    notes: "Ethanol oxidation; cofactor dependent.",
  },
  {
    id: "k4",
    name: "MeOH → olefins (MTO)",
    type: "pathway",
    knownActivity: 81,
    knownSelectivity: 69,
    notes: "Zeolite-coupled carbene pool.",
  },
  {
    id: "k5",
    name: "Fe–N–C ORR",
    type: "catalyst",
    knownActivity: 70,
    knownSelectivity: 76,
    notes: " PGM-free oxygen reduction.",
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

function pickBadge(
  activity: number,
  stability: number
): AICandidate["badge"] {
  if (activity >= 82 && stability >= 75) return "High";
  if (activity >= 68 && stability >= 60) return "Medium";
  return "Experimental";
}

export function buildMockResult(input: DiscoveryInput): DiscoveryResult {
  const seed = hashStr(
    `${input.reaction}|${input.mode}|${input.temperatureC}|${input.pressureBar}`
  );
  const modeBias = input.mode === "synbio" ? 4 : -2;
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

  const names =
    input.mode === "synbio"
      ? [
          "Synthase chimera v3",
          "Rerouted NADPH shuttle",
          "Surface-displayed oxidoreductase",
          "CRISPRi-tuned pathway node",
          "De novo pocket scaffold X1",
        ]
      : [
          "Single-atom Co–N₄ variant",
          "Sulfided Ni–Mo/W edge ensemble",
          "Zeolite-confined carbene relay",
          "Perovskite B-site substituted",
          "Liquid alloy interfacial site",
        ];

  const candidates: AICandidate[] = names.map((name, i) => {
    const r1 = pseudoRandom(seed, 20 + i);
    const r2 = pseudoRandom(seed, 30 + i);
    const r3 = pseudoRandom(seed, 40 + i);
    const base =
      55 +
      sus * 22 +
      modeBias +
      (input.costWeight < 40 ? 6 : input.costWeight > 70 ? -4 : 0);
    const predictedActivity = clamp(
      Math.round(base + r1 * 28 + (input.temperatureC > 350 ? 4 : 0)),
      38,
      96
    );
    const predictedSelectivity = clamp(
      Math.round(60 + r2 * 32 - (input.pressureBar > 40 ? 3 : 0)),
      42,
      97
    );
    const predictedStability = clamp(
      Math.round(52 + r3 * 38 + (input.mode === "catalysis" ? 5 : 2)),
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
        ? "High uncertainty → high information gain if tested."
        : uncertainty === "medium"
          ? "Moderate epistemic uncertainty on stability branch."
          : undefined;

    return {
      id: `ai-${i + 1}`,
      name,
      predictedActivity,
      predictedSelectivity,
      predictedStability,
      confidence,
      uncertainty,
      badge,
      activeLearningHint,
    };
  });

  const pareto: ParetoPoint[] = [
    ...known.map((k, i) => ({
      id: k.id,
      name: k.name,
      yield: clamp(k.knownActivity + pseudoRandom(seed, 100 + i) * 8, 45, 92),
      cost: clamp(35 + pseudoRandom(seed, 110 + i) * 55, 20, 95),
      stability: k.knownSelectivity,
      source: "known" as const,
    })),
    ...candidates.map((c, i) => ({
      id: c.id,
      name: c.name,
      yield: c.predictedActivity * 0.92 + pseudoRandom(seed, 200 + i) * 5,
      cost: clamp(25 + pseudoRandom(seed, 210 + i) * 60, 15, 90),
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
