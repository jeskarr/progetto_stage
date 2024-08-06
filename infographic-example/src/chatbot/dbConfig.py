import db_accessRRF as db_access

# Initialize your connection
connection = db_access.DBAccess("localhost", "info", "postgres", "", "5432")        # change to ("your host", "your db name", "your username", "your password", "your port")
model_path = "nickprock/sentence-bert-base-italian-xxl-uncased"

# Populate vettore field
connection.calculate_embeddings(model_path)