# AUTHOR: Fabio Meneghini https://github.com/FabioMeneghini

import db_accessRRF as db_access
from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS

# Initialize your connection and knowledge graph
connection = db_access.DBAccess("localhost", "info", "postgres", "dblol", "5432") # change to ("your host", "your db name", "your username", "your password", "your port")
model_path = "nickprock/sentence-bert-base-italian-xxl-uncased"

def rrf(*ranks_lists, k=60):
    rrf_map = defaultdict(float)
    item_details = {}
    for rank_list in ranks_lists:
        for rank, item in enumerate(rank_list, 1):
            codice = item[0]
            testo = item[2]
            section = item[3]
            rrf_map[codice] += 1 / (rank + k)
            item_details[codice] = (codice, testo, section)
    sorted_items = sorted(rrf_map.items(), key=lambda x: x[1], reverse=True)
    result = [(item_details[codice][0], item_details[codice][1], score, item_details[codice][2]) for codice, score in sorted_items]
    return result

def response_generator(connection, prompt):
    bm25_results = connection.get_bm25_rank(prompt)
    embeddings_results = connection.get_embeddings_rank(prompt, model_path)
    if bm25_results is None or not isinstance(bm25_results, list) or embeddings_results is None or not isinstance(embeddings_results, list):
        return ["Non è stato possibile generare una risposta"]
    elif len(bm25_results) == 0 or len(embeddings_results) == 0:
        return [f"Mi dispiace &#128542; Non sembra esserci alcuna informazione a riguardo."]
    else:
        if isinstance(bm25_results, list) and isinstance(embeddings_results, list):
            rrf_results = rrf(bm25_results, embeddings_results)
            response = f"{rrf_results[0][1]}<br/>Per ulteriori informazioni vai a <a href='{rrf_results[0][3]}'>questa sezione</a>."
            return response
        return ["Si è verificato un errore &#128542;"]


@app.route('/api/query', methods=['POST'])
def query():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'Prompt vuoto'}), 400

    response = response_generator(connection, prompt)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(port=5000)