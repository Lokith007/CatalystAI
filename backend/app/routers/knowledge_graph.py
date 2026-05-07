"""Knowledge graph router — nodes and edges."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.knowledge_graph import KGNode, KGEdge
from ..schemas.knowledge_graph import KGNodeOut, KGNodeCreate, KGEdgeCreate, KnowledgeGraphOut

router = APIRouter(prefix="/api/knowledge-graph", tags=["knowledge-graph"])


@router.get("/", response_model=KnowledgeGraphOut)
def get_graph(db: Session = Depends(get_db)):
    nodes = db.query(KGNode).all()
    edges = db.query(KGEdge).all()
    return KnowledgeGraphOut(nodes=nodes, edges=edges)


@router.post("/nodes", response_model=KGNodeOut, status_code=201)
def create_node(req: KGNodeCreate, db: Session = Depends(get_db)):
    node = KGNode(**req.model_dump())
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


@router.post("/edges", status_code=201)
def create_edge(req: KGEdgeCreate, db: Session = Depends(get_db)):
    edge = KGEdge(**req.model_dump())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return {"id": edge.id}
