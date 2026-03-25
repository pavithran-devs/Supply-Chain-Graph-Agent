import duckdb
db = duckdb.connect("supply_chain.db")
# View the first 20 triples
print(db.execute("SELECT * FROM triples LIMIT 300").df())
