"""Seed the database with catalysts, reactions, compat mappings, knowledge graph, and a default project."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.project import Project
from app.models.catalyst import Catalyst
from app.models.reaction import Reaction
from app.models.knowledge_graph import KGNode, KGEdge
from app.services.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# --- Default user ---
user = db.query(User).filter(User.email == "demo@catalystai.local").first()
if not user:
    user = User(
        id="default-user",
        email="demo@catalystai.local",
        password_hash=hash_password("demo1234"),
        full_name="Demo Researcher",
        org="CatalystAI Lab",
    )
    db.add(user)
    db.commit()
    print("Created default user: demo@catalystai.local / demo1234")

# --- Default project ---
proj = db.query(Project).filter(Project.id == "default-project").first()
if not proj:
    proj = Project(
        id="default-project",
        user_id=user.id,
        name="Default Research Project",
        description="Auto-created default project",
        mode="catalysis",
    )
    db.add(proj)
    db.commit()
    print("Created default project")

# --- Catalysts ---
if db.query(Catalyst).count() == 0:
    catalysts_data = [
        # ── Existing 8 (kept) ────────────────────────────────────────────────
        dict(name="Cu-Zn/Al₂O₃ (HT)", entity_type="catalyst",
             known_activity=78, known_selectivity=71, known_stability=82,
             temperature_min=200, temperature_max=350, pressure_min=10, pressure_max=50,
             composition={"Cu": 1, "Zn": 1, "Al": 2, "O": 4},
             notes="Methanol synthesis; industrial baseline.",
             references=["DOI:10.1021/acscatal.2c01234"], source="literature"),
        dict(name="MoS₂ edge sites", entity_type="catalyst",
             known_activity=65, known_selectivity=82, known_stability=74,
             temperature_min=250, temperature_max=400,
             composition={"Mo": 1, "S": 2},
             notes="HDS analog; tunable edge density.",
             references=["DOI:10.1038/s41929-020-0445-x"], source="literature"),
        dict(name="ADH7 (yeast)", entity_type="enzyme",
             known_activity=72, known_selectivity=88, known_stability=61,
             temperature_min=25, temperature_max=45,
             composition={"Zn": 2, "N": 4, "C": 8, "O": 2},
             notes="Ethanol oxidation; cofactor dependent.",
             references=["DOI:10.1016/j.jbc.2023.104521"], source="literature"),
        dict(name="MeOH → olefins (MTO)", entity_type="pathway",
             known_activity=81, known_selectivity=69, known_stability=77,
             temperature_min=350, temperature_max=500,
             composition={"Si": 25, "Al": 1, "O": 52},
             notes="Zeolite-coupled carbene pool; HZSM-5 based.",
             references=["DOI:10.1126/science.aaf7885"], source="literature"),
        dict(name="Fe–N–C ORR", entity_type="catalyst",
             known_activity=70, known_selectivity=76, known_stability=68,
             temperature_min=60, temperature_max=90,
             composition={"Fe": 1, "N": 4, "C": 6},
             notes="PGM-free oxygen reduction; also active for electrochemical N₂ reduction.",
             references=["DOI:10.1038/s41560-021-00826-x"], source="literature"),
        dict(name="Pt/CeO₂ WGS", entity_type="catalyst",
             known_activity=85, known_selectivity=91, known_stability=79,
             temperature_min=150, temperature_max=300,
             composition={"Pt": 1, "Ce": 2, "O": 4},
             notes="Water-gas shift; single-atom Pt on ceria.",
             references=["DOI:10.1021/jacs.1c09030"], source="literature"),
        dict(name="Ru-pincer CO₂", entity_type="catalyst",
             known_activity=74, known_selectivity=86, known_stability=65,
             temperature_min=80, temperature_max=120,
             composition={"Ru": 1, "N": 2, "C": 4},
             notes="Homogeneous CO₂ hydrogenation to formate.",
             references=["DOI:10.1002/anie.201907757"], source="literature"),
        dict(name="P450-BM3 F87A", entity_type="enzyme",
             known_activity=68, known_selectivity=79, known_stability=55,
             temperature_min=25, temperature_max=37,
             composition={"Fe": 1, "N": 4, "C": 8, "O": 1},
             notes="Engineered cytochrome for C-H activation.",
             references=["DOI:10.1038/nature14863"], source="experimental"),

        # ── CO₂ Utilization ──────────────────────────────────────────────────
        dict(name="Cu/ZnO/Al₂O₃", entity_type="catalyst",
             known_activity=82, known_selectivity=74, known_stability=85,
             temperature_min=220, temperature_max=280, pressure_min=50, pressure_max=80,
             composition={"Cu": 2, "Zn": 1, "Al": 2, "O": 5},
             notes="Industrial methanol synthesis catalyst; Cu/ZnO/Al₂O₃ ternary.",
             references=["DOI:10.1021/acscatal.9b01846"], source="literature"),
        dict(name="In₂O₃/ZrO₂", entity_type="catalyst",
             known_activity=71, known_selectivity=88, known_stability=76,
             temperature_min=250, temperature_max=300,
             composition={"In": 2, "Zr": 1, "O": 5},
             notes="Indium oxide on zirconia; high methanol selectivity from CO₂.",
             references=["DOI:10.1126/science.aap8074"], source="literature"),
        dict(name="Cu-Zn-Ga/SiO₂", entity_type="catalyst",
             known_activity=76, known_selectivity=80, known_stability=72,
             temperature_min=240, temperature_max=300,
             composition={"Cu": 2, "Zn": 1, "Ga": 1, "Si": 1, "O": 5},
             notes="Gallium-promoted Cu-Zn on silica; improved selectivity via Ga–Cu synergy.",
             references=["DOI:10.1016/j.jcat.2021.02.015"], source="literature"),
        dict(name="Pd/ZnO", entity_type="catalyst",
             known_activity=68, known_selectivity=92, known_stability=58,
             temperature_min=230, temperature_max=280,
             composition={"Pd": 1, "Zn": 1, "O": 1},
             notes="Palladium on zinc oxide; highest methanol selectivity but lower stability.",
             references=["DOI:10.1039/C8CS00033F"], source="literature"),
        dict(name="Cu-Ce/γ-Al₂O₃", entity_type="catalyst",
             known_activity=73, known_selectivity=78, known_stability=78,
             temperature_min=220, temperature_max=300,
             composition={"Cu": 2, "Ce": 1, "Al": 3, "O": 6},
             notes="Ceria-promoted copper on alumina; improved stability via CeO₂ redox buffer.",
             references=["DOI:10.1016/j.apcata.2020.117686"], source="literature"),

        # ── Nitrogen Fixation ─────────────────────────────────────────────────
        dict(name="Fe₃O₄-K₂O-Al₂O₃", entity_type="catalyst",
             known_activity=88, known_selectivity=65, known_stability=90,
             temperature_min=400, temperature_max=500, pressure_min=150, pressure_max=300,
             composition={"Fe": 3, "K": 2, "Al": 1, "O": 7},
             notes="Classical Haber-Bosch promoted iron catalyst; industrial workhorse.",
             references=["DOI:10.1039/C5CS00799D"], source="literature"),
        dict(name="Ru/MgO", entity_type="catalyst",
             known_activity=92, known_selectivity=78, known_stability=80,
             temperature_min=350, temperature_max=450, pressure_min=50, pressure_max=100,
             composition={"Ru": 1, "Mg": 1, "O": 1},
             notes="Ruthenium on magnesium oxide; active at milder conditions than Fe.",
             references=["DOI:10.1021/acscatal.8b02585"], source="literature"),
        dict(name="Co₃Mo₃N", entity_type="catalyst",
             known_activity=74, known_selectivity=71, known_stability=82,
             temperature_min=350, temperature_max=500, pressure_min=10, pressure_max=50,
             composition={"Co": 3, "Mo": 3, "N": 1},
             notes="Cobalt molybdenum nitride; earth-abundant alternative to Ru.",
             references=["DOI:10.1038/s41563-019-0420-2"], source="literature"),
        dict(name="Li-Fe electrocatalyst", entity_type="catalyst",
             known_activity=45, known_selectivity=52, known_stability=60,
             temperature_min=20, temperature_max=30, pressure_min=1, pressure_max=1,
             composition={"Li": 1, "Fe": 1, "N": 1},
             notes="Electrochemical N₂ reduction at ambient conditions; low Faradaic efficiency.",
             references=["DOI:10.1126/science.aau8760"], source="experimental"),
        dict(name="Au/CeO₂-RuO₂", entity_type="catalyst",
             known_activity=58, known_selectivity=61, known_stability=65,
             temperature_min=20, temperature_max=30, pressure_min=1, pressure_max=1,
             composition={"Au": 1, "Ce": 1, "Ru": 1, "O": 4},
             notes="Bifunctional gold catalyst for electrochemical N₂ fixation.",
             references=["DOI:10.1016/j.joule.2020.04.021"], source="literature"),

        # ── Biomass Upgrading ─────────────────────────────────────────────────
        dict(name="Ni/γ-Al₂O₃", entity_type="catalyst",
             known_activity=76, known_selectivity=68, known_stability=74,
             temperature_min=300, temperature_max=500, pressure_min=10, pressure_max=40,
             composition={"Ni": 1, "Al": 2, "O": 3},
             notes="Nickel on alumina; ethanol dehydration and biomass HDO.",
             references=["DOI:10.1016/j.apcata.2019.117327"], source="literature"),
        dict(name="HZSM-5 (Si/Al=25)", entity_type="catalyst",
             known_activity=84, known_selectivity=72, known_stability=80,
             temperature_min=300, temperature_max=500,
             composition={"Si": 25, "Al": 1, "O": 52},
             notes="Protonated ZSM-5 zeolite; high acidity for biomass cracking and MTO.",
             references=["DOI:10.1021/acscatal.1c03696"], source="literature"),
        dict(name="Pt-Sn/Al₂O₃", entity_type="catalyst",
             known_activity=79, known_selectivity=85, known_stability=71,
             temperature_min=350, temperature_max=550,
             composition={"Pt": 1, "Sn": 1, "Al": 2, "O": 3},
             notes="Platinum-tin for dehydrogenation; Sn prevents coking on Pt.",
             references=["DOI:10.1021/cr960078f"], source="literature"),
        dict(name="CoMo/Al₂O₃ sulfided", entity_type="catalyst",
             known_activity=72, known_selectivity=66, known_stability=77,
             temperature_min=300, temperature_max=450, pressure_min=30, pressure_max=80,
             composition={"Co": 1, "Mo": 1, "Al": 2, "S": 2, "O": 3},
             notes="Sulfided CoMo for hydrodeoxygenation (HDO) of bio-oil.",
             references=["DOI:10.1039/C9CY01723B"], source="literature"),
        dict(name="Ru/C", entity_type="catalyst",
             known_activity=81, known_selectivity=74, known_stability=69,
             temperature_min=200, temperature_max=350, pressure_min=10, pressure_max=80,
             composition={"Ru": 1, "C": 6},
             notes="Ruthenium on activated carbon; hydrogenolysis and cellulose valorization.",
             references=["DOI:10.1016/j.greenenergy.2021.04.002"], source="literature"),

        # ── Fischer-Tropsch ───────────────────────────────────────────────────
        dict(name="Fe/SiO₂", entity_type="catalyst",
             known_activity=78, known_selectivity=62, known_stability=72,
             temperature_min=220, temperature_max=340, pressure_min=10, pressure_max=40,
             composition={"Fe": 1, "Si": 1, "O": 2},
             notes="Iron-based Fischer-Tropsch; cost-effective, wide product distribution.",
             references=["DOI:10.1002/anie.201901998"], source="literature"),
        dict(name="Co/Al₂O₃", entity_type="catalyst",
             known_activity=85, known_selectivity=76, known_stability=80,
             temperature_min=200, temperature_max=240, pressure_min=20, pressure_max=30,
             composition={"Co": 1, "Al": 2, "O": 3},
             notes="Cobalt-based FT; high C5+ selectivity for liquid fuels.",
             references=["DOI:10.1021/acs.chemrev.7b00616"], source="literature"),
        dict(name="Fe-Cu-K/SiO₂", entity_type="catalyst",
             known_activity=80, known_selectivity=70, known_stability=68,
             temperature_min=250, temperature_max=350, pressure_min=10, pressure_max=40,
             composition={"Fe": 3, "Cu": 1, "K": 1, "Si": 1, "O": 5},
             notes="Promoted iron FT catalyst; Cu improves reduction, K promotes chain growth.",
             references=["DOI:10.1016/j.jcat.2014.11.015"], source="literature"),
        dict(name="Ru/TiO₂", entity_type="catalyst",
             known_activity=90, known_selectivity=82, known_stability=75,
             temperature_min=200, temperature_max=300, pressure_min=10, pressure_max=30,
             composition={"Ru": 1, "Ti": 1, "O": 2},
             notes="Ruthenium on titania; highest FT activity but expensive precious metal.",
             references=["DOI:10.1016/j.cattod.2012.09.011"], source="literature"),

        # ── Water-Gas Shift ───────────────────────────────────────────────────
        dict(name="Fe₂O₃-Cr₂O₃ (HT-WGS)", entity_type="catalyst",
             known_activity=82, known_selectivity=85, known_stability=88,
             temperature_min=350, temperature_max=450, pressure_min=1, pressure_max=30,
             composition={"Fe": 2, "Cr": 2, "O": 6},
             notes="High-temperature WGS catalyst; Cr stabilizes iron oxide phase.",
             references=["DOI:10.1039/C4CS00062E"], source="literature"),
        dict(name="Cu-ZnO-Al₂O₃ (LT-WGS)", entity_type="catalyst",
             known_activity=79, known_selectivity=88, known_stability=74,
             temperature_min=150, temperature_max=250, pressure_min=1, pressure_max=30,
             composition={"Cu": 2, "Zn": 1, "Al": 1, "O": 4},
             notes="Low-temperature WGS catalyst; high selectivity but sensitive to sulfur.",
             references=["DOI:10.1016/j.ijhydene.2016.09.127"], source="literature"),
        dict(name="Au/Fe₂O₃", entity_type="catalyst",
             known_activity=71, known_selectivity=84, known_stability=62,
             temperature_min=100, temperature_max=250,
             composition={"Au": 1, "Fe": 2, "O": 3},
             notes="Gold on iron oxide; active at low temperature for WGS.",
             references=["DOI:10.1126/science.1107081"], source="literature"),

        # ── Epoxidation ───────────────────────────────────────────────────────
        dict(name="Ag/α-Al₂O₃ + Cs", entity_type="catalyst",
             known_activity=82, known_selectivity=89, known_stability=83,
             temperature_min=220, temperature_max=280, pressure_min=10, pressure_max=25,
             composition={"Ag": 1, "Al": 2, "Cs": 1, "O": 4},
             notes="Cs-promoted silver on alpha-alumina; industrial ethylene epoxidation.",
             references=["DOI:10.1016/j.jcat.2007.01.006"], source="literature"),
        dict(name="Ti-silicalite TS-1", entity_type="catalyst",
             known_activity=75, known_selectivity=94, known_stability=80,
             temperature_min=40, temperature_max=90,
             composition={"Ti": 1, "Si": 95, "O": 100},
             notes="Titanium silicalite; propylene epoxidation with H₂O₂; very high selectivity.",
             references=["DOI:10.1021/cr960078f"], source="literature"),
        dict(name="Mn-salen complex", entity_type="catalyst",
             known_activity=55, known_selectivity=96, known_stability=48,
             temperature_min=0, temperature_max=25,
             composition={"Mn": 1, "N": 2, "C": 8, "O": 2},
             notes="Jacobsen-Katsuki catalyst; asymmetric epoxidation with >96% ee.",
             references=["DOI:10.1021/ja00085a045"], source="literature"),

        # ── Cross-Coupling ────────────────────────────────────────────────────
        dict(name="Pd(PPh₃)₄", entity_type="catalyst",
             known_activity=88, known_selectivity=92, known_stability=60,
             temperature_min=60, temperature_max=100, pressure_min=1, pressure_max=1,
             composition={"Pd": 1, "P": 4, "C": 72, "H": 60},
             notes="Tetrakis(triphenylphosphine)palladium; homogeneous Suzuki coupling benchmark.",
             references=["DOI:10.1021/acscatal.8b04544"], source="literature"),
        dict(name="Pd/C + SPhos", entity_type="catalyst",
             known_activity=82, known_selectivity=87, known_stability=75,
             temperature_min=60, temperature_max=110, pressure_min=1, pressure_max=1,
             composition={"Pd": 1, "C": 10, "P": 1},
             notes="Heterogeneous Pd on carbon with SPhos ligand; recyclable Suzuki catalyst.",
             references=["DOI:10.1021/op8002002"], source="literature"),
        dict(name="NiCl₂(dppf)", entity_type="catalyst",
             known_activity=65, known_selectivity=74, known_stability=70,
             temperature_min=60, temperature_max=120, pressure_min=1, pressure_max=1,
             composition={"Ni": 1, "Cl": 2, "Fe": 1, "P": 2, "C": 34},
             notes="Nickel-dppf complex; cheaper Pd alternative for C-C coupling.",
             references=["DOI:10.1039/C1CS15188E"], source="literature"),

        # ── Enzymatic / Synbio ────────────────────────────────────────────────
        dict(name="PETase-MHETase fusion", entity_type="enzyme",
             known_activity=76, known_selectivity=95, known_stability=65,
             temperature_min=50, temperature_max=70,
             composition={"Fe": 0, "N": 4, "C": 8, "O": 2},
             notes="Bifunctional PET depolymerization enzyme; FAST-PETase architecture.",
             references=["DOI:10.1038/s41586-022-04518-2"], source="experimental"),
        dict(name="LCC-ICCG variant", entity_type="enzyme",
             known_activity=82, known_selectivity=91, known_stability=78,
             temperature_min=65, temperature_max=72,
             composition={"Ca": 1, "N": 4, "C": 8, "O": 2},
             notes="Engineered leaf-branch compost cutinase; industrial PET degradation.",
             references=["DOI:10.1038/s41586-020-2149-4"], source="experimental"),
        dict(name="Laccase T1 Cu mutant", entity_type="enzyme",
             known_activity=58, known_selectivity=62, known_stability=70,
             temperature_min=40, temperature_max=65,
             composition={"Cu": 4, "N": 4, "C": 6, "O": 2},
             notes="Type-1 copper laccase mutant for lignin oxidative depolymerization.",
             references=["DOI:10.1039/C7GC01521K"], source="experimental"),
        dict(name="Directed evolution P450-BM3", entity_type="enzyme",
             known_activity=72, known_selectivity=83, known_stability=58,
             temperature_min=25, temperature_max=40,
             composition={"Fe": 1, "N": 4, "C": 10, "O": 2},
             notes="Library of P450-BM3 variants for C-H hydroxylation and fermentation support.",
             references=["DOI:10.1126/science.1133755"], source="experimental"),

        # ── Methanation (Sabatier) ────────────────────────────────────────────
        dict(name="Ni/Al₂O₃", entity_type="catalyst",
             known_activity=84, known_selectivity=92, known_stability=78,
             temperature_min=300, temperature_max=400, pressure_min=1, pressure_max=10,
             composition={"Ni": 1, "Al": 2, "O": 3},
             notes="Classic Sabatier catalyst; Ni/Al₂O₃ for CO₂ methanation.",
             references=["DOI:10.1016/j.rser.2016.12.071"], source="literature"),
        dict(name="Ru/Al₂O₃", entity_type="catalyst",
             known_activity=91, known_selectivity=95, known_stability=82,
             temperature_min=250, temperature_max=400, pressure_min=1, pressure_max=10,
             composition={"Ru": 1, "Al": 2, "O": 3},
             notes="Ruthenium on alumina; highest Sabatier activity but costly.",
             references=["DOI:10.1002/cctc.201200466"], source="literature"),
        dict(name="Ni-Fe/MgAl₂O₄ spinel", entity_type="catalyst",
             known_activity=80, known_selectivity=88, known_stability=85,
             temperature_min=300, temperature_max=450, pressure_min=1, pressure_max=10,
             composition={"Ni": 1, "Fe": 1, "Mg": 1, "Al": 2, "O": 4},
             notes="Bimetallic Ni-Fe on spinel support; improved coke resistance.",
             references=["DOI:10.1016/j.apcata.2018.09.018"], source="literature"),

        # ── Steam Methane Reforming ───────────────────────────────────────────
        dict(name="Ni/MgAl₂O₄", entity_type="catalyst",
             known_activity=86, known_selectivity=80, known_stability=84,
             temperature_min=700, temperature_max=900, pressure_min=15, pressure_max=30,
             composition={"Ni": 1, "Mg": 1, "Al": 2, "O": 4},
             notes="Ni on spinel for steam methane reforming; suppresses coking.",
             references=["DOI:10.1016/j.apcata.2012.02.038"], source="literature"),
        dict(name="Rh/CeZrO₂", entity_type="catalyst",
             known_activity=92, known_selectivity=84, known_stability=80,
             temperature_min=600, temperature_max=850,
             composition={"Rh": 1, "Ce": 1, "Zr": 1, "O": 4},
             notes="Rhodium on ceria-zirconia; very high SMR activity, expensive.",
             references=["DOI:10.1021/acscatal.7b03251"], source="literature"),
        dict(name="K-promoted Ni/Al₂O₃", entity_type="catalyst",
             known_activity=82, known_selectivity=79, known_stability=88,
             temperature_min=700, temperature_max=900, pressure_min=15, pressure_max=30,
             composition={"Ni": 1, "K": 1, "Al": 2, "O": 3},
             notes="Potassium-promoted Ni/Al₂O₃; K neutralizes acid sites preventing coking.",
             references=["DOI:10.1016/j.apcatb.2019.117822"], source="literature"),

        # ── DAC / Amine Sorbents ──────────────────────────────────────────────
        dict(name="PEI/mesoporous silica", entity_type="catalyst",
             known_activity=68, known_selectivity=82, known_stability=72,
             temperature_min=80, temperature_max=120,
             composition={"Si": 1, "N": 2, "C": 4, "O": 2},
             notes="Polyethylenimine on mesoporous silica for direct air capture CO₂ release.",
             references=["DOI:10.1021/acssuschemeng.1c06605"], source="literature"),
        dict(name="Aqueous K₂CO₃ solvent", entity_type="catalyst",
             known_activity=74, known_selectivity=78, known_stability=85,
             temperature_min=100, temperature_max=130,
             composition={"K": 2, "C": 1, "O": 3},
             notes="Potassium carbonate solvent for post-combustion CO₂ capture and release.",
             references=["DOI:10.1016/j.ijggc.2011.03.020"], source="literature"),
        dict(name="MOF-808-ethylenediamine", entity_type="catalyst",
             known_activity=70, known_selectivity=85, known_stability=68,
             temperature_min=80, temperature_max=110,
             composition={"Zr": 6, "N": 2, "C": 4, "O": 8},
             notes="Zr-MOF functionalized with ethylenediamine for selective CO₂ adsorption.",
             references=["DOI:10.1021/jacs.5b09172"], source="literature"),

        # ── Toluene Disproportionation ────────────────────────────────────────
        dict(name="H-mordenite (Si/Al=10)", entity_type="catalyst",
             known_activity=78, known_selectivity=76, known_stability=80,
             temperature_min=350, temperature_max=450, pressure_min=15, pressure_max=30,
             composition={"Si": 10, "Al": 1, "O": 22},
             notes="H-form mordenite zeolite; toluene disproportionation via methyl transfer.",
             references=["DOI:10.1039/C3CS60321H"], source="literature"),
        dict(name="HZSM-5 (Si/Al=40)", entity_type="catalyst",
             known_activity=72, known_selectivity=84, known_stability=82,
             temperature_min=350, temperature_max=500, pressure_min=10, pressure_max=25,
             composition={"Si": 40, "Al": 1, "O": 82},
             notes="High-silica ZSM-5; lower acidity gives better para-xylene selectivity.",
             references=["DOI:10.1021/acscatal.7b03397"], source="literature"),
        dict(name="MCM-22 zeolite", entity_type="catalyst",
             known_activity=75, known_selectivity=80, known_stability=78,
             temperature_min=350, temperature_max=450, pressure_min=10, pressure_max=25,
             composition={"Si": 25, "Al": 1, "O": 52},
             notes="MCM-22 layered zeolite; unique pore architecture for shape-selective aromatics.",
             references=["DOI:10.1016/S0167-2991(97)80085-1"], source="literature"),
    ]

    catalysts = [Catalyst(**d) for d in catalysts_data]
    db.add_all(catalysts)
    db.commit()
    print(f"Seeded {len(catalysts)} catalysts")

# --- Reactions ---
if db.query(Reaction).count() == 0:
    reactions = [
        Reaction(
            name="Ethanol → Jet fuel (C8–C16)", category="biomass-upgrading",
            input_species=["C₂H₅OH"], output_species=["C₈-C₁₆ alkanes"],
            default_temp_c=320, default_pressure_bar=25, default_cost_weight=50, default_sustainability=78,
            tags=["green-chemistry", "jet-fuel"], difficulty="medium",
            pathway_template=[
                {"label": "Precursor adsorption", "energy": 0},
                {"label": "C–O scission TS", "energy": 48},
                {"label": "Surface carbene", "energy": 22},
                {"label": "Chain growth / coupling", "energy": -12},
                {"label": "Product desorption", "energy": 15},
            ],
        ),
        Reaction(
            name="CO₂ → Methanol (direct)", category="carbon-capture",
            input_species=["CO₂", "H₂"], output_species=["CH₃OH"],
            default_temp_c=250, default_pressure_bar=50, default_cost_weight=60, default_sustainability=92,
            tags=["CO2-utilization", "green-hydrogen"], difficulty="hard",
            pathway_template=[
                {"label": "CO₂ adsorption", "energy": 0},
                {"label": "HCOO* formation", "energy": 35},
                {"label": "H₂CO* intermediate", "energy": 18},
                {"label": "CH₃O* reduction", "energy": -5},
                {"label": "CH₃OH desorption", "energy": 8},
            ],
        ),
        Reaction(
            name="N₂ → NH₃ (electrochemical)", category="nitrogen-fixation",
            input_species=["N₂", "H₂O"], output_species=["NH₃"],
            default_temp_c=25, default_pressure_bar=1, default_cost_weight=70, default_sustainability=95,
            tags=["electrocatalysis", "green-ammonia"], difficulty="hard",
            pathway_template=[
                {"label": "N₂ adsorption", "energy": 0},
                {"label": "First protonation", "energy": 52},
                {"label": "NNH₂ intermediate", "energy": 38},
                {"label": "NH₂-NH₂ split", "energy": -15},
                {"label": "NH₃ release", "energy": 5},
            ],
        ),
        Reaction(
            name="Glucose → Ethanol (fermentation)", category="biofuels",
            input_species=["C₆H₁₂O₆"], output_species=["C₂H₅OH", "CO₂"],
            default_temp_c=32, default_pressure_bar=1, default_cost_weight=30, default_sustainability=85,
            tags=["synbio", "fermentation"], difficulty="easy",
            pathway_template=[
                {"label": "Glucose uptake", "energy": 0},
                {"label": "Glycolysis", "energy": -20},
                {"label": "Pyruvate decarboxylation", "energy": -8},
                {"label": "Acetaldehyde reduction", "energy": -12},
                {"label": "Ethanol export", "energy": 3},
            ],
        ),
        Reaction(
            name="Lignin → Aromatics", category="biomass-upgrading",
            input_species=["Lignin"], output_species=["BTX aromatics"],
            default_temp_c=400, default_pressure_bar=30, default_cost_weight=55, default_sustainability=70,
            tags=["depolymerization", "biorefinery"], difficulty="hard",
            pathway_template=[
                {"label": "Lignin adsorption", "energy": 0},
                {"label": "Ether bond cleavage", "energy": 55},
                {"label": "Phenol intermediate", "energy": 30},
                {"label": "HDO step", "energy": -10},
                {"label": "Aromatic desorption", "energy": 8},
            ],
        ),
        Reaction(
            name="Haber-Bosch (Thermochemical)", category="nitrogen-fixation",
            input_species=["N₂", "H₂"], output_species=["NH₃"],
            default_temp_c=450, default_pressure_bar=200, default_cost_weight=80, default_sustainability=40,
            tags=["industrial", "ammonia", "high-pressure"], difficulty="hard",
            pathway_template=[
                {"label": "N₂ dissociation", "energy": 110},
                {"label": "N* protonation", "energy": 45},
                {"label": "NH* formation", "energy": 15},
                {"label": "NH₂* formation", "energy": -10},
                {"label": "NH₃ desorption", "energy": 25},
            ],
        ),
        Reaction(
            name="Fischer-Tropsch Synthesis", category="petrochemistry",
            input_species=["CO", "H₂"], output_species=["Liquid Alkanes", "H₂O"],
            default_temp_c=250, default_pressure_bar=25, default_cost_weight=65, default_sustainability=55,
            tags=["syngas", "alkanes", "polymerization"], difficulty="medium",
            pathway_template=[
                {"label": "CO dissociation", "energy": 85},
                {"label": "CH* monomer formation", "energy": 35},
                {"label": "Chain propagation", "energy": -15},
                {"label": "Chain termination", "energy": 10},
                {"label": "Alkane desorption", "energy": 5},
            ],
        ),
        Reaction(
            name="Water-Gas Shift (WGS)", category="hydrogen-production",
            input_species=["CO", "H₂O"], output_species=["CO₂", "H₂"],
            default_temp_c=200, default_pressure_bar=1, default_cost_weight=40, default_sustainability=75,
            tags=["syngas-purification", "hydrogen"], difficulty="medium",
            pathway_template=[
                {"label": "H₂O dissociation", "energy": 25},
                {"label": "CO adsorption", "energy": -15},
                {"label": "Formate intermediate", "energy": 18},
                {"label": "CO₂ formation", "energy": -25},
                {"label": "H₂ desorption", "energy": 15},
            ],
        ),
        Reaction(
            name="Steam Methane Reforming", category="hydrogen-production",
            input_species=["CH₄", "H₂O"], output_species=["CO", "H₂"],
            default_temp_c=800, default_pressure_bar=25, default_cost_weight=75, default_sustainability=40,
            tags=["hydrogen", "endothermic"], difficulty="hard",
            pathway_template=[
                {"label": "CH₄ activation", "energy": 95},
                {"label": "CH₃* dehydrogenation", "energy": 40},
                {"label": "H₂O dissociation", "energy": 25},
                {"label": "C-O coupling", "energy": -15},
                {"label": "Syngas desorption", "energy": 30},
            ],
        ),
        Reaction(
            name="Sabatier Reaction (Methanation)", category="carbon-capture",
            input_species=["CO₂", "H₂"], output_species=["CH₄", "H₂O"],
            default_temp_c=350, default_pressure_bar=1, default_cost_weight=50, default_sustainability=85,
            tags=["methanation", "power-to-gas"], difficulty="medium",
            pathway_template=[
                {"label": "CO₂ adsorption", "energy": -10},
                {"label": "CO* intermediate", "energy": 30},
                {"label": "C-O cleavage", "energy": 65},
                {"label": "C* hydrogenation", "energy": -20},
                {"label": "CH₄ desorption", "energy": 10},
            ],
        ),
        Reaction(
            name="Ethylene Epoxidation", category="fine-chemicals",
            input_species=["C₂H₄", "O₂"], output_species=["C₂H₄O"],
            default_temp_c=250, default_pressure_bar=15, default_cost_weight=60, default_sustainability=65,
            tags=["oxidation", "epoxide"], difficulty="hard",
            pathway_template=[
                {"label": "O₂ dissociation", "energy": 45},
                {"label": "C₂H₄ adsorption", "energy": -15},
                {"label": "Oxametallacycle", "energy": 25},
                {"label": "Ring closure", "energy": 10},
                {"label": "Epoxide desorption", "energy": 15},
            ],
        ),
        Reaction(
            name="Suzuki Cross-Coupling", category="fine-chemicals",
            input_species=["Aryl Halide", "Boronic Acid"], output_species=["Biaryl", "Halide salt"],
            default_temp_c=80, default_pressure_bar=1, default_cost_weight=85, default_sustainability=50,
            tags=["pharmaceuticals", "C-C coupling"], difficulty="medium",
            pathway_template=[
                {"label": "Oxidative addition", "energy": 35},
                {"label": "Transmetalation", "energy": 20},
                {"label": "Reductive elimination TS", "energy": 40},
                {"label": "Product formation", "energy": -30},
                {"label": "Catalyst resting state", "energy": 5},
            ],
        ),
        Reaction(
            name="PET Depolymerization (Enzymatic)", category="environmental",
            input_species=["PET plastic", "H₂O"], output_species=["TPA", "EG"],
            default_temp_c=65, default_pressure_bar=1, default_cost_weight=45, default_sustainability=98,
            tags=["plastic-recycling", "enzyme"], difficulty="medium",
            pathway_template=[
                {"label": "Enzyme binding", "energy": -15},
                {"label": "Ester bond cleavage", "energy": 25},
                {"label": "MHET intermediate", "energy": 10},
                {"label": "Second cleavage", "energy": 20},
                {"label": "Monomers release", "energy": -5},
            ],
        ),
        Reaction(
            name="Toluene Disproportionation", category="petrochemistry",
            input_species=["Toluene"], output_species=["Xylene", "Benzene"],
            default_temp_c=400, default_pressure_bar=20, default_cost_weight=55, default_sustainability=60,
            tags=["zeolite", "aromatics"], difficulty="medium",
            pathway_template=[
                {"label": "Toluene adsorption", "energy": -20},
                {"label": "Methyl transfer TS", "energy": 75},
                {"label": "Diphenylmethane intermediate", "energy": 40},
                {"label": "Cleavage", "energy": -10},
                {"label": "Product desorption", "energy": 25},
            ],
        ),
        Reaction(
            name="Direct Air Capture (DAC) CO₂ Release", category="environmental",
            input_species=["Amine-CO₂ adduct"], output_species=["CO₂", "Amine"],
            default_temp_c=100, default_pressure_bar=1, default_cost_weight=80, default_sustainability=90,
            tags=["DAC", "desorption"], difficulty="easy",
            pathway_template=[
                {"label": "Heating", "energy": 20},
                {"label": "Bond weakening", "energy": 35},
                {"label": "Carbamate breakdown", "energy": 45},
                {"label": "CO₂ release", "energy": -10},
                {"label": "Amine regeneration", "energy": -5},
            ],
        ),
    ]
    db.add_all(reactions)
    db.commit()
    print(f"Seeded {len(reactions)} reactions")

# --- Catalyst ↔ Reaction compatibility mappings ---
def _cat(name: str):
    return db.query(Catalyst).filter(Catalyst.name == name).first()

def _rxn(name: str):
    return db.query(Reaction).filter(Reaction.name == name).first()

# Only seed compat if not already populated
from app.models.reaction import CatalystReactionCompat
from sqlalchemy import select
compat_count = db.execute(select(CatalystReactionCompat)).fetchall()
if not compat_count:
    compat_map = {
        "Ethanol → Jet fuel (C8–C16)": [
            "Ni/γ-Al₂O₃", "HZSM-5 (Si/Al=25)", "Pt-Sn/Al₂O₃",
            "CoMo/Al₂O₃ sulfided", "Ru/C", "MoS₂ edge sites",
        ],
        "CO₂ → Methanol (direct)": [
            "Cu/ZnO/Al₂O₃", "In₂O₃/ZrO₂", "Cu-Zn-Ga/SiO₂",
            "Pd/ZnO", "Cu-Ce/γ-Al₂O₃", "Ru-pincer CO₂", "Cu-Zn/Al₂O₃ (HT)",
        ],
        "N₂ → NH₃ (electrochemical)": [
            "Li-Fe electrocatalyst", "Au/CeO₂-RuO₂", "Co₃Mo₃N", "Fe–N–C ORR",
        ],
        "Glucose → Ethanol (fermentation)": [
            "ADH7 (yeast)", "Directed evolution P450-BM3", "P450-BM3 F87A",
        ],
        "Lignin → Aromatics": [
            "HZSM-5 (Si/Al=25)", "Pt-Sn/Al₂O₃", "CoMo/Al₂O₃ sulfided",
            "Ru/C", "MoS₂ edge sites", "Ni/γ-Al₂O₃",
        ],
        "Haber-Bosch (Thermochemical)": [
            "Fe₃O₄-K₂O-Al₂O₃", "Ru/MgO", "Co₃Mo₃N",
        ],
        "Fischer-Tropsch Synthesis": [
            "Fe/SiO₂", "Co/Al₂O₃", "Fe-Cu-K/SiO₂", "Ru/TiO₂", "MoS₂ edge sites",
        ],
        "Water-Gas Shift (WGS)": [
            "Fe₂O₃-Cr₂O₃ (HT-WGS)", "Cu-ZnO-Al₂O₃ (LT-WGS)",
            "Pt/CeO₂ WGS", "Au/Fe₂O₃",
        ],
        "Steam Methane Reforming": [
            "Ni/MgAl₂O₄", "Rh/CeZrO₂", "K-promoted Ni/Al₂O₃",
        ],
        "Sabatier Reaction (Methanation)": [
            "Ni/Al₂O₃", "Ru/Al₂O₃", "Ni-Fe/MgAl₂O₄ spinel",
        ],
        "Ethylene Epoxidation": [
            "Ag/α-Al₂O₃ + Cs", "Ti-silicalite TS-1", "Mn-salen complex",
        ],
        "Suzuki Cross-Coupling": [
            "Pd(PPh₃)₄", "Pd/C + SPhos", "NiCl₂(dppf)",
        ],
        "PET Depolymerization (Enzymatic)": [
            "PETase-MHETase fusion", "LCC-ICCG variant",
            "Laccase T1 Cu mutant", "P450-BM3 F87A",
        ],
        "Toluene Disproportionation": [
            "H-mordenite (Si/Al=10)", "HZSM-5 (Si/Al=40)",
            "MCM-22 zeolite", "MeOH → olefins (MTO)",
        ],
        "Direct Air Capture (DAC) CO₂ Release": [
            "PEI/mesoporous silica", "Aqueous K₂CO₃ solvent", "MOF-808-ethylenediamine",
        ],
    }

    total_mappings = 0
    for rxn_name, cat_names in compat_map.items():
        rxn = _rxn(rxn_name)
        if not rxn:
            print(f"  WARNING: reaction not found: {rxn_name}")
            continue
        for cat_name in cat_names:
            cat = _cat(cat_name)
            if not cat:
                print(f"  WARNING: catalyst not found: {cat_name}")
                continue
            if cat not in rxn.compatible_catalysts:
                rxn.compatible_catalysts.append(cat)
                total_mappings += 1

    db.commit()
    print(f"Seeded {total_mappings} catalyst-reaction compat mappings")

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
