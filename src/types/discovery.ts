export type DiscoveryMode = "catalysis";

export type UncertaintyLevel = "low" | "medium" | "high";

export type PerformanceBadge = "High" | "Medium" | "Experimental";

export interface ReactionSummary {
  id: string;
  name: string;
  category: string;
  defaultTempC: number;
  defaultPressureBar: number;
  defaultCostWeight: number;
  defaultSustainability: number;
}

export interface DiscoveryInput {
  reaction: string;
  reactionId?: string;
  temperatureC: number;
  pressureBar: number;
  costWeight: number;
  sustainabilityScore: number;
  mode: DiscoveryMode;
}

export interface KnownEntity {
  id: string;
  name: string;
  type: "catalyst" | "enzyme" | "pathway";
  knownActivity: number;
  knownSelectivity: number;
  knownStability: number;
  notes: string;
  composition?: Record<string, number>;
}

export interface AICandidate {
  id: string;
  name: string;
  description: string;
  composition?: Record<string, number>;
  predictedActivity: number;
  predictedSelectivity: number;
  predictedStability: number;
  confidence: number;
  uncertainty: UncertaintyLevel;
  badge: PerformanceBadge;
  activeLearningHint?: string;
}

export interface ParetoPoint {
  id: string;
  name: string;
  yield: number;
  cost: number;
  stability: number;
  source: "known" | "ai";
}

export interface DiscoveryResult {
  known: KnownEntity[];
  candidates: AICandidate[];
  pareto: ParetoPoint[];
  pathwaySteps: { label: string; energy: number }[];
}

export type PipelineStep =
  | "idle"
  | "retrieval"
  | "generation"
  | "prediction"
  | "complete";
