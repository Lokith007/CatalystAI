"""Element cost index for Pareto cost estimation."""

ELEMENT_COST_INDEX: dict[str, float] = {
    "Fe": 5, "Ni": 12, "Cu": 15, "Zn": 10, "Al": 8, "Si": 3,
    "Co": 35, "Mn": 11, "Cr": 14, "Mo": 28, "W": 32,
    "Ag": 55, "Pd": 88, "Pt": 95, "Ru": 82, "Rh": 92, "Ir": 94, "Au": 90,
    "Ti": 18, "Ce": 25, "Zr": 22, "La": 30, "In": 45, "Ga": 40,
    "K": 6, "Na": 4, "Ca": 5, "Mg": 7, "Ba": 15, "Cs": 50,
    "C": 2, "N": 3, "O": 1, "S": 4,
}

_EXPENSIVE = ["Pt", "Pd", "Ru", "Rh", "Ir", "Au", "Ag"]


def estimate_cost_index(composition: dict | None, name: str) -> float:
    """Return a 0–100 cost index based on element composition or name heuristic."""
    if composition:
        total = sum(ELEMENT_COST_INDEX.get(el, 30) * amt for el, amt in composition.items())
        count = sum(composition.values())
        return min(95, total / max(count, 1))
    for el in _EXPENSIVE:
        if el in name:
            return ELEMENT_COST_INDEX[el]
    return 30
