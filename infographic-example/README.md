# Infographic-example - VERSIONE INTEGRATA
This is an example of a web infographic created using mainly HTML, CSS and JS, with D3.js for data visualization elements. 
The topic of this infographic is the Bachelor Degree in Computer Science at the Università degli Studi di Padova.

It uses a local server (python *http.server*) to be viewed.

**Important:** This version of the infographic includes an advanced chatbot which uses hybrid search. For a more basic chatbot see the
`main` branch.

## Software requirements
To run this project, you need to have the following software and dependencies installed:
- **Python**: you can download it from the [official Python website](https://www.python.org/downloads/), make sue also to install `pip`, which is the package installer for Python (you will need this later on). Python is used as main programming language for the implementation of the chatbot algorithm.
- **PostgreSQL and pgAdmin**: you can download them from the [official PostgreSQL website](https://www.postgresql.org/download/) and from the [pgAdmin website](https://www.pgadmin.org/download/). These are used for managing the database storing the info to display on the chat.
- **pgVector**: you can download it following the instruction available on the [pgvector GitHub repository](https://github.com/pgvector/pgvector). This is an extension for Postgres which is used to support vector similarity search.
- **Python libraries**: you should use `pip` to install all the necessary libraries. You can install them by prompting on the cms the following:
    ```
    pip install collections psycopg2 txtai flask flask-cors
    ```

## How to use
### Initial setup
After having met the requirements, you need to setup the database before running the project.
1. **Create the Database**
    - Open pgAdmin and connect to your PostgreSQL server.
    - Right-click on the "Databases" node in the tree and select "Create" > "Database..."
    - Name the database `info` and click "Save."

2. **Create the `docs` Table**
    - Navigate to the `info` database and right-click on the "Schemas" node, then select "Create" > "Table..."
    - Name the table `docs` (a doc is a piece of text containing info about the infographic) and define the following columns:
        - **codice**: VARCHAR, used for the document code;
        - **section**: VARCHAR, used for the id of the html section which contains the document's info;
        - **testo**: VARCHAR, used for the document text.
        - **vettore**: VECTOR, used for storing vector embeddings (thanks to pgVector).
    - Click "Save" to create the table.
    - Right-click on the `docs` table, select "Import/Export Data..."
    - Choose "Import" and select the `info.csv` file. You can find this file into `src/chatbot`.

4. **Calculate Embeddings**
    - Ensure you have the required Python dependencies installed (`txtai`, `psycopg2`, etc.).
    - Run `dbConfig.py` to populate the `vettore` field. You can find it under the `src/chatbot` directory. Please remember to check that the database settings (such as host, user, password, and port) in this file are the same as the one you are using.

5. **Create the `idf` Table**
    - In pgAdmin, right-click on the "Tables" node within the `info` database and select "Create" > "Table..."
    - Name the table `idf` and define it with this query:
        ```sql
        CREATE TABLE idf AS
        SELECT lexeme, cnt, n, ln((n-cnt+0.5)/(cnt+0.5)+1) AS idf FROM (
            SELECT lexeme, count(*) AS cnt, n FROM (
                SELECT (t2.t).lexeme AS lexeme, n AS n FROM (
                    SELECT unnest(t) AS t, n AS n FROM (
                        SELECT to_tsvector(testo) AS t, count(*) OVER() AS n FROM docs
                    ) t1
                ) t2
            ) t3 GROUP BY lexeme, n
        ) t4;
        ```

**Note:** You may have different settings for postgres (such as host, user, password, and port). Please remember to update these settings in the `appRRF.py` and `appDBSF.py` files, specifically in the `connection` variable, otherwise you will not be able to use the database.

### Running the project
To view the project, run 
To start the local server and view the infographic, use the following command in your cmd (in the root of the current directory):
```bash 
python -m http.server
```
Next, you need to also start a local server for the chatbot functionality. Navigate to the `src/chatbot` directory and use the following command in your cmd:
```bash
python -m flask --app app[algorithm] run
```
Replace `[algorithm]` with either `DBSF` or `RRF` depending on the algorithm (Distribution-Based Score Fusion or Reciprocal Rank Fusion) you want to use. 
For this project, we recommend using `RRF`, as it is faster and performs comparably to `DBSF`.

After running these commands, open your browser and navigate to [http://localhost:8000](http://localhost:8000) (or any other port number specified by http.server).
