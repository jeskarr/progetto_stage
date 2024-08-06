# AUTHOR: Fabio Meneghini https://github.com/FabioMeneghini

import psycopg2
import txtai

class DBAccess:
    def __init__(self, host, database, user, password, port):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port
        self.connection = None
        self.connect()

    def connect(self):
        if self.connection:
            return
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                port=self.port
            )
        except (Exception, psycopg2.Error) as error:
            print(f"Error connecting to the database: {error}")
            return None
    
    def close_connection(self):
        if self.connection:
            self.connection.close()
            print("Database connection closed.")
    
    def get_bm25_rank(self, keywords):
        if not self.connection:
            return None
        keywords = keywords.replace(" ", " | ") # sostituisce gli spazi con l'operatore OR
        safe_input = psycopg2.extensions.adapt(keywords).getquoted().decode('latin-1') # sanifica input
        try:
            cursor = self.connection.cursor()
            BM25_RANK_QUERY = f"""
                with query as (
                    select to_tsquery({safe_input}) as qq
                ),
                adoc as (
                    select avg(array_length(tsvector_to_array(to_tsvector(testo)), 1)) as avglen from docs
                )
                select codice, bm25rank, (select testo from docs where t5.codice=docs.codice), section from (
                    select codice, sum(ff) as bm25rank, section from (
                        select codice, section, t3.lexeme, f,doclen, (select avglen from adoc) as avglen, idf.idf, idf.idf*f*2.5/(f+1.5*(1-0.75+0.75*doclen/(select avglen from adoc))) as ff from (
                            select codice, (t2.t).lexeme as lexeme, array_length((t2.t).positions, 1) as f, doclen, section from (
                                select codice, unnest(t) as t, array_length(tsvector_to_array(testo), 1) as doclen, section from (
                                    select codice, to_tsvector(testo) as testo, section, ts_delete(
                                        to_tsvector(testo),
                                        tsvector_to_array(ts_delete(to_tsvector(testo), array(
                                            select unnest(string_to_array(replace(qq::text, '''', ''), ' | ')))))) AS t
                                    from docs, query where to_tsvector(testo) @@ (select qq from query)
                                ) t1
                            ) t2 where (t2.t).lexeme @@ (select qq from query)
                        ) t3 left outer join idf on t3.lexeme=idf.lexeme
                    ) t4 group by codice, section order by 2 desc
                ) t5 LIMIT 20;
            """
            #print(BM25_RANK_QUERY)
            cursor.execute(BM25_RANK_QUERY)
            result = cursor.fetchall()
            return result
        except (Exception, psycopg2.Error) as error:
            return f"Error fetching BM25 rank: {error}"
        finally:
            cursor.close()
    
    def get_embeddings_rank(self, input, model_path):
        safe_input = psycopg2.extensions.adapt(input).getquoted().decode('latin-1') # sanifica input
        embeddings = txtai.Embeddings(path=model_path, content=True)
        vector = embeddings.transform(safe_input).tolist()
        try:
            cursor = self.connection.cursor()
            EMBEDDIGS_RANK_QUERY = f"SELECT codice, vettore <=> '{vector}' as score, testo, section FROM docs ORDER BY score LIMIT 20;"
            cursor.execute(EMBEDDIGS_RANK_QUERY)
            result = cursor.fetchall()
            return result
        except (Exception, psycopg2.Error) as error:
            return f"Error fetching embeddings rank: {error}"
        finally:
            cursor.close()
    
    def reload_idf(self):
        pass

    def calculate_embeddings(self, model_path):
        if not self.connection:
            return "No connection to the database."
        try:
            print("Calculating embeddings...")
            cursor = self.connection.cursor()
            cursor.execute("select codice, testo from docs;")
            result = cursor.fetchall()
            embeddings = txtai.Embeddings(path=model_path, content=True)
            for row in result:
                vector = embeddings.transform(row[1]).tolist()
                cursor.execute("update docs set vettore = %s where codice = %s;", (vector, row[0]))
            self.connection.commit()
            print("Embeddings calculated and stored successfully.")
        except (Exception, psycopg2.Error) as error:
            return f"Error reloading embeddings: {error}"
        finally:
            cursor.close()