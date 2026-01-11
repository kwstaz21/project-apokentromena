import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCourseById, fetchSimilarCourses } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Calendar, Globe, BookOpen, Tag, Loader2 } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";

const levelLabels = {
  beginner: 'Αρχάριο',
  intermediate: 'Μεσαίο',
  advanced: 'Προχωρημένο'
};

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch το συγκεκριμένο μάθημα
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourseById(id!),
    enabled: !!id,
  });

  // Fetch παρόμοια μαθήματα από το Spark ML endpoint
  const { data: relatedCourses = [] } = useQuery({
    queryKey: ['similarCourses', id],
    queryFn: () => fetchSimilarCourses(id!),
    enabled: !!id && !!course,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Φόρτωση μαθήματος...</p>
        </div>
      </div>
    );
  }

  // Error state ή course not found
  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Το μάθημα δεν βρέθηκε</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Το μάθημα δεν υπάρχει'}
          </p>
          <Button onClick={() => navigate('/')}>Επιστροφή στην Αρχική</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Επιστροφή στα Μαθήματα
          </Button>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{course.category}</Badge>
            {course.clusterId !== null && course.clusterId !== undefined && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                Cluster {course.clusterId}
              </Badge>
            )}
            <Badge>{levelLabels[course.level]}</Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 text-foreground">{course.title}</h1>
          <p className="text-xl text-muted-foreground mb-6">{course.shortDescription}</p>
          
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{course.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{course.source}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Ενημερώθηκε: {new Date(course.lastUpdated).toLocaleDateString('el-GR')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Περιγραφή Μαθήματος</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Λέξεις-Κλειδιά
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {course.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {relatedCourses.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Σχετικά Μαθήματα
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    (μέσω Spark ML)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedCourses.map(relatedCourse => (
                    <CourseCard key={relatedCourse.id} course={relatedCourse} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ενέργειες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-primary text-white hover:opacity-90"
                  size="lg"
                  onClick={() => window.open(course.enrollUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Εγγραφή στο Μάθημα
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(course.sourceUrl, '_blank')}
                >
                  Επίσκεψη στην Πηγή
                </Button>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold mb-2 text-sm">Πληροφορίες</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Επίπεδο</dt>
                      <dd className="font-medium">{levelLabels[course.level]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Γλώσσα</dt>
                      <dd className="font-medium">{course.language}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Κατηγορία</dt>
                      <dd className="font-medium">{course.category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Πηγή</dt>
                      <dd className="font-medium">{course.source}</dd>
                    </div>
                    {course.clusterId !== null && course.clusterId !== undefined && (
                      <div>
                        <dt className="text-muted-foreground">Cluster ID</dt>
                        <dd className="font-medium">Cluster {course.clusterId}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetails;
