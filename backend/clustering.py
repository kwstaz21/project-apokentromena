import os
import sys
import tempfile
from pymongo import MongoClient
from bson.objectid import ObjectId
from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF, Normalizer
from pyspark.ml.clustering import KMeans

# --- ΡΥΘΜΙΣΕΙΣ ΓΙΑ WINDOWS & JAVA 17 ---


JAVA_HOME_PATH = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot"



# 2. Τρικ για να μην κολλάει στα κενά του "Program Files"
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

def perform_clustering(num_clusters=15, seed=42):
    """
    Ομαδοποίηση μαθημάτων σε clusters βάσει θεματικού περιεχομένου.
    
    Args:
        num_clusters: Αριθμός clusters (default: 15)
                     - Για 5 κατηγορίες: 15 clusters = ~3 sub-clusters ανά κατηγορία
                     - Για 7200 μαθήματα: 15-20 clusters είναι καλή αρχή
        seed: Random seed για αναπαραγωγιμότητα (default: 42)
    """
    print(" Ξεκινάει το Spark Clustering Job...")
    print(f" Αριθμός clusters: {num_clusters}")

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
            .appName("CourseClustering") \
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

    # ML Pipeline για feature extraction
    df = spark.createDataFrame(data, ["id", "text"])
    print(f" Επεξεργασία {df.count()} μαθημάτων...")

    tokenizer = Tokenizer(inputCol="text", outputCol="words")
    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=5000)
    idf = IDF(inputCol="rawFeatures", outputCol="features")
    normalizer = Normalizer(inputCol="features", outputCol="normFeatures")

    # Feature extraction pipeline
    pipeline_data = normalizer.transform(
        idf.fit(hashingTF.transform(remover.transform(tokenizer.transform(df))))
        .transform(hashingTF.transform(remover.transform(tokenizer.transform(df))))
    )

    print(" Εκπαίδευση KMeans clustering model...")
    # KMeans Clustering
    kmeans = KMeans(
        featuresCol="normFeatures",
        predictionCol="clusterId",
        k=num_clusters,
        seed=seed,
        maxIter=20
    )
    
    model = kmeans.fit(pipeline_data)
    
    # Προβλέπουμε τα clusters για κάθε μάθημα
    clustered_data = model.transform(pipeline_data)
    
    print(" Ενημέρωση βάσης με cluster IDs...")
    # Συλλογή των αποτελεσμάτων
    results = clustered_data.select("id", "clusterId").collect()
    
    updates = 0
    for row in results:
        course_id = row['id']
        cluster_id = int(row['clusterId'])  # Μετατρέπουμε σε int
        
        # Ενημέρωση του μαθήματος με το clusterId
        collection.update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {"clusterId": cluster_id}}
        )
        updates += 1
        if updates % 100 == 0:
            print(f"   ... {updates} μαθήματα ενημερώθηκαν")

    # Υπολογισμός στατιστικών clusters
    cluster_counts = {}
    for row in results:
        cluster_id = int(row['clusterId'])
        cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1

    print(f"\n📊 Στατιστικά Clusters:")
    for cluster_id in sorted(cluster_counts.keys()):
        print(f"   Cluster {cluster_id}: {cluster_counts[cluster_id]} μαθήματα")

    # Υπολογισμός WSSSE (Within Set Sum of Squared Errors)
    wssse = model.summary.trainingCost
    print(f"\n📈 WSSSE (Within Set Sum of Squared Errors): {wssse:.2f}")

    print(f"\n🎉 ΤΕΛΟΣ! Ενημερώθηκαν {updates} μαθήματα με cluster IDs.")
    spark.stop()
    return wssse

