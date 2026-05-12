"""Deterministic catalyst modification strategy library."""

import hashlib
import math

MODIFICATION_STRATEGIES = [
    {
        "type": "element_substitution",
        "label": "Elemental substitution",
        "activity_delta": (-5, 12),
        "selectivity_delta": (-3, 8),
        "stability_delta": (-8, 5),
        "name_suffixes": ["-In variant", "-Ga promoted", "-Ag modified", "-Ce doped"],
        "descriptions": [
            "In substitution improves CO₂ adsorption and boosts methanol selectivity via HCOO* stabilization",
            "Ga promotion enhances active site density and suppresses CO byproduct formation",
            "Ag incorporation improves oxidation resistance while maintaining high turnover",
            "Ce doping creates oxygen vacancies enhancing substrate activation and stability",
        ],
    },
    {
        "type": "promoter_addition",
        "label": "Promoter addition",
        "activity_delta": (3, 8),
        "selectivity_delta": (-2, 6),
        "stability_delta": (5, 10),
        "name_suffixes": ["-K promoted", "-Cs promoted", "+La₂O₃", "+CeO₂"],
        "descriptions": [
            "K promoter suppresses competing side reactions by tuning surface basicity",
            "Cs promoter modifies surface acid-base balance for improved product selectivity",
            "La₂O₃ addition enhances thermal stability via structural promotion and sintering resistance",
            "CeO₂ promoter acts as oxygen reservoir improving redox cycling and turnover frequency",
        ],
    },
    {
        "type": "support_change",
        "label": "Support modification",
        "activity_delta": (-3, 10),
        "selectivity_delta": (2, 12),
        "stability_delta": (-5, 15),
        "name_suffixes": ["/ZrO₂", "/CeO₂-ZrO₂", "/TiO₂", "/mesoporous SiO₂"],
        "descriptions": [
            "ZrO₂ support provides strong metal-support interaction (SMSI) enhancing long-term stability",
            "Mixed CeO₂-ZrO₂ support provides redox sites and improved metal dispersion",
            "TiO₂ support enables strong metal-support interaction leading to unique bifunctional sites",
            "Mesoporous SiO₂ increases accessible surface area and improves reactant mass transfer",
        ],
    },
    {
        "type": "morphology_change",
        "label": "Nanostructure optimization",
        "activity_delta": (5, 15),
        "selectivity_delta": (-2, 5),
        "stability_delta": (-8, 3),
        "name_suffixes": ["(single-atom)", "(core-shell)", "(hierarchical porous)", "(nanorod array)"],
        "descriptions": [
            "Single-atom dispersion maximizes atom utilization and exposes uniform active sites",
            "Core-shell architecture separates catalytic metal from support for optimal interface",
            "Hierarchical porosity improves reactant diffusion and reduces product inhibition",
            "Nanorod morphology exposes high-index facets with elevated step-site density",
        ],
    },
    {
        "type": "bimetallic_alloy",
        "label": "Bimetallic alloying",
        "activity_delta": (2, 14),
        "selectivity_delta": (3, 10),
        "stability_delta": (-3, 8),
        "name_suffixes": ["-Fe alloy", "-Co alloy", "-Mn alloy", "-Zn alloy"],
        "descriptions": [
            "Fe alloying shifts d-band center toward optimal binding energy for substrate activation",
            "Co alloying creates synergistic dual-metal sites enabling tandem reaction pathways",
            "Mn alloying improves oxygen storage capacity facilitating redox-mediated cycles",
            "Zn alloying tunes electronic structure suppressing over-reduction side products",
        ],
    },
]


def _pseudo_float(seed: int, offset: int, lo: float, hi: float) -> float:
    x = math.sin(seed * 9999 + offset * 777) * 10000
    t = x - math.floor(x)
    return lo + t * (hi - lo)


def _hash_seed(reaction_id: str, catalyst_id: str, position: int) -> int:
    key = f"{reaction_id}|{catalyst_id}|{position}"
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (10 ** 9)


def _clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def apply_mutation(parent_catalyst, reaction_obj, run, position: int) -> dict:
    """Generate a deterministic mutated candidate from parent catalyst.

    Same (reaction, catalyst, position) triple always produces the same output.
    """
    rid = reaction_obj.id if reaction_obj else "generic"
    seed = _hash_seed(rid, parent_catalyst.id, position)

    strategy_idx = seed % len(MODIFICATION_STRATEGIES)
    strategy = MODIFICATION_STRATEGIES[strategy_idx]

    options_count = len(strategy["name_suffixes"])
    option_idx = (seed // len(MODIFICATION_STRATEGIES)) % options_count

    name = f"{parent_catalyst.name} {strategy['name_suffixes'][option_idx]}"
    description = strategy["descriptions"][option_idx]

    act_lo, act_hi = strategy["activity_delta"]
    sel_lo, sel_hi = strategy["selectivity_delta"]
    stab_lo, stab_hi = strategy["stability_delta"]

    act_delta = _pseudo_float(seed, 1, act_lo, act_hi)
    sel_delta = _pseudo_float(seed, 2, sel_lo, sel_hi)
    stab_delta = _pseudo_float(seed, 3, stab_lo, stab_hi)

    # User constraint influence
    if run.temperature_c > 400:
        stab_delta -= 3
    if run.pressure_bar > 50:
        sel_delta -= 2
    sus_bonus = (run.sustainability - 50) / 100 * 3
    if run.cost_weight > 70:
        act_delta -= 4

    pred_activity = _clamp(parent_catalyst.known_activity + act_delta + sus_bonus, 35, 98)
    pred_selectivity = _clamp(parent_catalyst.known_selectivity + sel_delta, 35, 98)
    pred_stability = _clamp(parent_catalyst.known_stability + stab_delta, 35, 98)

    conservatism = {
        "promoter_addition": 0.92,
        "support_change": 0.87,
        "element_substitution": 0.78,
        "morphology_change": 0.82,
        "bimetallic_alloy": 0.75,
    }.get(strategy["type"], 0.80)

    base_conf = 0.6 * parent_catalyst.known_activity + 0.4 * parent_catalyst.known_stability
    confidence = _clamp(base_conf * conservatism + _pseudo_float(seed, 5, 0, 8), 45, 92)

    composition = dict(parent_catalyst.composition) if parent_catalyst.composition else None

    return {
        "name": name,
        "description": description,
        "composition": composition,
        "predicted_activity": round(pred_activity, 1),
        "predicted_selectivity": round(pred_selectivity, 1),
        "predicted_stability": round(pred_stability, 1),
        "confidence": round(confidence, 1),
    }
