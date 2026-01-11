const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Course = require("./models/Course");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Σύνδεση στη Βάση (Local)
mongoose
  .connect("mongodb://localhost:27017/coursesDB")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// API Endpoints
// Επιστροφή όλων των μαθημάτων
// GET /api/courses με Pagination και Filtering
app.get('/api/courses', async (req, res) => {
  try {
    // 1. Διαβάζουμε τη σελίδα που ζητάει το React (αν δεν ζητήσει, δίνουμε την 1η)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // 20 μαθήματα ανά σελίδα
    const skip = (page - 1) * limit;

    // 2. Διαβάζουμε τα filters από το query string
    const { language, level, source, category, search, clusterId } = req.query;

    // 3. Φτιάχνουμε το MongoDB query object για filtering
    const query = {};
    
    if (language && language !== 'all') {
      query.language = language;
    }
    
    if (level && level !== 'all') {
      query.level = level;
    }
    
    if (source && source !== 'all') {
      query.source = source;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (clusterId && clusterId !== 'all') {
      const clusterIdNum = parseInt(clusterId);
      if (!isNaN(clusterIdNum)) {
        query.clusterId = clusterIdNum;
      }
    }

    // 4. Αν υπάρχει search query, προσθέτουμε text search στο query object
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { keywords: { $in: [searchRegex] } }
      ];
    }

    // 5. Μετράμε πόσα μαθήματα υπάρχουν μετά το filtering
    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limit);

    // 6. Ζητάμε από τη MongoDB τα φιλτραρισμένα μαθήματα με pagination
    const courses = await Course.find(query)
      .skip(skip)
      .limit(limit);

    // 4. Μορφοποίηση των δεδομένων (όπως το είχες)
    const formattedCourses = courses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      keywords: course.keywords,
      category: course.category,
      language: course.language,
      level: course.level,
      source: course.source,
      sourceUrl: course.sourceUrl,
      enrollUrl: course.enrollUrl,
      lastUpdated: course.lastUpdated ? course.lastUpdated.toISOString().split('T')[0] : '',
      relatedCourseIds: course.relatedCourseIds || [],
      clusterId: course.clusterId !== null && course.clusterId !== undefined ? course.clusterId : null
    }));

    // 5. Στέλνουμε πίσω τα μαθήματα ΜΑΖΙ με πληροφορίες σελιδοποίησης
    res.json({
      data: formattedCourses,      // Τα 20 μαθήματα
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCourses
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Επιστροφή μοναδικών κατηγοριών και γλωσσών για τα φίλτρα
app.get("/api/filters", async (req, res) => {
  try {
    // Παίρνουμε όλες τις μοναδικές κατηγορίες
    const categories = await Course.distinct("category").then(cats => 
      cats.filter(cat => cat && cat.trim() !== "").sort()
    );
    
    // Παίρνουμε όλες τις μοναδικές γλώσσες
    const languages = await Course.distinct("language").then(langs => 
      langs.filter(lang => lang && lang.trim() !== "").sort()
    );
    
    // Παίρνουμε όλες τις μοναδικές πηγές
    const sources = await Course.distinct("source").then(srcs => 
      srcs.filter(src => src && src.trim() !== "").sort()
    );
    
    // Παίρνουμε όλα τα μοναδικά cluster IDs (μόνο όσα δεν είναι null)
    const clusterIds = await Course.distinct("clusterId").then(ids => 
      ids.filter(id => id !== null && id !== undefined)
         .map(id => Number(id))
         .sort((a, b) => a - b)
    );

    res.json({
      categories,
      languages,
      sources,
      clusterIds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Επιστροφή ενός συγκεκριμένου μαθήματος βάσει id
app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Προστασία: αν το id δεν είναι έγκυρο ObjectId, επιστρέφουμε 400 αντί να "σκάει" η Mongo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const formattedCourse = {
      id: course._id.toString(),
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      keywords: course.keywords,
      category: course.category,
      language: course.language,
      level: course.level,
      source: course.source,
      sourceUrl: course.sourceUrl,
      enrollUrl: course.enrollUrl,
      lastUpdated: course.lastUpdated
        ? course.lastUpdated.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      relatedCourseIds: course.relatedCourseIds || [],
      clusterId: course.clusterId !== null && course.clusterId !== undefined ? course.clusterId : null
    };

    res.json(formattedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Επιστροφή παρόμοιων μαθημάτων βάσει Spark ML recommendations
// GET /api/courses/:id/similar
app.get("/api/courses/:id/similar", async (req, res) => {
  try {
    const { id } = req.params;

    // Προστασία: αν το id δεν είναι έγκυρο ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    // Βρίσκουμε το μάθημα
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Παίρνουμε τα relatedCourseIds από το Spark ML (αποθηκευμένα στο course)
    const relatedCourseIds = course.relatedCourseIds || [];

    if (relatedCourseIds.length === 0) {
      return res.json({
        data: [],
        message: "No similar courses found"
      });
    }

    // Βρίσκουμε τα παρόμοια μαθήματα
    // Αν τα IDs είναι ObjectIds, τα μετατρέπουμε
    const relatedCourses = await Course.find({
      $or: [
        { _id: { $in: relatedCourseIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) } },
        { _id: { $in: relatedCourseIds } }
      ]
    }).limit(10); // Περιορίζουμε σε 10 παρόμοια μαθήματα

    // Μορφοποίηση των δεδομένων
    const formattedCourses = relatedCourses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      keywords: course.keywords,
      category: course.category,
      language: course.language,
      level: course.level,
      source: course.source,
      sourceUrl: course.sourceUrl,
      enrollUrl: course.enrollUrl,
      lastUpdated: course.lastUpdated ? course.lastUpdated.toISOString().split("T")[0] : '',
      relatedCourseIds: course.relatedCourseIds || [],
      clusterId: course.clusterId !== null && course.clusterId !== undefined ? course.clusterId : null
    }));

    res.json({
      data: formattedCourses,
      count: formattedCourses.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Trigger harvesting από συγκεκριμένη πηγή
// POST /api/sync/:source
app.post("/api/sync/:source", async (req, res) => {
  try {
    const { source } = req.params;

    // Εδώ θα καλείται το harvesting script για τη συγκεκριμένη πηγή
    // Για τώρα, επιστρέφουμε success message
    // Στο μέλλον, μπορείτε να προσθέσετε integration με το harvesting script
    
    console.log(`Harvesting triggered for source: ${source}`);

    // TODO: Ενσωμάτωση με το harvesting script
    // Π.χ.:
    // const harvestScript = require('./harvesters/' + source);
    // await harvestScript.harvest();

    res.json({
      success: true,
      message: `Harvesting started for source: ${source}`,
      source: source,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//http://localhost:5001/api/courses
