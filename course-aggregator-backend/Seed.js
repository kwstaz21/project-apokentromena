// seed.js
const mongoose = require('mongoose');
const Course = require('./models/Course');

// Σύνδεση στη MongoDB (αλλάξτε το URI με το δικό σας)
mongoose.connect('mongodb://localhost:27017/coursesDB')
  .then(() => console.log('Connected to Local MongoDB!'))
  .catch(err => console.error('Connection error:', err));

const mockCourses = [
  // ΚΑΝΤΕ COPY PASTE ΤΟΝ ΠΙΝΑΚΑ mockCourses ΑΠΟ ΤΟ REACT ΕΔΩ,
  // αλλά ΧΩΡΙΣ το πεδίο 'id' (η Mongo φτιάχνει μόνη της _id).
  {
    
    title: 'Introduction to Machine Learning',
    shortDescription: 'Μάθετε τα βασικά του Machine Learning με πρακτικά παραδείγματα',
    description: 'Ένα ολοκληρωμένο μάθημα εισαγωγής στο Machine Learning που καλύπτει βασικές έννοιες, αλγορίθμους και πρακτικές εφαρμογές. Μάθετε να χτίζετε μοντέλα πρόβλεψης, ταξινόμησης και ομαδοποίησης.',
    keywords: ['machine learning', 'AI', 'data science', 'python'],
    category: 'Computer Science',
    language: 'Ελληνικά',
    level: 'beginner',
    source: 'OpenCourses.edu',
    sourceUrl: 'https://opencourses.edu',
    enrollUrl: 'https://opencourses.edu/courses/ml-intro',
    lastUpdated: '2025-01-15',
    relatedCourseIds: ['2', '5']
  },
  {
   
    title: 'Deep Learning Fundamentals',
    shortDescription: 'Εξερευνήστε τα νευρωνικά δίκτυα και το deep learning',
    description: 'Προχωρημένο μάθημα Deep Learning που καλύπτει νευρωνικά δίκτυα, CNN, RNN, και σύγχρονες αρχιτεκτονικές. Περιλαμβάνει hands-on projects με TensorFlow και PyTorch.',
    keywords: ['deep learning', 'neural networks', 'AI', 'tensorflow', 'pytorch'],
    category: 'Computer Science',
    language: 'Αγγλικά',
    level: 'advanced',
    source: 'TechAcademy',
    sourceUrl: 'https://techacademy.io',
    enrollUrl: 'https://techacademy.io/deep-learning',
    lastUpdated: '2025-02-01',
    relatedCourseIds: ['1', '3']
  },
  {
    
    title: 'Web Development με React',
    shortDescription: 'Δημιουργήστε σύγχρονες web εφαρμογές με React',
    description: 'Μάθετε να δημιουργείτε δυναμικές web εφαρμογές χρησιμοποιώντας React, React Router, και modern JavaScript. Καλύπτει hooks, state management, και best practices.',
    keywords: ['react', 'javascript', 'web development', 'frontend'],
    category: 'Web Development',
    language: 'Ελληνικά',
    level: 'intermediate',
    source: 'CodeHub',
    sourceUrl: 'https://codehub.gr',
    enrollUrl: 'https://codehub.gr/react-course',
    lastUpdated: '2025-01-20',
    relatedCourseIds: ['4', '6']
  },
  {
    
    title: 'Introduction to Data Science',
    shortDescription: 'Ανακαλύψτε τον κόσμο της επιστήμης δεδομένων',
    description: 'Εισαγωγικό μάθημα Data Science που καλύπτει στατιστική ανάλυση, οπτικοποίηση δεδομένων, και βασικούς αλγορίθμους. Χρήση Python, pandas, και matplotlib.',
    keywords: ['data science', 'statistics', 'python', 'pandas', 'visualization'],
    category: 'Data Science',
    language: 'Ελληνικά',
    level: 'beginner',
    source: 'OpenCourses.edu',
    sourceUrl: 'https://opencourses.edu',
    enrollUrl: 'https://opencourses.edu/courses/data-science',
    lastUpdated: '2025-01-10',
    relatedCourseIds: ['1', '5']
  },
  {
  
    title: 'Big Data με Apache Spark',
    shortDescription: 'Επεξεργαστείτε μεγάλα δεδομένα με Spark',
    description: 'Μάθετε να χειρίζεστε και να αναλύετε μεγάλα σύνολα δεδομένων χρησιμοποιώντας Apache Spark. Καλύπτει Spark SQL, MLlib, και streaming.',
    keywords: ['big data', 'spark', 'distributed computing', 'scala'],
    category: 'Computer Science',
    language: 'Αγγλικά',
    level: 'advanced',
    source: 'TechAcademy',
    sourceUrl: 'https://techacademy.io',
    enrollUrl: 'https://techacademy.io/spark',
    lastUpdated: '2025-02-05',
    relatedCourseIds: ['1', '4']
  },
  {
    
    title: 'JavaScript για Αρχάριους',
    shortDescription: 'Ξεκινήστε τον προγραμματισμό με JavaScript',
    description: 'Μάθημα εισαγωγής στη JavaScript που καλύπτει τα βασικά της γλώσσας, DOM manipulation, και async programming. Ιδανικό για αρχάριους.',
    keywords: ['javascript', 'programming', 'web development', 'beginner'],
    category: 'Web Development',
    language: 'Ελληνικά',
    level: 'beginner',
    source: 'CodeHub',
    sourceUrl: 'https://codehub.gr',
    enrollUrl: 'https://codehub.gr/javascript',
    lastUpdated: '2025-01-25',
    relatedCourseIds: ['3']
  },
  {
    
    title: 'Mobile App Development με React Native',
    shortDescription: 'Φτιάξτε cross-platform mobile εφαρμογές',
    description: 'Αναπτύξτε native mobile εφαρμογές για iOS και Android χρησιμοποιώντας React Native. Μάθετε navigation, state management, και API integration.',
    keywords: ['react native', 'mobile development', 'ios', 'android'],
    category: 'Mobile Development',
    language: 'Αγγλικά',
    level: 'intermediate',
    source: 'TechAcademy',
    sourceUrl: 'https://techacademy.io',
    enrollUrl: 'https://techacademy.io/react-native',
    lastUpdated: '2025-01-18',
    relatedCourseIds: ['3']
  },
  {
    
    title: 'Cloud Computing με AWS',
    shortDescription: 'Μάθετε cloud computing και AWS υπηρεσίες',
    description: 'Ολοκληρωμένο μάθημα για AWS cloud services. Καλύπτει EC2, S3, Lambda, και serverless architectures. Περιλαμβάνει hands-on labs.',
    keywords: ['aws', 'cloud computing', 'devops', 'serverless'],
    category: 'Cloud & DevOps',
    language: 'Αγγλικά',
    level: 'intermediate',
    source: 'OpenCourses.edu',
    sourceUrl: 'https://opencourses.edu',
    enrollUrl: 'https://opencourses.edu/courses/aws',
    lastUpdated: '2025-02-10',
    relatedCourseIds: ['9']
  },
  {
    
    title: 'Docker και Kubernetes Essentials',
    shortDescription: 'Containerization και orchestration',
    description: 'Μάθετε να χρησιμοποιείτε Docker για containerization και Kubernetes για orchestration. Ιδανικό για DevOps engineers.',
    keywords: ['docker', 'kubernetes', 'devops', 'containers'],
    category: 'Cloud & DevOps',
    language: 'Ελληνικά',
    level: 'intermediate',
    source: 'CodeHub',
    sourceUrl: 'https://codehub.gr',
    enrollUrl: 'https://codehub.gr/docker-k8s',
    lastUpdated: '2025-01-30',
    relatedCourseIds: ['8']
  },
  {
   
    title: 'Cybersecurity Fundamentals',
    shortDescription: 'Βασικές αρχές κυβερνοασφάλειας',
    description: 'Εισαγωγή στην κυβερνοασφάλεια που καλύπτει network security, cryptography, και ethical hacking. Μάθετε να προστατεύετε συστήματα.',
    keywords: ['cybersecurity', 'security', 'networking', 'ethical hacking'],
    category: 'Security',
    language: 'Αγγλικά',
    level: 'beginner',
    source: 'TechAcademy',
    sourceUrl: 'https://techacademy.io',
    enrollUrl: 'https://techacademy.io/cybersecurity',
    lastUpdated: '2025-02-03',
    relatedCourseIds: []
  },
  {
    
    title: 'UI/UX Design Principles',
    shortDescription: 'Σχεδιάστε όμορφες και λειτουργικές διεπαφές',
    description: 'Μάθημα UI/UX design που καλύπτει design thinking, wireframing, prototyping, και user testing. Χρήση Figma και Adobe XD.',
    keywords: ['ui design', 'ux design', 'figma', 'prototyping'],
    category: 'Design',
    language: 'Ελληνικά',
    level: 'beginner',
    source: 'OpenCourses.edu',
    sourceUrl: 'https://opencourses.edu',
    enrollUrl: 'https://opencourses.edu/courses/ui-ux',
    lastUpdated: '2025-01-22',
    relatedCourseIds: ['3']
  },
  {
    
    title: 'Blockchain και Cryptocurrency',
    shortDescription: 'Κατανοήστε την τεχνολογία blockchain',
    description: 'Εξερευνήστε το blockchain, smart contracts, και cryptocurrency. Μάθετε να δημιουργείτε decentralized applications με Ethereum.',
    keywords: ['blockchain', 'cryptocurrency', 'ethereum', 'smart contracts'],
    category: 'Blockchain',
    language: 'Αγγλικά',
    level: 'advanced',
    source: 'TechAcademy',
    sourceUrl: 'https://techacademy.io',
    enrollUrl: 'https://techacademy.io/blockchain',
    lastUpdated: '2025-02-08',
    relatedCourseIds: []
  }
];

const seedDB = async () => {
  try {
    await Course.deleteMany({}); // Καθαρίζει τα παλιά

    // 1. Κάνουμε insert τα μαθήματα και κρατάμε τη σειρά τους
    const insertedCourses = await Course.insertMany(mockCourses);

    // 2. Φτιάχνουμε map από "παλιό id" (1,2,3...) -> πραγματικό Mongo _id
    const idMap = new Map();
    insertedCourses.forEach((course, index) => {
      const oldId = (index + 1).toString(); // '1', '2', '3', ...
      idMap.set(oldId, course._id.toString());
    });

    // 3. Ενημερώνουμε τα relatedCourseIds ώστε να δείχνουν σε πραγματικά Mongo IDs
    for (let index = 0; index < insertedCourses.length; index++) {
      const original = mockCourses[index];
      const doc = insertedCourses[index];

      if (original.relatedCourseIds && original.relatedCourseIds.length > 0) {
        const newRelated = original.relatedCourseIds
          .map(oldId => idMap.get(oldId))
          .filter(Boolean);

        doc.relatedCourseIds = newRelated;
        await doc.save();
      }
    }

    console.log("Database seeded with proper relatedCourseIds!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();