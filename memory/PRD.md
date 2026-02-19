# Syntra - Personal Knowledge Operating System

## Overview
Syntra is a private, single-user mobile app that serves as a "second brain" - storing books, notes, articles, quotes, and ideas as semantic nodes, automatically connecting related thoughts using AI embeddings, and enabling semantic search and visualization.

**Tagline**: "Where thoughts become threads"

## Core Features

### 1. Knowledge Nodes
- Store 5 types of knowledge: book, note, article, quote, idea
- Each node contains: title, content, source (optional), tags
- Automatic embedding generation using sentence-transformers (all-MiniLM-L6-v2)
- Auto-connection to similar nodes (similarity > 0.75)

### 2. Semantic Search
- AI-powered search using embeddings
- Returns top 10 most similar results with match percentage
- Fast local inference (no API calls required)

### 3. Knowledge Graph Visualization
- Visual representation of all nodes
- Color-coded by type (Book=purple, Note=blue, Article=orange, Quote=pink, Idea=green)
- Connection lines showing semantic relationships
- Tap nodes to view details

## Technical Architecture

### Backend (FastAPI + MongoDB)
- **Server**: `/app/backend/server.py`
- **Embedding Model**: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
- **Database Collections**:
  - `knowledge_nodes`: stores all nodes with embeddings
  - `connections`: stores similarity relationships

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/nodes` | POST | Create new node |
| `/api/nodes` | GET | Get all nodes |
| `/api/nodes/{id}` | GET | Get node with connections |
| `/api/nodes/{id}` | DELETE | Delete node |
| `/api/search` | POST | Semantic search |
| `/api/graph` | GET | Get graph data |

### Frontend (Expo/React Native)
- **Screens**:
  - Home: Main navigation
  - Add Node: Create knowledge nodes
  - Search: Semantic search interface
  - Node Detail: View node and connections
  - Graph: Visual knowledge graph

## Design System
- **Background**: Deep navy (#0a1628)
- **Cards**: Off-white (#f5f5f0)
- **Accent**: Muted teal (#4a9d8c)
- **Typography**: Clean sans-serif

## Security Note
- Single-user, private app
- No authentication required
- All data stored locally in MongoDB
- No external API dependencies for core functionality

## Future Enhancements
- Edit existing nodes
- Advanced graph interactions (zoom, pan)
- Export/import knowledge base
- Tag-based filtering
- Connection threshold customization
