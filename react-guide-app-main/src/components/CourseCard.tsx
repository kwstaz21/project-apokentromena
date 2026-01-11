import React, { useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Globe } from "lucide-react";
import { Course } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  course: Course;
}

const levelLabels = {
  beginner: 'Αρχάριο',
  intermediate: 'Μεσαίο',
  advanced: 'Προχωρημένο'
};

const levelColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export const CourseCard = React.memo(({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/course/${course.id}`);
  }, [navigate, course.id]);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-border bg-card animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {course.category}
          </Badge>
          <div className="flex gap-2">
            {course.clusterId !== null && course.clusterId !== undefined && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                Cluster {course.clusterId}
              </Badge>
            )}
            <Badge className={`text-xs ${levelColors[course.level]}`}>
              {levelLabels[course.level]}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-xl line-clamp-2 text-foreground">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-muted-foreground">
          {course.shortDescription}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{course.language}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">{course.source}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-4">
          {course.keywords.slice(0, 3).map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleClick}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Προβολή Λεπτομερειών
        </Button>
      </CardFooter>
    </Card>
  );
});

CourseCard.displayName = "CourseCard";
