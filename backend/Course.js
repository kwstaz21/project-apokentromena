// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  // Προσοχή: Η MongoDB φτιάχνει αυτόματα _id. 
  // Θα το μετατρέπουμε σε 'id' όταν το στέλνουμε στο React.
  title: { type: String, required: true },
  shortDescription: String,
  description: String,
  keywords: [String], // Array από strings
  category: String,
  language: String,
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner' 
  },
  source: String,     // π.χ. 'OpenCourses.edu'
  sourceUrl: String,
  enrollUrl: String,
  lastUpdated: Date,  // Καλύτερα Date αντί για String για σωστή ταξινόμηση
  
  // Εδώ θα αποθηκεύει το Spark τα IDs των παρόμοιων μαθημάτων
  relatedCourseIds: [{ type: String }],
  
  // Cluster ID από το Spark ML clustering
  clusterId: { type: Number, default: null }
});

module.exports = mongoose.model('Course', CourseSchema);