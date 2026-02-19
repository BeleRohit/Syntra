# Syntra - Personal Knowledge Operating System

> "Where thoughts become threads"

Syntra is a private, single-user mobile app that serves as your **second brain** - storing books, notes, articles, quotes, and ideas as semantic nodes, automatically connecting related thoughts using AI embeddings, and enabling semantic search and visualization.

![Syntra](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![License](https://img.shields.io/badge/License-Private-red)
![Stack](https://img.shields.io/badge/Stack-Expo%20%7C%20FastAPI%20%7C%20MongoDB-green)

## ✨ Features

### 🧠 Knowledge Nodes
Store 5 types of knowledge with rich metadata:
- **Books** - Reading notes and summaries
- **Notes** - Personal observations and thoughts
- **Articles** - Web content and research
- **Quotes** - Memorable passages and wisdom
- **Ideas** - Creative concepts and insights

### 🔗 Automatic Semantic Connections
- AI-powered embedding generation using sentence-transformers
- Automatic discovery of related content (similarity > 75%)
- Visual connection mapping in the knowledge graph

### 🔍 Semantic Search
- Natural language search across all your knowledge
- Results ranked by semantic similarity percentage
- Find connections you didn't know existed

### 📊 Knowledge Graph Visualization
- Interactive visual map of all nodes
- Color-coded by knowledge type
- Connection lines showing relationships
- Tap to explore node details

## 🖼️ Screenshots

| Home | Add Node | Search | Graph |
|------|----------|--------|-------|
| Main navigation | Create knowledge | Semantic search | Visual graph |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Expo/React Native)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Home   │ │Add Node │ │ Search  │ │ Detail  │ │ Graph  ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Sentence Transformers                      │  │
│  │         (all-MiniLM-L6-v2 - 384 dims)                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │ Nodes   │ │ Search  │ │ Graph   │ │ Cosine Similarity│  │
│  │  API    │ │   API   │ │   API   │ │    Engine        │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   knowledge_nodes   │  │     connections     │          │
│  │  - id               │  │  - fromNodeId       │          │
│  │  - type             │  │  - toNodeId         │          │
│  │  - title            │  │  - similarityScore  │          │
│  │  - content          │  │  - createdAt        │          │
│  │  - embedding[384]   │  │                     │          │
│  │  - tags[]           │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB
- Expo CLI

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd syntra
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
```

4. **Environment Configuration**

Backend `.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=syntra_db
```

Frontend `.env`:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

### Running the App

1. **Start MongoDB**
```bash
mongod
```

2. **Start Backend**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

3. **Start Frontend**
```bash
cd frontend
yarn start
```

4. **Access the App**
- Web: http://localhost:3000
- Mobile: Scan QR code with Expo Go app

## 📡 API Reference

### Health Check
```http
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T10:30:00.000000"
}
```

### Create Node
```http
POST /api/nodes
Content-Type: application/json

{
  "type": "note",
  "title": "Philosophy of Learning",
  "content": "Knowledge is the foundation of wisdom...",
  "source": "https://example.com",
  "tags": ["philosophy", "learning"]
}
```
Response: Node with auto-generated embedding and discovered connections

### Get All Nodes
```http
GET /api/nodes
```

### Get Node with Connections
```http
GET /api/nodes/{node_id}
```
Response: Node details + list of connected nodes with similarity scores

### Delete Node
```http
DELETE /api/nodes/{node_id}
```

### Semantic Search
```http
POST /api/search
Content-Type: application/json

{
  "query": "philosophy of wisdom"
}
```
Response: Top 10 semantically similar nodes with match percentages

### Get Graph Data
```http
GET /api/graph
```
Response: All nodes and connections for visualization

## 🎨 Design System

| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep Navy | `#0a1628` |
| Cards | Off-white | `#f5f5f0` |
| Accent | Muted Teal | `#4a9d8c` |
| Book | Purple | `#8b5cf6` |
| Note | Blue | `#3b82f6` |
| Article | Orange | `#f59e0b` |
| Quote | Pink | `#ec4899` |
| Idea | Green | `#10b981` |

## 🔧 Tech Stack

### Frontend
- **Framework**: Expo / React Native
- **Navigation**: Expo Router (file-based)
- **State**: React useState/useEffect
- **HTTP Client**: Axios
- **Icons**: Expo Vector Icons (Ionicons)

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Math**: NumPy

### Key Libraries
```
# Backend
fastapi==0.115.12
motor==3.7.0
sentence-transformers==3.4.1
numpy==2.2.3

# Frontend
expo~52.0.43
axios^1.9.0
react-native-svg^15.15.3
```

## 📁 Project Structure

```
syntra/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx   # Root layout
│   │   ├── index.tsx     # Home screen
│   │   ├── add-node.tsx  # Add node screen
│   │   ├── search.tsx    # Search screen
│   │   ├── node-detail.tsx # Node detail screen
│   │   └── graph.tsx     # Knowledge graph screen
│   ├── package.json
│   └── .env
└── README.md
```

## 🔒 Privacy & Security

- **Single-user only**: No multi-tenancy, no sharing
- **No authentication required**: Private by design
- **Local embeddings**: No data sent to external APIs
- **All data stored locally**: MongoDB on your machine

## 🛣️ Roadmap

- [ ] Edit existing nodes
- [ ] Advanced graph interactions (zoom, pan, drag)
- [ ] Tag-based filtering and organization
- [ ] Adjustable similarity threshold
- [ ] Export/import knowledge base
- [ ] Dark/light theme toggle
- [ ] Offline mode with sync

## 🤝 Contributing

This is a private, single-user application. For feature requests or bug reports, please open an issue.

## 📄 License

Private - All rights reserved.

---

**Built with ❤️ as your personal semantic memory system**

*Syntra - Where thoughts become threads*
