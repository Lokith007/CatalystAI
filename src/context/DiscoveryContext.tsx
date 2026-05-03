import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { simulateDiscovery } from "../api/simulateDiscovery";
import type {
  DiscoveryInput,
  DiscoveryResult,
  PipelineStep,
} from "../types/discovery";

const defaultInput: DiscoveryInput = {
  reaction: "Ethanol → Jet fuel (C8–C16)",
  temperatureC: 320,
  pressureBar: 25,
  costWeight: 50,
  sustainabilityScore: 78,
  mode: "catalysis",
};

type DiscoveryContextValue = {
  input: DiscoveryInput;
  setInput: (patch: Partial<DiscoveryInput>) => void;
  result: DiscoveryResult | null;
  pipelineStep: PipelineStep;
  isRunning: boolean;
  modelConfidence: number;
  lastFeedbackDelta: number | null;
  runDiscovery: () => Promise<void>;
  submitFeedback: (payload: {
    candidateId: string;
    actualYield: number;
    actualSelectivity: number;
    actualStability: number;
  }) => void;
  exportJson: () => void;
};

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const [input, setInputState] = useState<DiscoveryInput>(defaultInput);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [modelConfidence, setModelConfidence] = useState(72);
  const [lastFeedbackDelta, setLastFeedbackDelta] = useState<number | null>(
    null
  );

  const setInput = useCallback((patch: Partial<DiscoveryInput>) => {
    setInputState((prev) => ({ ...prev, ...patch }));
  }, []);

  const runDiscovery = useCallback(async () => {
    setIsRunning(true);
    setPipelineStep("retrieval");
    setLastFeedbackDelta(null);
    try {
      const res = await simulateDiscovery(input, (step) => {
        if (step === "complete") {
          setPipelineStep("idle");
        } else {
          setPipelineStep(step);
        }
      });
      setResult(res);
    } finally {
      setIsRunning(false);
      setPipelineStep("idle");
    }
  }, [input]);

  const submitFeedback = useCallback(
    (payload: {
      candidateId: string;
      actualYield: number;
      actualSelectivity: number;
      actualStability: number;
    }) => {
      void payload;
      const delta = 3;
      setModelConfidence((c) => Math.min(99, c + delta));
      setLastFeedbackDelta(delta);
    },
    []
  );

  const exportJson = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            input,
            result,
            modelConfidence,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalystai-lab-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [input, result, modelConfidence]);

  const value = useMemo(
    () => ({
      input,
      setInput,
      result,
      pipelineStep,
      isRunning,
      modelConfidence,
      lastFeedbackDelta,
      runDiscovery,
      submitFeedback,
      exportJson,
    }),
    [
      input,
      setInput,
      result,
      pipelineStep,
      isRunning,
      modelConfidence,
      lastFeedbackDelta,
      runDiscovery,
      submitFeedback,
      exportJson,
    ]
  );

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
}

export function useDiscovery(): DiscoveryContextValue {
  const ctx = useContext(DiscoveryContext);
  if (!ctx) {
    throw new Error("useDiscovery must be used within DiscoveryProvider");
  }
  return ctx;
}
