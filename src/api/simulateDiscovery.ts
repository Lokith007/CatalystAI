import { buildMockResult, delay } from "../lib/mockDiscovery";
import type { DiscoveryInput, DiscoveryResult, PipelineStep } from "../types/discovery";

export type ProgressCallback = (step: PipelineStep) => void;

export async function simulateDiscovery(
  input: DiscoveryInput,
  onProgress?: ProgressCallback
): Promise<DiscoveryResult> {
  onProgress?.("retrieval");
  await delay(900 + Math.random() * 400);
  onProgress?.("generation");
  await delay(800 + Math.random() * 500);
  onProgress?.("prediction");
  await delay(700 + Math.random() * 400);
  const result = buildMockResult(input);
  onProgress?.("complete");
  return result;
}
