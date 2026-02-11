const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Course = require('./Course');

// Σύνδεση στη MongoDB (127.0.0.1 για Mac)
mongoose.connect('mongodb://127.0.0.1:27017/coursesDB')
  .then(() => console.log(' Συνδέθηκε επιτυχώς στη MongoDB'))
  .catch(err => console.error(' Σφάλμα σύνδεσης:', err));

// --- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ---

// Καθαρισμός Επιπέδου (Level)
const normalizeLevel = (text) => {
  if (!text) return 'beginner';
  const lower = text.toLowerCase();
  
  if (lower.includes('begin') || lower.includes('intro')) return 'beginner';
  if (lower.includes('interm')) return 'intermediate';
  if (lower.includes('advan') || lower.includes('expert')) return 'advanced';
  
  return 'beginner'; // Default
};

// --- CONNECTOR 1: UDEMY ---
// (Στήλες: course_title, url, level, subject, content_duration, κλπ.)
const importUdemy = () => {
  return new Promise((resolve) => {
    const courses = [];
    console.log(' Διάβασμα Udemy CSV...');
    
    if (!fs.existsSync('udemy.csv')) {
        console.log(' Το udemy.csv δεν βρέθηκε, παραλείπεται.');
        resolve();
        return;
    }

    fs.createReadStream('udemy.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Κατασκευή περιγραφής (επειδή το Udemy dataset δεν έχει κείμενο)
        const desc = `Learn ${row.subject} in this comprehensive course. Duration: ${row.content_duration} hours. Lectures: ${row.num_lectures}.`;
        
        courses.push({
          title: row.course_title,
          shortDescription: `Online course on ${row.subject} (${row.level})`,
          description: desc,
          keywords: [row.subject, 'Udemy', 'Finance'], // Το Udemy dataset σου είναι Finance
          category: row.subject,
          language: 'English',
          level: normalizeLevel(row.level),
          source: 'Udemy',
          sourceUrl: row.url,
          enrollUrl: row.url,
          lastUpdated: row.published_timestamp ? new Date(row.published_timestamp) : new Date(),
          relatedCourseIds: []
        });
      })
      .on('end', async () => {
        if (courses.length > 0) await Course.insertMany(courses);
        console.log(` Udemy: Προστέθηκαν ${courses.length} μαθήματα.`);
        resolve();
      });
  });
};

// --- CONNECTOR 2: COURSERA ---
// (Στήλες: Course Name, University, Difficulty Level, Course Rating, Course URL, Course Description, Skills)
const importCoursera = () => {
  return new Promise((resolve) => {
    const courses = [];
    console.log(' Διάβασμα Coursera CSV...');

    if (!fs.existsSync('coursera.csv')) {
        console.log(' Το coursera.csv δεν βρέθηκε, παραλείπεται.');
        resolve();
        return;
    }

    fs.createReadStream('coursera.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Χρησιμοποιούμε τα ακριβή ονόματα headers που μου έστειλες
        const title = row['Course Name'];
        const university = row['University'];
        const diffLevel = row['Difficulty Level'];
        const rating = row['Course Rating'];
        const url = row['Course URL'];
        const description = row['Course Description'];
        const skills = row['Skills'];

        // Καθαρισμός keywords (το csv τα έχει π.χ. "Python, Data, ML")
        let keywordList = ['Coursera', university];
        if (skills) {
            // Σπάμε τα skills με κόμμα και κρατάμε τα πρώτα 5 για να μην γεμίζει η βάση
            const skillArray = skills.split(',').map(s => s.trim()).slice(0, 5);
            keywordList = [...keywordList, ...skillArray];
        }

        courses.push({
          title: title,
          shortDescription: `Course by ${university} (${diffLevel})`,
          description: description || `Join this course by ${university}. Rated ${rating}/5.`,
          keywords: keywordList,
          category: 'Academic', 
          language: 'English',
          level: normalizeLevel(diffLevel),
          source: 'Coursera',
          sourceUrl: url,
          enrollUrl: url,
          lastUpdated: new Date(),
          relatedCourseIds: []
        });
      })
      .on('end', async () => {
        if (courses.length > 0) await Course.insertMany(courses);
        console.log(` Coursera: Προστέθηκαν ${courses.length} μαθήματα.`);
        resolve();
      });
  });
};

// --- Full Import ---
const run = async () => {
  try {
    console.log(' Καθαρισμός παλιάς βάσης...');
    await Course.deleteMany({});
    
    await importUdemy();     // Πηγή 1
    await importCoursera();  // Πηγή 2

    console.log(' ΟΛΑ ΕΤΟΙΜΑ! Το Harvesting ολοκληρώθηκε.');
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    mongoose.connection.close();
  }
};

run();