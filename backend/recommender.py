import os
import sys
import tempfile
import numpy as np
from pymongo import MongoClient
from bson.objectid import ObjectId  # <--- Η ΣΗΜΑΝΤΙΚΗ ΔΙΟΡΘΩΣΗ ΕΔΩ
from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF, Normalizer

# --- ΡΥΘΜΙΣΕΙΣ ΓΙΑ WINDOWS & JAVA 17 ---


JAVA_HOME_PATH = r"C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot" 


import ctypes
def get_short_path_name(long_name):
    output_buf_size = 0
    while True:
        output_buf_size += 1024
        output_buf = ctypes.create_unicode_buffer(output_buf_size)
        needed = ctypes.windll.kernel32.GetShortPathNameW(long_name, output_buf, output_buf_size)
        if output_buf_size >= needed:
            return output_buf.value

try:
    if os.path.exists(JAVA_HOME_PATH):
        short_java_home = get_short_path_name(JAVA_HOME_PATH)
        os.environ["JAVA_HOME"] = short_java_home
        print(f" Ρυθμίστηκε το JAVA_HOME σε: {short_java_home}")
    else:
        print(f" ΠΡΟΣΟΧΗ: Δεν βρέθηκε ο φάκελος: {JAVA_HOME_PATH}")
        print("   Παρακαλώ διόρθωσε τη γραμμή 14 στο script!")
except Exception as e:
    print(f"Warning: Δεν μπορέσαμε να φτιάξουμε short path. {e}")
    os.environ["JAVA_HOME"] = JAVA_HOME_PATH

os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYSPARK_PYTHON"] = sys.executable
os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable

# Δημιουργία προσωρινού φακέλου για Hadoop
temp_dir = tempfile.mkdtemp()
os.environ["HADOOP_HOME"] = temp_dir

def calculate_recommendations():
    print(" Ξεκινάει το Spark Recommendation Job...")

    # Σύνδεση με MongoDB
    try:
        client = MongoClient("mongodb://127.0.0.1:27017/")
        db = client["coursesDB"]
        collection = db["courses"]
        if collection.count_documents({}) == 0:
            print(" Η βάση είναι άδεια! Τρέξε πρώτα το 'node importData.js'.")
            return
    except Exception as e:
        print(f" Σφάλμα Mongo: {e}")
        return

    print(" Ανάγνωση δεδομένων από MongoDB...")
    cursor = collection.find({}, {"_id": 1, "title": 1, "description": 1, "keywords": 1})
    data = []
    for doc in cursor:
        keywords = " ".join(doc.get("keywords", [])) if doc.get("keywords") else ""
        text = f"{doc.get('title','')} {doc.get('description','')} {keywords}".lower()
        data.append((str(doc["_id"]), text))

    # Ρυθμίσεις Spark
    print(" Εκκίνηση Spark Session...")
    try:
        spark = SparkSession.builder \
            .appName("CourseRecommender") \
            .master("local[*]") \
            .config("spark.driver.host", "127.0.0.1") \
            .config("spark.driver.bindAddress", "127.0.0.1") \
            .config("spark.ui.enabled", "false") \
            .config("spark.driver.extraJavaOptions", "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED") \
            .getOrCreate()
        spark.sparkContext.setLogLevel("ERROR")
    except Exception as e:
        print("❌ Σφάλμα Spark.")
        print(e)
        return

    # ML Pipeline
    df = spark.createDataFrame(data, ["id", "text"])
    print(f" Επεξεργασία {df.count()} μαθημάτων...")

    tokenizer = Tokenizer(inputCol="text", outputCol="words")
    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=5000)
    idf = IDF(inputCol="rawFeatures", outputCol="features")
    normalizer = Normalizer(inputCol="features", outputCol="normFeatures")

    pipeline_data = normalizer.transform(
        idf.fit(hashingTF.transform(remover.transform(tokenizer.transform(df))))
        .transform(hashingTF.transform(remover.transform(tokenizer.transform(df))))
    )

    print(" Υπολογισμός Cosine Similarity...")
    rows = pipeline_data.select("id", "normFeatures").collect()
    ids = [row['id'] for row in rows]
    vectors = [row['normFeatures'].toArray() for row in rows]
    matrix = np.array(vectors)
    similarity_matrix = np.dot(matrix, matrix.T)

    print(" Ενημέρωση βάσης...")
    updates = 0
    for i, course_id in enumerate(ids):
        scores = similarity_matrix[i]
        top_indices = np.argsort(scores)[::-1][1:6]
        related_ids = [ids[idx] for idx in top_indices]
        
        # --- Η ΔΙΟΡΘΩΣΗ ΕΙΝΑΙ ΕΔΩ ---
        collection.update_one(
            {"_id": ObjectId(course_id)}, # Χρησιμοποιούμε το ObjectId που κάναμε import
            {"$set": {"relatedCourseIds": related_ids}}
        )
        updates += 1
        if updates % 1000 == 0: print(f"   ... {updates} done")

    print(f"🎉 ΤΕΛΟΣ! Ενημερώθηκαν {updates} μαθήματα με recommendations.")
    spark.stop()

if __name__ == "__main__":
    calculate_recommendations()