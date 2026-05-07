import { buildMockResult, delay } from "../lib/mockDiscovery";
import type { DiscoveryInput, DiscoveryResult, PipelineStep } from "../types/discovery";

export type ProgressCallback = (step: PipelineStep) => void;

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function startDiscoveryRun(input: DiscoveryInput): Promise<string> {
  try {
    const res = await fetch(`${API}/api/discovery/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: "default-project",
        reaction_text: input.reaction,
        temperature_c: input.temperatureC,
        pressure_bar: input.pressureBar,
        cost_weight: input.costWeight,
        sustainability_score: input.sustainabilityScore,
        mode: input.mode,
      }),
    });
    if (!res.ok) throw new Error("API failed");
    const { run_id } = await res.json();
    return run_id;
  } catch (e) {
    console.warn("Backend unavailable, using mock run ID", e);
    return "mock-run-id";
  }
}

export async function pollRunStatus(
  runId: string,
  onProgress: ProgressCallback,
  input: DiscoveryInput
): Promise<DiscoveryResult> {
  if (runId === "mock-run-id") {
    onProgress("retrieval");
    await delay(900 + Math.random() * 400);
    onProgress("generation");
    await delay(800 + Math.random() * 500);
    onProgress("prediction");
    await delay(700 + Math.random() * 400);
    const result = buildMockResult(input);
    onProgress("complete");
    return result;
  }

  while (true) {
    try {
      const res = await fetch(`${API}/api/discovery/run/${runId}/status`);
      if (!res.ok) throw new Error("API failed");
      const { status } = await res.json();
      onProgress(status);
      if (status === "complete") {
        const result = await fetch(`${API}/api/discovery/run/${runId}/result`);
        if (!result.ok) throw new Error("API failed");
        const raw = await result.json();
        
        return {
          known: raw.known.map((k: any) => ({
            id: k.id,
            name: k.name,
            type: k.entity_type,
            knownActivity: k.known_activity,
            knownSelectivity: k.known_selectivity,
            notes: k.notes,
          })),
          candidates: raw.candidates.map((c: any) => ({
            id: c.id,
            name: c.name,
            predictedActivity: c.predicted_activity,
            predictedSelectivity: c.predicted_selectivity,
            predictedStability: c.predicted_stability,
            confidence: c.confidence,
            uncertainty: c.uncertainty,
            badge: c.badge,
            activeLearningHint: c.active_learning_hint,
          })),
          pareto: raw.run.pareto_points || [],
          pathwaySteps: raw.run.pathway_steps || [],
        };
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
       console.warn("Backend unavailable during polling, using mock data", e);
       onProgress("retrieval");
       await delay(500);
       onProgress("generation");
       await delay(500);
       onProgress("prediction");
       await delay(500);
       const result = buildMockResult(input);
       onProgress("complete");
       return result;
    }
  }
}
