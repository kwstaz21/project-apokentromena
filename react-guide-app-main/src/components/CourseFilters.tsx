import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface Filters {
  language: string;
  level: string;
  source: string;
  category: string;
  clusterId: string;
}

interface CourseFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  categories: string[];
  languages: string[];
  sources: string[];
  clusterIds: number[];
}

export const CourseFilters = React.memo(({
  filters,
  onFilterChange,
  onClearFilters,
  activeFiltersCount,
  categories,
  languages,
  sources,
  clusterIds,
}: CourseFiltersProps) => {
  const handleLanguageChange = useCallback((value: string) => {
    onFilterChange("language", value);
  }, [onFilterChange]);

  const handleLevelChange = useCallback((value: string) => {
    onFilterChange("level", value);
  }, [onFilterChange]);

  const handleSourceChange = useCallback((value: string) => {
    onFilterChange("source", value);
  }, [onFilterChange]);

  const handleCategoryChange = useCallback((value: string) => {
    onFilterChange("category", value);
  }, [onFilterChange]);

  const handleClusterIdChange = useCallback((value: string) => {
    onFilterChange("clusterId", value);
  }, [onFilterChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Φίλτρα</CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Γλώσσα</label>
          <Select
            value={filters.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Όλες οι γλώσσες" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι γλώσσες</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Επίπεδο</label>
          <Select
            value={filters.level}
            onValueChange={handleLevelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Όλα τα επίπεδα" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλα τα επίπεδα</SelectItem>
              <SelectItem value="beginner">Αρχάριο</SelectItem>
              <SelectItem value="intermediate">Μεσαίο</SelectItem>
              <SelectItem value="advanced">Προχωρημένο</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Πηγή</label>
          <Select
            value={filters.source}
            onValueChange={handleSourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Όλες οι πηγές" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι πηγές</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Κατηγορία</label>
          <Select
            value={filters.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Όλες οι κατηγορίες" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι κατηγορίες</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cluster</label>
          <Select
            value={filters.clusterId}
            onValueChange={handleClusterIdChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Όλα τα clusters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλα τα clusters</SelectItem>
              {clusterIds.map((clusterId) => (
                <SelectItem key={clusterId} value={clusterId.toString()}>
                  Cluster {clusterId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
});

CourseFilters.displayName = "CourseFilters";

