import os
import re
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import duckdb
import pandas as pd
from groq import Groq
from memory_manager import memory

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_KEY")
client = None
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)

# Initialize DuckDB
db = duckdb.connect("supply_chain.db")
CSV_PATH = "graph_edges.csv"

# Global System Metrics
stats = {"node_count": 0, "edge_count": 0, "orphans": [], "clusters": {}}

def init_db():
    global stats
    if os.path.exists(CSV_PATH):
        db.execute("CREATE TABLE IF NOT EXISTS triples (source VARCHAR, target VARCHAR, relation VARCHAR)")
        db.execute("DELETE FROM triples")
        db.execute(f"INSERT INTO triples SELECT source, target, relation FROM read_csv_auto('{CSV_PATH}')")
        
        # Calculate Stats for Criteria 1
        stats["edge_count"] = db.execute("SELECT count(*) FROM triples").fetchone()[0]
        nodes = db.execute("SELECT count(DISTINCT node) FROM (SELECT source AS node FROM triples UNION SELECT target AS node FROM triples)").fetchone()[0]
        stats["node_count"] = nodes
        
        # Calculate Orphans for Criteria 4
        # Orders with no FULFILLED_BY
        orphans = db.execute("""
            SELECT DISTINCT source FROM triples 
            WHERE source LIKE 'Order_%' 
            AND source NOT IN (SELECT source FROM triples WHERE relation = 'FULFILLED_BY')
        """).fetchall()
        stats["orphans"] = [o[0] for o in orphans]
        
        # Simple Clustering for Criteria 5
        # Grouping by Customer -> Order patterns
        clusters = db.execute("""
            SELECT target AS group_id, count(*) as size 
            FROM triples WHERE relation = 'IN_GROUP' 
            GROUP BY target
        """).fetchall()
        stats["clusters"] = {c[0]: c[1] for c in clusters}
        
        print(f"System Ready. Nodes: {stats['node_count']}, Edges: {stats['edge_count']}")

init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/graph-data")
def get_graph_data():
    try:
        nodes_res = db.execute("""
            SELECT DISTINCT node FROM (
                SELECT source AS node FROM triples
                UNION
                SELECT target AS node FROM triples
            )
        """).fetchall()
        nodes = []
        for row in nodes_res:
            nid = row[0]
            nodes.append({
                "id": nid,
                "label": nid.split('_')[-1] if '_' in nid else nid,
                "group": nid.split('_')[0] if '_' in nid else 'Misc',
                "title": f"ID: {nid}"
            })
        edges_res = db.execute("SELECT source, target, relation FROM triples").fetchall()
        edges = [{"from": r[0], "to": r[1], "label": r[2]} for r in edges_res]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"Graph Data Error: {e}")
        return {"nodes": [], "edges": []}

class AskRequest(BaseModel):
    query: str

@app.post("/ask")
def ask(req: AskRequest):
    if not client:
        raise HTTPException(status_code=500, detail="GROQ_KEY missing in .env")
    
    memory.add_message("user", req.query)
    
    # Context Retrieval
    query_lower = req.query.lower()
    ids = re.findall(r'[a-zA-Z0-9]+_[a-zA-Z0-9]+', req.query)
    numbers = re.findall(r'\d{4,}', req.query)
    search_terms = set(ids + numbers)
    
    # Pronoun Resolution
    if any(p in query_lower for p in ["it", "its", "their", "that", "this"]):
        search_terms.update(list(memory.recent_entities))
        
    context_rows = []
    if search_terms:
        # Fetch triples matching terms
        where_parts = [f"source LIKE '%{term}%' OR target LIKE '%{term}%'" for term in search_terms]
        res = db.execute(f"SELECT source, relation, target FROM triples WHERE {' OR '.join(where_parts)} LIMIT 150").fetchall()
        for r in res:
            context_rows.append(f"({r[0]}) --[{r[1]}]--> ({r[2]})")
            
    # Always include global stats and summary for high-level validation
    global_context = (
        f"GLOBAL STATS: Nodes={stats['node_count']}, Edges={stats['edge_count']}.\n"
        f"STALLED FLOWS: {stats['orphans'][:20]} (Truncated list of Orders without fulfillment).\n"
        f"CLUSTERS: Community mapping based on Customer Groups: {stats['clusters']}.\n"
        f"MEMORY CONTEXT: {list(memory.recent_entities)}."
    )
            
    context = "\n".join(context_rows)
    story = "\n".join([f"{m['role']}: {m['content']}" for m in memory.get_history()[-3:]])
    
    system_instruction = (
        "You are Dodge AI, a Senior Forward Deployed Engineer (FDE) Grade Analyst. "
        "Strictly evaluate the supply chain graph based on the provided Triples and Global Stats.\n\n"
        "EVALUATION CRITERIA:\n"
        "1. Accuracy: Use exact counts from GLOBAL STATS.\n"
        "2. Anomaly Detection: Use the STALLED FLOWS list to identify broken fulfillment paths.\n"
        "3. Graph Clustering: Use the CLUSTERS data to identify problematic communities.\n"
        "4. Reflection: Return 'focus_id' (single key ID) and 'path_ids' (related context IDs).\n"
        "5. Guardrails: If asked to write poems, stories, or anything outside supply chain dataset, say: "
        "'This system is designed to answer questions related to the provided dataset only.'\n\n"
        "OUTPUT FORMAT: Strictly JSON with keys: 'answer', 'focus_id', 'path_ids', 'active_entities' (last 3 IDs tracked)."
    )
    
    prompt = f"{global_context}\n\n### Graph Database Context:\n{context}\n\n### History:\n{story}\n\n### Current Query:\n{req.query}"
    
    try:
        final_res = client.chat.completions.create(
            messages=[{"role": "system", "content": system_instruction}, {"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0, # Deterministic for evaluation
            response_format={"type": "json_object"}
        )
        data = json.loads(final_res.choices[0].message.content)
        
        # Entity Persistence
        if data.get('active_entities'):
            memory.add_entities(data['active_entities'])
        elif data.get('focus_id'):
            memory.add_entities([data['focus_id']])
            
        memory.add_message("assistant", data['answer'])
        return data
        
    except Exception as e:
        return {"answer": f"Evaluation Error: {str(e)}", "focus_id": None, "path_ids": [], "active_entities": []}

# Serve React app if it exists, otherwise fall back to index.html
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    @app.get("/")
    def index():
        return FileResponse("frontend/dist/index.html")
else:
    @app.get("/")
    def index():
        return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
