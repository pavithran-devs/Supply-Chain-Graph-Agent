import pandas as pd
import json
import os

# Define paths to your extracted dataset folders
DATA_DIR = "sap-o2c-data"

def load_jsonl(file_path):
    """Helper to load JSONL files into a Pandas DataFrame"""
    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}")
        return pd.DataFrame()
    
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            data.append(json.loads(line))
    return pd.DataFrame(data)

def preprocess_graph_data():
    print("--- Loading Data ---")
    
    # Using your specific part-names
    so_headers = load_jsonl(f"{DATA_DIR}/sales_order_headers/part-20251119-133429-440.jsonl")
    so_items = load_jsonl(f"{DATA_DIR}/sales_order_items/part-20251119-133429-452.jsonl")
    delivery_items = load_jsonl(f"{DATA_DIR}/outbound_delivery_items/part-20251119-133431-439.jsonl")
    billing_headers = load_jsonl(f"{DATA_DIR}/billing_document_headers/part-20251119-133433-228.jsonl")
    
    if delivery_items.empty:
        print("Error: Delivery items dataframe is empty. Check file paths.")
        return

    # DEBUG: See what the columns are actually named
    print(f"Detected Delivery Columns: {delivery_items.columns.tolist()}")

    print("--- Creating Edges (Relationships) ---")
    edges = []

    # 1. Edge: (Customer) -[PLACED]-> (SalesOrder)
    for _, row in so_headers.iterrows():
        edges.append({
            "source": f"Customer_{row.get('soldToParty')}",
            "target": f"Order_{row.get('salesOrder')}",
            "type": "PLACED"
        })

    # 2. Edge: (SalesOrder) -[HAS_ITEM]-> (Product)
    for _, row in so_items.iterrows():
        edges.append({
            "source": f"Order_{row.get('salesOrder')}",
            "target": f"Product_{row.get('material')}",
            "type": "HAS_ITEM",
            "quantity": row.get('requestedQuantity', 0)
        })

    # 3. Edge: (SalesOrder) -[FULFILLED_BY]-> (Delivery)
    # Check if 'outboundDelivery' exists, if not, check for 'deliveryDocument'
    del_col = 'outboundDelivery' if 'outboundDelivery' in delivery_items.columns else 'deliveryDocument'
    ref_col = 'referenceSdDocument'

    for _, row in delivery_items.iterrows():
        # Using .get() prevents the script from crashing if a row is missing a value
        so_id = row.get(ref_col)
        del_id = row.get(del_col)
        
        if so_id and del_id:
            edges.append({
                "source": f"Order_{so_id}",
                "target": f"Delivery_{del_id}",
                "type": "FULFILLED_BY"
            })

    print(f"Total Edges Created: {len(edges)}")
    
    # Convert to DataFrames and drop duplicates
    df_edges = pd.DataFrame(edges).drop_duplicates()
    
    # Save for the next step
    df_edges.to_csv("graph_edges.csv", index=False)
    print("Saved graph_edges.csv successfully.")

if __name__ == "__main__":
    preprocess_graph_data()