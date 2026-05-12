"""Chemistry-aware discovery engine.

Replaces the original mock pipeline with real reaction matching,
catalyst scoring via the M2M compat table, deterministic AI candidate
generation via catalyst_mutations, and element-cost-based Pareto points.
"""

import re
import hashlib
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models.catalyst import Catalyst
from ..models.candidate import Candidate
from ..models.discovery_run import DiscoveryRun
from .catalyst_mutations import apply_mutation
from .element_costs import estimate_cost_index


# ──────────────────────────── helpers ────────────────────────────────────────

def _clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def _hash_str(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % (10 ** 9)


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


# ──────────────────────────── reaction matching ───────────────────────────────

def _normalize(text: str) -> str:
    """Lowercase, strip unicode subscripts, remove punctuation."""
    text = text.lower().strip()
    subs = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")
    text = text.translate(subs)
    text = re.sub(r"[→⇒\-/(),]", " ", text)
    return text


def _reaction_score(input_norm: str, reaction) -> int:
    score = 0
    rxn_norm = _normalize(reaction.name)

    # Exact normalized match
    if input_norm == rxn_norm:
        return 200

    # Substring containment
    if input_norm in rxn_norm or rxn_norm in input_norm:
        score += 50

    # Token overlap
    input_tokens = set(input_norm.split())
    rxn_tokens = set(rxn_norm.split())
    overlap = len(input_tokens & rxn_tokens)
    score += overlap * 12

    # Category keyword
    if reaction.category and reaction.category.replace("-", " ") in input_norm:
        score += 20

    # Tag matching
    for tag in (reaction.tags or []):
        tag_norm = _normalize(tag)
        if any(t in input_norm for t in tag_norm.split()):
            score += 15

    # Species matching
    for sp in (reaction.input_species or []) + (reaction.output_species or []):
        sp_norm = _normalize(sp)
        if sp_norm and sp_norm in input_norm:
            score += 25

    return score


def _match_reaction(reaction_text: str, db: Session):
    from ..models.reaction import Reaction

    # Exact match first
    exact = db.query(Reaction).filter(Reaction.name == reaction_text).first()
    if exact:
        return exact

    all_reactions = db.query(Reaction).all()
    if not all_reactions:
        return None

    norm = _normalize(reaction_text)
    best_score = 0
    best_reaction = None

    for rxn in all_reactions:
        score = _reaction_score(norm, rxn)
        if score > best_score:
            best_score = score
            best_reaction = rxn

    return best_reaction if best_score >= 20 else None


# ──────────────────────────── catalyst scoring ───────────────────────────────

def _temp_overlap(cat, temp_c: float) -> float:
    if cat.temperature_min is None or cat.temperature_max is None:
        return 0.4  # partial credit when unknown
    if cat.temperature_min <= temp_c <= cat.temperature_max:
        return 1.0
    dist = min(abs(temp_c - cat.temperature_min), abs(temp_c - cat.temperature_max))
    if dist < 80:
        return 0.5
    return 0.0


def _pressure_overlap(cat, pressure_bar: float) -> float:
    if cat.pressure_min is None or cat.pressure_max is None:
        return 0.4
    if cat.pressure_min <= pressure_bar <= cat.pressure_max:
        return 1.0
    dist = min(abs(pressure_bar - cat.pressure_min), abs(pressure_bar - cat.pressure_max))
    if dist < 20:
        return 0.5
    return 0.0


def _score_catalyst(cat, run, compat_ids: set) -> float:
    # Compatibility score (0–40)
    compat = 40.0 if cat.id in compat_ids else 0.0

    # Operating condition overlap (0–30)
    cond = (_temp_overlap(cat, run.temperature_c) * 15
            + _pressure_overlap(cat, run.pressure_bar) * 15)

    # Performance baseline (0–30)
    perf = (cat.known_activity * 0.4
            + cat.known_selectivity * 0.35
            + cat.known_stability * 0.25) * 0.3

    return compat + cond + perf


# ──────────────────────────── main pipeline ──────────────────────────────────

def run_discovery_pipeline(run: DiscoveryRun, db: Session) -> None:
    run.started_at = datetime.now(timezone.utc)

    # ── Step 1: RETRIEVAL ─────────────────────────────────────────────────────
    run.status = "retrieval"
    db.commit()

    reaction_obj = _match_reaction(run.reaction_text, db)
    if reaction_obj:
        run.reaction_id = reaction_obj.id
        db.commit()

    compat_ids: set = set()
    if reaction_obj:
        compat_ids = {c.id for c in reaction_obj.compatible_catalysts}

    all_catalysts = db.query(Catalyst).all()
    scored = sorted(
        [((_score_catalyst(c, run, compat_ids)), c) for c in all_catalysts],
        key=lambda x: x[0],
        reverse=True,
    )

    # Top 8 become the "known" results shown in the UI
    known_catalysts = [c for _, c in scored[:8]]

    # ── Step 2: GENERATION ───────────────────────────────────────────────────
    run.status = "generation"
    db.commit()

    parent_pool = known_catalysts[:3] if len(known_catalysts) >= 3 else known_catalysts
    candidates = []

    for pos, parent in enumerate(parent_pool):
        mut = apply_mutation(parent, reaction_obj, run, pos)
        confidence = mut["confidence"]
        uncertainty = _pick_uncertainty(confidence)
        badge = _pick_badge(mut["predicted_activity"], mut["predicted_stability"])

        hint = None
        if uncertainty == "high":
            hint = "High uncertainty — high information gain if tested experimentally."
        elif uncertainty == "medium":
            hint = "Moderate epistemic uncertainty on stability branch."

        candidate = Candidate(
            discovery_run_id=run.id,
            name=mut["name"],
            description=mut["description"],
            composition=mut["composition"],
            predicted_activity=mut["predicted_activity"],
            predicted_selectivity=mut["predicted_selectivity"],
            predicted_stability=mut["predicted_stability"],
            confidence=confidence,
            uncertainty=uncertainty,
            badge=badge,
            active_learning_hint=hint,
            generative_model="chemistry-heuristic-v2",
        )
        candidates.append(candidate)

    # ── Step 3: PREDICTION ───────────────────────────────────────────────────
    run.status = "prediction"
    db.commit()

    # Pathway steps — use matched reaction template, perturbed by run seed
    seed = _hash_str(f"{run.reaction_text}|{run.mode}|{run.temperature_c}|{run.pressure_bar}")
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

    # Pareto points — use actual catalyst scores + element-cost data
    pareto_points = []
    for j, (score, cat) in enumerate(scored[:8]):
        yield_val = _clamp(cat.known_activity * 0.88 + (score % 5) * 0.5, 35, 95)
        cost_val = estimate_cost_index(cat.composition, cat.name)
        pareto_points.append({
            "id": cat.id,
            "name": cat.name,
            "yield": round(yield_val, 1),
            "cost": round(cost_val, 1),
            "stability": round(cat.known_stability, 1),
            "source": "known",
        })

    for j, c in enumerate(candidates):
        parent_score = scored[j][0] if j < len(scored) else 0
        yield_val = _clamp(c.predicted_activity * 0.90, 35, 95)
        cost_val = estimate_cost_index(c.composition, c.name)
        pareto_points.append({
            "id": f"ai-{j + 1}",
            "name": c.name,
            "yield": round(yield_val, 1),
            "cost": round(cost_val, 1),
            "stability": round(c.predicted_stability, 1),
            "source": "ai",
        })

    # ── Step 4: COMPLETE ─────────────────────────────────────────────────────
    db.add_all(candidates)
    run.pareto_points = pareto_points
    run.pathway_steps = pathway_steps
    run.status = "complete"
    run.completed_at = datetime.now(timezone.utc)
    db.commit()
