# Supply Chain Graph-RAG Agent

**Supply Chain Graph-RAG Agent** is a high-performance, zero-setup Supply Chain Traceability tool built for senior Forward Deployed Engineers (FDEs). It leverages a **Graph-RAG** (Retrieval-Augmented Generation) approach to analyze complex Order-to-Cash flows using natural language.


---

## Key Features

- **High-Speed Analytical Graph Lake**: Uses **DuckDB** for vectorized triple-store processing, enabling millisecond-latency graph traversals on Windows.
- **Context-Aware Memory Engine**: Resolves ambiguous pronouns (*"it," "its," "their"*) by maintaining a conversation buffer and tracking recently discussed entities.
- **Interactive Graph Reflection**: A premium **Vis.js** frontend that automatically zooms, focuses, and applies persistent glowing highlights to nodes in the current "Active Context."
- **Anomaly Detection**: Advanced logic to identify **Orphaned Orders** (orders with no fulfillment) and stalled logistics flows.
- **Community Clustering**: Group-level analysis of customers to identify demographics experiencing high delivery failure rates.
- **Zero-Setup Portability**: 100% compatible with Windows and Python 3.14+. Requires only a single file (`supply_chain.db`).

---

## 🚀 Hosting & Deployment

The application is container-ready and follows production best practices (configurable ports, multi-stage builds).

### Option 1: Docker (Cloud VM / Self-Hosted)

We provide a multi-stage `Dockerfile` that builds the React frontend and packages it with the FastAPI backend.

1.  **Build the Image**:
    ```bash
    docker build -t supply-chain-agent .
    ```

2.  **Run with Environment Variables**:
    ```bash
    docker run -p 8000:8000 -e GROQ_KEY="your_key" supply-chain-agent
    ```

3.  **Using Docker Compose**:
    ```bash
    # Create a .env file with GROQ_KEY
    docker-compose up --build
    ```

### Option 2: Platform-as-a-Service (Render / Railway / Fly.io)

Most platforms will automatically detect the Python application.

1.  **Root Directory**: Point to the root where `main.py` exists.
2.  **Build Command**:
    ```bash
    # Install dependencies + Build Frontend
    pip install -r requirements.txt && cd frontend && npm install && npm run build
    ```
3.  **Start Command**:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port $PORT
    ```
4.  **Environment Variables**: Ensure `GROQ_KEY` is set in the platform's dashboard.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Uvicorn
- **AI/LLM**: Groq (Llama-3.3-70b-versatile)
- **Database**: DuckDB (Embedded Property Graph)
- **Frontend**: Vis.js, Tailwind CSS (Modern Glassmorphism UI)
- **Data Engineering**: NetworkX (Modeling), Pandas (ETL)

---

## Folder Structure

```bash
├── main.py              # FastAPI Backend & RAG Logic
├── index.html           # Professional Side-by-Side Frontend
├── memory_manager.py    # Context-Aware Memory Engine
├── graph_edges.csv      # Source Supply Chain Dataset
├── supply_chain.db      # Persistent DuckDB Analytical Store
├── .env                 # API Keys (GROQ_KEY)
└── requirements.txt     # Project Dependencies
```

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url>
   cd supply-chain-graph-agent
   ```

2. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add your Groq API Key:
   ```env
   GROQ_KEY=gsk_your_api_key_here
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

1. **Start the Backend**:
   ```bash
   python main.py
   ```
   *The system will automatically initialize the DuckDB store from `graph_edges.csv` on the first run.*

2. **Access the UI**:
   Open your browser and navigate to:
   **[http://localhost:8000](http://localhost:8000)**

3. **Sample Investigation Prompts**:
   - *"Analyze the internal structure of the graph. Show me the total count of Nodes and Relationships."*
   - *"Find Order_740506. Who placed it and what is its fulfillment status?"*
   - *"Are there any stalled flows or orphaned orders in the system?"*

---

## API Details

### `GET /graph-data`
Returns the complete graph schema (Nodes & Edges) for Vis.js rendering.

### `POST /ask`
Processes natural language queries against the graph.
- **Request Body**: `{"query": "Who is the customer for Order_740510?"}`
- **Response**:
  ```json
  {
    "answer": "The customer for Order_740510 is Customer_310000109.",
    "focus_id": "Order_740510",
    "path_ids": ["Order_740510", "Customer_310000109"],
    "active_entities": ["Order_740510", "Customer_310000109"]
  }
  ```

---

##  Guardrails

This AI is strictly configured as a **Supply Chain Analyst**. It will refuse requests unrelated to the dataset (e.g., writing poems, stories, or off-topic technical advice) with the message:
*"This system is designed to answer questions related to the provided dataset only."*

---