def find_optimal_clusters(min_k=5, max_k=30, step=2, seed=42):
    """
    Elbow Method: Βρίσκει τον βέλτιστο αριθμό clusters δοκιμάζοντας διαφορετικές τιμές.
    
    Args:
        min_k: Ελάχιστος αριθμός clusters (default: 5)
        max_k: Μέγιστος αριθμός clusters (default: 30)
        step: Βήμα μεταξύ των τιμών (default: 2)
        seed: Random seed για αναπαραγωγιμότητα (default: 42)
    """
    print("=" * 60)
    print(" 🔍 ELBOW METHOD: Αναζήτηση βέλτιστου αριθμού clusters")
    print("=" * 60)
    
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
            .appName("CourseClusteringElbow") \
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

    # ML Pipeline για feature extraction (μία φορά)
    df = spark.createDataFrame(data, ["id", "text"])
    print(f" Επεξεργασία {df.count()} μαθημάτων...")

    tokenizer = Tokenizer(inputCol="text", outputCol="words")
    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=5000)
    idf = IDF(inputCol="rawFeatures", outputCol="features")
    normalizer = Normalizer(inputCol="features", outputCol="normFeatures")

    # Feature extraction pipeline (μία φορά)
    pipeline_data = normalizer.transform(
        idf.fit(hashingTF.transform(remover.transform(tokenizer.transform(df))))
        .transform(hashingTF.transform(remover.transform(tokenizer.transform(df))))
    )

    # Δοκιμή διαφορετικών αριθμών clusters
    results = []
    k_values = list(range(min_k, max_k + 1, step))
    
    print(f"\n📊 Δοκιμή {len(k_values)} διαφορετικών αριθμών clusters: {k_values}")
    print("-" * 60)
    
    for k in k_values:
        print(f" 🔄 Δοκιμή με {k} clusters...", end=" ")
        try:
            kmeans = KMeans(
                featuresCol="normFeatures",
                predictionCol="clusterId",
                k=k,
                seed=seed,
                maxIter=20
            )
            model = kmeans.fit(pipeline_data)
            wssse = model.summary.trainingCost
            results.append((k, wssse))
            print(f"WSSSE: {wssse:.2f}")
        except Exception as e:
            print(f"Σφάλμα: {e}")
            continue

    spark.stop()

    if not results:
        print("❌ Δεν βρέθηκαν αποτελέσματα!")
        return

    # Εμφάνιση αποτελεσμάτων
    print("\n" + "=" * 60)
    print(" 📈 ΑΠΟΤΕΛΕΣΜΑΤΑ ELBOW METHOD:")
    print("=" * 60)
    print(f"{'Clusters':<12} {'WSSSE':<15} {'Διαφορά':<15} {'% Μείωση':<15}")
    print("-" * 60)
    
    for i, (k, wssse) in enumerate(results):
        if i == 0:
            diff = 0
            pct_reduction = 0
        else:
            diff = results[i-1][1] - wssse
            pct_reduction = (diff / results[i-1][1]) * 100 if results[i-1][1] > 0 else 0
        print(f"{k:<12} {wssse:<15.2f} {diff:<15.2f} {pct_reduction:<15.2f}%")

    # Εύρεση του "elbow point" (σημείο όπου η μείωση του WSSSE αρχίζει να επιβραδύνεται)
    print("\n" + "=" * 60)
    print(" 💡 ΣΥΜΒΟΥΛΕΣ:")
    print("=" * 60)
    
    if len(results) >= 2:
        # Υπολογισμός rate of change
        reductions = []
        for i in range(1, len(results)):
            prev_wssse = results[i-1][1]
            curr_wssse = results[i][1]
            reduction = prev_wssse - curr_wssse
            reductions.append((results[i][0], reduction))
        
        # Βρίσκουμε το σημείο όπου η μείωση αρχίζει να μειώνεται σημαντικά
        if len(reductions) >= 2:
            reduction_rates = []
            for i in range(1, len(reductions)):
                prev_reduction = reductions[i-1][1]
                curr_reduction = reductions[i][1]
                if prev_reduction > 0:
                    rate_change = ((prev_reduction - curr_reduction) / prev_reduction) * 100
                    reduction_rates.append((reductions[i][0], rate_change))
            
            # Το elbow point είναι όπου η rate of change είναι μεγάλη (σημαίνει ότι η μείωση επιβραδύνεται)
            if reduction_rates:
                # Βρίσκουμε το σημείο με τη μεγαλύτερη επιβράδυνση
                elbow_point = max(reduction_rates, key=lambda x: x[1])
                print(f" 🎯 Προτεινόμενος αριθμός clusters: {elbow_point[0]}")
                print(f"    (Σημείο όπου η μείωση WSSSE επιβραδύνεται σημαντικά)")
        
        # Εμφάνιση των 3 καλύτερων επιλογών
        print(f"\n 📊 Top 3 επιλογές (βάσει WSSSE):")
        sorted_results = sorted(results, key=lambda x: x[1])
        for i, (k, wssse) in enumerate(sorted_results[:3], 1):
            print(f"    {i}. {k} clusters - WSSSE: {wssse:.2f}")
    
    print(f"\n 💡 Για να τρέξεις clustering με συγκεκριμένο αριθμό:")
    print(f"    python clustering.py [αριθμός_clusters]")
    print("=" * 60)

if __name__ == "__main__":
    # Ελέγχουμε αν θέλει να τρέξει Elbow Method
    if len(sys.argv) > 1 and sys.argv[1] == "--elbow":
        # Elbow Method: βρίσκει τον βέλτιστο αριθμό clusters
        min_k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        max_k = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        step = int(sys.argv[4]) if len(sys.argv) > 4 else 2
        find_optimal_clusters(min_k=min_k, max_k=max_k, step=step)
    else:
        
        num_clusters = int(sys.argv[1]) if len(sys.argv) > 1 else 15
        perform_clustering(num_clusters=num_clusters)

