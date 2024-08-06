# AUTHOR: Fabio Meneghini https://github.com/FabioMeneghini

import db_accessDBSF as db_access
from collections import defaultdict
from math import inf
from flask import Flask, request, jsonify
from flask_cors import CORS
import itertools

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS


# Initialize your connection 
connection = db_access.DBAccess("localhost", "info", "postgres", "", "5432") # change to ("your host", "your db name", "your username", "your password", "your port")
model_path = "nickprock/sentence-bert-base-italian-xxl-uncased"

def dbsf(*ranks_lists):
    dbsf_rank_lists = []
    for rank_list in ranks_lists:
        if len(rank_list) == 1:
            dbsf_rank_lists.append(rank_list)
            print(rank_list)
            continue
        mean_score = sum(doc[1] for doc in rank_list) / len(rank_list)
        std_dev = (sum((doc[1] - mean_score) ** 2 for doc in rank_list) / len(rank_list)) ** 0.5
        min_score = mean_score - 3 * std_dev
        max_score = mean_score + 3 * std_dev

        dbsf_rank_list = []
        for doc in rank_list:
            dbsf_rank_list.append((doc[0], (doc[1] - min_score) / (max_score - min_score), doc[2], doc[3]))
        dbsf_rank_lists.append(dbsf_rank_list)
    
    output = []
    docs_per_id = defaultdict(list)
    for doc in itertools.chain.from_iterable(dbsf_rank_lists):
        docs_per_id[doc[0]].append(doc)
    for docs in docs_per_id.values():
        doc_with_best_score = max(docs, key=lambda doc: doc[2] if doc[2] else -inf)
        output.append(doc_with_best_score)
    output.sort(key=lambda doc: doc[1], reverse=True)
    return output

def response_generator(connection, prompt):
    bm25_results = connection.get_bm25_rank(prompt)
    embeddings_results = connection.get_embeddings_rank(prompt, model_path)
    embeddings_results = [(t[0], 1 - t[1], t[2], t[3]) for t in embeddings_results]
    if bm25_results is None or not isinstance(bm25_results, list) or embeddings_results is None or not isinstance(embeddings_results, list):
        return ["Non è stato possibile generare una risposta"]
    elif len(bm25_results) == 0 or len(embeddings_results) == 0:
        return [f"Mi dispiace &#128542; Non sembra esserci alcuna informazione a riguardo."]
    else:
        if isinstance(bm25_results, list) and isinstance(embeddings_results, list):
            dbsf_results = dbsf(bm25_results, embeddings_results)
            response = f"{dbsf_results[0][2]}<br/>Per ulteriori informazioni vai a <a href='{dbsf_results[0][3]}'>questa sezione</a>."
            return response
        return ["Si è verificato un errore &#128542;"]


@app.route('/api/query', methods=['POST'])
def query():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    response = response_generator(connection, prompt)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(port=5000)