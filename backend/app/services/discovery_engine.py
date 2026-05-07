"""Discovery engine — the real pipeline replacing mockDiscovery.ts.

For now this uses the same deterministic logic as the original frontend mock,
but structured so you can swap in real ML models later without changing the API.
"""

import math
import hashlib
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models.catalyst import Catalyst
from ..models.candidate import Candidate
from ..models.discovery_run import DiscoveryRun


# ---------- helpers (ported from mockDiscovery.ts) ----------

def _clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def _hash_str(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % (10**9)


def _pseudo_random(seed: int, i: int) -> float:
    x = math.sin(seed * 9999 + i * 777) * 10000
    return x - math.floor(x)


def _pick_uncertainty(confidence: float) -> str:
    if confidence >= 78:
        return "low"
    if confidence >= 62:
        return "medium"
    return "high"


def _pick_badge(activity: float, stability: float) -> str:
    if activity >= 82 and stability >= 75:
        return "High"
    if activity >= 68 and stability >= 60:
        return "Medium"
    return "Experimental"


# ---------- candidate name pools ----------

CATALYSIS_NAMES = [
    "Single-atom Co–N₄ variant",
    "Sulfided Ni–Mo/W edge ensemble",
    "Zeolite-confined carbene relay",
    "Perovskite B-site substituted",
    "Liquid alloy interfacial site",
]

SYNBIO_NAMES = [
    "Synthase chimera v3",
    "Rerouted NADPH shuttle",
    "Surface-displayed oxidoreductase",
    "CRISPRi-tuned pathway node",
    "De novo pocket scaffold X1",
]


# ---------- main pipeline ----------

def run_discovery_pipeline(run: DiscoveryRun, db: Session) -> None:
    """Execute the full discovery pipeline synchronously.

    Updates the run status as it progresses and creates candidates in the DB.
    """
    run.started_at = datetime.now(timezone.utc)

    # --- Step 1: RETRIEVAL ---
    run.status = "retrieval"
    db.commit()

    known_catalysts = db.query(Catalyst).all()

    # --- Step 2: GENERATION ---
    run.status = "generation"
    db.commit()

    seed = _hash_str(f"{run.reaction_text}|{run.mode}|{run.temperature_c}|{run.pressure_bar}")
    mode_bias = 4 if run.mode == "synbio" else -2
    sus = run.sustainability / 100
    names = SYNBIO_NAMES if run.mode == "synbio" else CATALYSIS_NAMES

    candidates = []
    for i, name in enumerate(names):
        r1 = _pseudo_random(seed, 20 + i)
        r2 = _pseudo_random(seed, 30 + i)
        r3 = _pseudo_random(seed, 40 + i)
        base = 55 + sus * 22 + mode_bias + (6 if run.cost_weight < 40 else -4 if run.cost_weight > 70 else 0)

        predicted_activity = _clamp(round(base + r1 * 28 + (4 if run.temperature_c > 350 else 0)), 38, 96)
        predicted_selectivity = _clamp(round(60 + r2 * 32 - (3 if run.pressure_bar > 40 else 0)), 42, 97)
        predicted_stability = _clamp(round(52 + r3 * 38 + (5 if run.mode == "catalysis" else 2)), 40, 96)
        confidence = _clamp(round(58 + _pseudo_random(seed, 50 + i) * 32), 48, 92)
        uncertainty = _pick_uncertainty(confidence)
        badge = _pick_badge(predicted_activity, predicted_stability)

        hint = None
        if uncertainty == "high":
            hint = "High uncertainty → high information gain if tested."
        elif uncertainty == "medium":
            hint = "Moderate epistemic uncertainty on stability branch."

        candidate = Candidate(
            discovery_run_id=run.id,
            name=name,
            description=f"AI-generated candidate for {run.reaction_text}",
            predicted_activity=predicted_activity,
            predicted_selectivity=predicted_selectivity,
            predicted_stability=predicted_stability,
            confidence=confidence,
            uncertainty=uncertainty,
            badge=badge,
            active_learning_hint=hint,
            generative_model="mock-v1",
        )
        candidates.append(candidate)

    # --- Step 3: PREDICTION (scoring & Pareto) ---
    run.status = "prediction"
    db.commit()

    # Build Pareto points from known + AI candidates
    pareto_points = []
    for j, k in enumerate(known_catalysts):
        pareto_points.append({
            "id": k.id,
            "name": k.name,
            "yield": round(_clamp(k.known_activity + _pseudo_random(seed, 100 + j) * 8, 45, 92), 1),
            "cost": round(_clamp(35 + _pseudo_random(seed, 110 + j) * 55, 20, 95), 1),
            "stability": k.known_selectivity,
            "source": "known",
        })
    for j, c in enumerate(candidates):
        pareto_points.append({
            "id": f"ai-{j + 1}",
            "name": c.name,
            "yield": round(c.predicted_activity * 0.92 + _pseudo_random(seed, 200 + j) * 5, 1),
            "cost": round(_clamp(25 + _pseudo_random(seed, 210 + j) * 60, 15, 90), 1),
            "stability": c.predicted_stability,
            "source": "ai",
        })

    from ..models.reaction import Reaction
    reaction_obj = db.query(Reaction).filter(Reaction.name == run.reaction_text).first()

    # Pathway energy diagram
    if reaction_obj and reaction_obj.pathway_template:
        pathway_steps = []
        for i, step in enumerate(reaction_obj.pathway_template):
            noise = (seed % (8 + i * 2)) - 4 if i > 0 else 0
            pathway_steps.append({"label": step["label"], "energy": step["energy"] + noise})
    else:
        pathway_steps = [
            {"label": "Precursor adsorption", "energy": 0},
            {"label": "Activation TS", "energy": 42 + (seed % 18)},
            {"label": "Intermediate", "energy": 18 + (seed % 12)},
            {"label": "Conversion", "energy": -8 - (seed % 10)},
            {"label": "Product desorption", "energy": 12 + (seed % 8)},
        ]

    # Dynamically prefix candidate names if reaction is known
    prefix = ""
    if reaction_obj and reaction_obj.output_species and len(reaction_obj.output_species) > 0:
        target = reaction_obj.output_species[0]
        # just a short tag like "[NH₃] "
        if len(target) > 8: target = target[:6] + "…"
        prefix = f"[{target}] "

    # update candidate names retrospectively (they were created in Step 2)
    for c in candidates:
        if not c.name.startswith("["):
            c.name = f"{prefix}{c.name}"

    # Also update pareto names for ai candidates
    for p in pareto_points:
        if p["source"] == "ai" and not p["name"].startswith("["):
            p["name"] = f"{prefix}{p['name']}"

    # --- Step 4: COMPLETE ---
    db.add_all(candidates)
    run.pareto_points = pareto_points
    run.pathway_steps = pathway_steps
    run.status = "complete"
    run.completed_at = datetime.now(timezone.utc)
    db.commit()
