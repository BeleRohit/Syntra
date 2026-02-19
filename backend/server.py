from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from openai import OpenAI
import numpy as np


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client for embeddings
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
openai_client = OpenAI(
    api_key=EMERGENT_LLM_KEY,
    base_url="https://api.emergentagi.com/v1"
)

# Create the main app without a prefix
app = FastAPI(title="Syntra API", description="Personal Knowledge Operating System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
EMBEDDING_MODEL = "text-embedding-3-small"
SIMILARITY_THRESHOLD = 0.75

# ================================
# Pydantic Models
# ================================

class KnowledgeNodeCreate(BaseModel):
    type: str = Field(..., description="Type of node: book, note, article, quote, idea")
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    source: Optional[str] = None
    tags: Optional[List[str]] = []

class KnowledgeNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    content: str
    source: Optional[str] = None
    tags: List[str] = []
    embedding: List[float] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Connection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fromNodeId: str
    toNodeId: str
    similarityScore: float
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)

class SearchResult(BaseModel):
    node: KnowledgeNode
    similarity: float

class GraphData(BaseModel):
    nodes: List[KnowledgeNode]
    connections: List[Connection]

class ConnectedNode(BaseModel):
    node: KnowledgeNode
    similarityScore: float

class NodeWithConnections(BaseModel):
    node: KnowledgeNode
    connections: List[ConnectedNode]

# ================================
# Helper Functions
# ================================

def generate_embedding(content: str) -> List[float]:
    """Generate embedding for text content using OpenAI."""
    try:
        text_clean = content.replace("\n", " ").strip()
        if not text_clean:
            return []
        
        response = openai_client.embeddings.create(
            input=text_clean,
            model=EMBEDDING_MODEL
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec_a or not vec_b:
        return 0.0
    
    a = np.array(vec_a)
    b = np.array(vec_b)
    
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(dot_product / (norm_a * norm_b))

# ================================
# API Routes
# ================================

@api_router.get("/")
async def root():
    return {"message": "Syntra API - Personal Knowledge Operating System"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Create a new knowledge node
@api_router.post("/nodes", response_model=NodeWithConnections)
async def create_node(node_input: KnowledgeNodeCreate):
    """Create a new knowledge node with auto-generated embedding and connections."""
    try:
        # Generate embedding for the content
        logger.info(f"Creating node: {node_input.title}")
        embedding = generate_embedding(node_input.content)
        
        # Create the node
        node = KnowledgeNode(
            type=node_input.type,
            title=node_input.title,
            content=node_input.content,
            source=node_input.source,
            tags=node_input.tags or [],
            embedding=embedding
        )
        
        # Save to database
        await db.knowledge_nodes.insert_one(node.dict())
        logger.info(f"Node created with ID: {node.id}")
        
        # Find similar nodes and create connections
        connected_nodes = []
        existing_nodes = await db.knowledge_nodes.find({"id": {"$ne": node.id}}).to_list(1000)
        
        for existing_node in existing_nodes:
            if existing_node.get('embedding'):
                similarity = cosine_similarity(embedding, existing_node['embedding'])
                
                if similarity >= SIMILARITY_THRESHOLD:
                    # Create connection
                    connection = Connection(
                        fromNodeId=node.id,
                        toNodeId=existing_node['id'],
                        similarityScore=similarity
                    )
                    await db.connections.insert_one(connection.dict())
                    logger.info(f"Connection created: {node.id} -> {existing_node['id']} (similarity: {similarity:.3f})")
                    
                    connected_nodes.append(ConnectedNode(
                        node=KnowledgeNode(**existing_node),
                        similarityScore=similarity
                    ))
        
        return NodeWithConnections(node=node, connections=connected_nodes)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating node: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get all nodes
@api_router.get("/nodes", response_model=List[KnowledgeNode])
async def get_all_nodes():
    """Get all knowledge nodes."""
    nodes = await db.knowledge_nodes.find().to_list(1000)
    return [KnowledgeNode(**node) for node in nodes]

# Get a single node with its connections
@api_router.get("/nodes/{node_id}", response_model=NodeWithConnections)
async def get_node(node_id: str):
    """Get a single node with its connections."""
    node = await db.knowledge_nodes.find_one({"id": node_id})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Get all connections for this node
    connections = await db.connections.find({
        "$or": [
            {"fromNodeId": node_id},
            {"toNodeId": node_id}
        ]
    }).to_list(100)
    
    connected_nodes = []
    for conn in connections:
        # Get the other node in the connection
        other_id = conn['toNodeId'] if conn['fromNodeId'] == node_id else conn['fromNodeId']
        other_node = await db.knowledge_nodes.find_one({"id": other_id})
        if other_node:
            connected_nodes.append(ConnectedNode(
                node=KnowledgeNode(**other_node),
                similarityScore=conn['similarityScore']
            ))
    
    # Sort by similarity score
    connected_nodes.sort(key=lambda x: x.similarityScore, reverse=True)
    
    return NodeWithConnections(
        node=KnowledgeNode(**node),
        connections=connected_nodes
    )

# Delete a node
@api_router.delete("/nodes/{node_id}")
async def delete_node(node_id: str):
    """Delete a knowledge node and its connections."""
    # Check if node exists
    node = await db.knowledge_nodes.find_one({"id": node_id})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Delete the node
    await db.knowledge_nodes.delete_one({"id": node_id})
    
    # Delete all connections involving this node
    await db.connections.delete_many({
        "$or": [
            {"fromNodeId": node_id},
            {"toNodeId": node_id}
        ]
    })
    
    return {"message": "Node deleted successfully"}

# Semantic search
@api_router.post("/search", response_model=List[SearchResult])
async def semantic_search(search_input: SearchRequest):
    """Search nodes using semantic similarity."""
    try:
        # Generate embedding for the query
        query_embedding = generate_embedding(search_input.query)
        
        # Get all nodes
        nodes = await db.knowledge_nodes.find().to_list(1000)
        
        # Calculate similarity for each node
        results = []
        for node in nodes:
            if node.get('embedding'):
                similarity = cosine_similarity(query_embedding, node['embedding'])
                results.append({
                    'node': KnowledgeNode(**node),
                    'similarity': similarity
                })
        
        # Sort by similarity and return top 10
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return [SearchResult(**r) for r in results[:10]]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get graph data
@api_router.get("/graph", response_model=GraphData)
async def get_graph():
    """Get all nodes and connections for graph visualization."""
    nodes = await db.knowledge_nodes.find().to_list(1000)
    connections = await db.connections.find().to_list(5000)
    
    return GraphData(
        nodes=[KnowledgeNode(**node) for node in nodes],
        connections=[Connection(**conn) for conn in connections]
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
