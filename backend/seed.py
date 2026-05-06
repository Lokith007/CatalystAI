"""Seed the database with initial catalysts, reactions, knowledge graph nodes, and a default project."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.catalyst import Catalyst
from app.models.reaction import Reaction
from app.models.knowledge_graph import KGNode, KGEdge
from app.services.auth import hash_password

db = SessionLocal()

# --- Default user ---
user = db.query(User).filter(User.email == "demo@catalystai.local").first()
if not user:
    user = User(id="default-user", email="demo@catalystai.local", password_hash=hash_password("demo1234"), full_name="Demo Researcher", org="CatalystAI Lab")
    db.add(user)
    db.commit()
    print("Created default user: demo@catalystai.local / demo1234")

# --- Default project ---
proj = db.query(Project).filter(Project.id == "default-project").first()
if not proj:
    proj = Project(id="default-project", user_id=user.id, name="Default Research Project", description="Auto-created default project", mode="catalysis")
    db.add(proj)
    db.commit()
    print("Created default project")

# --- Catalysts ---
if db.query(Catalyst).count() == 0:
    catalysts = [
        Catalyst(name="Cu-Zn/Al₂O₃ (HT)", entity_type="catalyst", known_activity=78, known_selectivity=71, known_stability=82, notes="Methanol synthesis; industrial baseline.", references=["DOI:10.1021/acscatal.2c01234"], temperature_min=200, temperature_max=350, pressure_min=10, pressure_max=50, source="literature"),
        Catalyst(name="MoS₂ edge sites", entity_type="catalyst", known_activity=65, known_selectivity=82, known_stability=74, notes="HDS analog; tunable edge density.", references=["DOI:10.1038/s41929-020-0445-x"], temperature_min=250, temperature_max=400, source="literature"),
        Catalyst(name="ADH7 (yeast)", entity_type="enzyme", known_activity=72, known_selectivity=88, known_stability=61, notes="Ethanol oxidation; cofactor dependent.", references=["DOI:10.1016/j.jbc.2023.104521"], temperature_min=25, temperature_max=45, source="literature"),
        Catalyst(name="MeOH → olefins (MTO)", entity_type="pathway", known_activity=81, known_selectivity=69, known_stability=77, notes="Zeolite-coupled carbene pool.", references=["DOI:10.1126/science.aaf7885"], temperature_min=350, temperature_max=500, source="literature"),
        Catalyst(name="Fe–N–C ORR", entity_type="catalyst", known_activity=70, known_selectivity=76, known_stability=68, notes="PGM-free oxygen reduction.", references=["DOI:10.1038/s41560-021-00826-x"], temperature_min=60, temperature_max=90, source="literature"),
        Catalyst(name="Pt/CeO₂ WGS", entity_type="catalyst", known_activity=85, known_selectivity=91, known_stability=79, notes="Water-gas shift; single-atom Pt on ceria.", references=["DOI:10.1021/jacs.1c09030"], temperature_min=150, temperature_max=300, source="literature"),
        Catalyst(name="Ru-pincer CO₂", entity_type="catalyst", known_activity=74, known_selectivity=86, known_stability=65, notes="Homogeneous CO₂ hydrogenation to formate.", references=["DOI:10.1002/anie.201907757"], temperature_min=80, temperature_max=120, source="literature"),
        Catalyst(name="P450-BM3 F87A", entity_type="enzyme", known_activity=68, known_selectivity=79, known_stability=55, notes="Engineered cytochrome for C-H activation.", references=["DOI:10.1038/nature14863"], temperature_min=25, temperature_max=37, source="experimental"),
    ]
    db.add_all(catalysts)
    db.commit()
    print(f"Seeded {len(catalysts)} catalysts")

# --- Reactions ---
if db.query(Reaction).count() == 0:
    reactions = [
        Reaction(name="Ethanol → Jet fuel (C8–C16)", category="biomass-upgrading", input_species=["C₂H₅OH"], output_species=["C₈-C₁₆ alkanes"], default_temp_c=320, default_pressure_bar=25, default_cost_weight=50, default_sustainability=78, tags=["green-chemistry", "jet-fuel"], difficulty="medium",
                 pathway_template=[{"label": "Precursor adsorption", "energy": 0}, {"label": "C–O scission TS", "energy": 48}, {"label": "Surface carbene", "energy": 22}, {"label": "Chain growth / coupling", "energy": -12}, {"label": "Product desorption", "energy": 15}]),
        Reaction(name="CO₂ → Methanol (direct)", category="carbon-capture", input_species=["CO₂", "H₂"], output_species=["CH₃OH"], default_temp_c=250, default_pressure_bar=50, default_cost_weight=60, default_sustainability=92, tags=["CO2-utilization", "green-hydrogen"], difficulty="hard",
                 pathway_template=[{"label": "CO₂ adsorption", "energy": 0}, {"label": "HCOO* formation", "energy": 35}, {"label": "H₂CO* intermediate", "energy": 18}, {"label": "CH₃O* reduction", "energy": -5}, {"label": "CH₃OH desorption", "energy": 8}]),
        Reaction(name="N₂ → NH₃ (electrochemical)", category="nitrogen-fixation", input_species=["N₂", "H₂O"], output_species=["NH₃"], default_temp_c=25, default_pressure_bar=1, default_cost_weight=70, default_sustainability=95, tags=["electrocatalysis", "green-ammonia"], difficulty="hard",
                 pathway_template=[{"label": "N₂ adsorption", "energy": 0}, {"label": "First protonation", "energy": 52}, {"label": "NNH₂ intermediate", "energy": 38}, {"label": "NH₂-NH₂ split", "energy": -15}, {"label": "NH₃ release", "energy": 5}]),
        Reaction(name="Glucose → Ethanol (fermentation)", category="biofuels", input_species=["C₆H₁₂O₆"], output_species=["C₂H₅OH", "CO₂"], default_temp_c=32, default_pressure_bar=1, default_cost_weight=30, default_sustainability=85, tags=["synbio", "fermentation"], difficulty="easy",
                 pathway_template=[{"label": "Glucose uptake", "energy": 0}, {"label": "Glycolysis", "energy": -20}, {"label": "Pyruvate decarboxylation", "energy": -8}, {"label": "Acetaldehyde reduction", "energy": -12}, {"label": "Ethanol export", "energy": 3}]),
        Reaction(name="Lignin → Aromatics", category="biomass-upgrading", input_species=["Lignin"], output_species=["BTX aromatics"], default_temp_c=400, default_pressure_bar=30, default_cost_weight=55, default_sustainability=70, tags=["depolymerization", "biorefinery"], difficulty="hard",
                 pathway_template=[{"label": "Lignin adsorption", "energy": 0}, {"label": "Ether bond cleavage", "energy": 55}, {"label": "Phenol intermediate", "energy": 30}, {"label": "HDO step", "energy": -10}, {"label": "Aromatic desorption", "energy": 8}]),
    ]
    db.add_all(reactions)
    db.commit()
    print(f"Seeded {len(reactions)} reactions")

# --- Knowledge Graph nodes & edges ---
if db.query(KGNode).count() == 0:
    nodes = [
        KGNode(id="kg-r1", label="Ethanol dehydration", node_type="reaction", pos_x=50, pos_y=18, properties={"temperature": "200–400°C", "publications": 1247}),
        KGNode(id="kg-c1", label="Zeolite Brønsted", node_type="catalyst", pos_x=22, pos_y=42, properties={"framework": "HZSM-5", "siAlRatio": 25}),
        KGNode(id="kg-c2", label="Metal oxide tandem", node_type="catalyst", pos_x=78, pos_y=40, properties={"type": "bifunctional"}),
        KGNode(id="kg-p1", label="Guerbet C–C", node_type="pathway", pos_x=35, pos_y=72, properties={"mechanism": "aldol condensation"}),
        KGNode(id="kg-p2", label="Hydrogen borrowing", node_type="pathway", pos_x=68, pos_y=74, properties={"mechanism": "transfer hydrogenation"}),
        KGNode(id="kg-c3", label="ADH / ALDH stack", node_type="catalyst", pos_x=50, pos_y=52, properties={"type": "enzyme cascade"}),
    ]
    edges = [
        KGEdge(source_id="kg-c1", target_id="kg-r1", relationship_type="catalyzes", weight=0.85),
        KGEdge(source_id="kg-c2", target_id="kg-r1", relationship_type="catalyzes", weight=0.78),
        KGEdge(source_id="kg-r1", target_id="kg-c3", relationship_type="produces_via", weight=0.72),
        KGEdge(source_id="kg-c3", target_id="kg-p1", relationship_type="enables", weight=0.68),
        KGEdge(source_id="kg-c3", target_id="kg-p2", relationship_type="enables", weight=0.65),
        KGEdge(source_id="kg-c1", target_id="kg-p1", relationship_type="co-catalyzes", weight=0.55),
        KGEdge(source_id="kg-c2", target_id="kg-p2", relationship_type="co-catalyzes", weight=0.60),
    ]
    db.add_all(nodes)
    db.commit()
    db.add_all(edges)
    db.commit()
    print(f"Seeded {len(nodes)} KG nodes and {len(edges)} KG edges")

db.close()
print("\nSeed complete!")
