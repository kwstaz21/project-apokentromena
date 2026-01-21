Project Setup & Execution
Ακολουθήστε τα παρακάτω βήματα για να εγκαταστήσετε και να τρέξετε την εφαρμογή.

1. Εγκατάσταση
Αρχικά, εγκαταστήστε τις απαραίτητες βιβλιοθήκες της Python:


pip install -r requirements.txt 

2. Προετοιμασία Δεδομένων
Εισάγετε τα δεδομένα εκτελώντας το παρακάτω script:


node importData.js 

3. Machine Learning (Spark)
Εκτελέστε τα scripts επεξεργασίας δεδομένων:


Recommender: python spark/recommender.py 


Clustering: python spark/clustering.py 

4. Εκκίνηση Εφαρμογής
Τρέξτε την εφαρμογή (Backend και Frontend):


Server: npm start 

Frontend: npm run dev