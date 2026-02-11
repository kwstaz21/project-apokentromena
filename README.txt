Project Setup & Execution
Ακολουθήστε τα παρακάτω βήματα για να τρέξετε την εφαρμογή.

(Προαιρετικά) Δημιουργία & Ενεργοποίηση Virtual Environment
Δημιουργία:
    python -m venv venv

Ενεργοποίηση:
Mac/Linux:
    source venv/bin/activate

Windows:
    venv\Scripts\activate

1. Εγκατάσταση
Αρχικά, εγκαταστήστε τις απαραίτητες βιβλιοθήκες της Python:

    pip install -r requirements.txt 

2. Προετοιμασία Δεδομένων
Εισάγετε τα δεδομένα στη βάση εκτελώντας το παρακάτω script:

    node importData.js 

3. Machine Learning (Spark)
Εκτελέστε τα scripts επεξεργασίας δεδομένων:

Recommender: 
    python backend/spark/recommender.py 

Clustering: 
    python backend/spark/clustering.py 

4. Εκκίνηση Εφαρμογής
Τρέξτε την εφαρμογή (Backend και Frontend):

Server: 
    cd .\backend
    npm start 

Frontend: 
    cd .\react-guide-app-main
    npm run dev





Project Setup & Execution
Follow the steps below to run the application.

(Optional) Create & Activate Virtual Environment
Create: 
    python -m venv venv

Activate: 
Mac/Linux:
    source venv/bin/activate

Windows:
    venv\Scripts\activate


1.  Installation

First, install the required Python libraries:

    pip install -r requirements.txt

2.  Data Preparation

Import the data into the database by running the following script:

    node importData.js

3.  Machine Learning (Spark)

Run the data processing scripts:

Recommender: 
    python backend/spark/recommender.py

Clustering: 
    python backend/spark/clustering.py

4.  Start the Application

Run the application (Backend and Frontend):

Server: 
    cd .\backend
    npm start 

Frontend: 
    cd .\react-guide-app-main
    npm run dev