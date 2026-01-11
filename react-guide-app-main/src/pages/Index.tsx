import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { CourseFilters, Filters } from "@/components/CourseFilters";
import { CourseCard } from "@/components/CourseCard";
import { Pagination } from "@/components/Pagination";
import { fetchCoursesPaginated, fetchFilterOptions } from "@/services/api";
import { GraduationCap, Loader2 } from "lucide-react";

const COURSES_PER_PAGE = 20;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    language: "all",
    level: "all",
    source: "all",
    category: "all",
    clusterId: "all"
  });

  // Fetch courses από το backend API με pagination και filtering
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses', currentPage, COURSES_PER_PAGE, filters, searchQuery],
    queryFn: () => fetchCoursesPaginated(currentPage, COURSES_PER_PAGE, {
      ...filters,
      search: searchQuery,
    }),
    staleTime: 5 * 60 * 1000, // Cache για 5 λεπτά
  });

  // Fetch filter options (categories, languages, sources, clusterIds)
  const { data: filterOptions = { categories: [], languages: [], sources: [], clusterIds: [] } } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: fetchFilterOptions,
    staleTime: 10 * 60 * 1000, // Cache για 10 λεπτά (αλλάζουν σπάνια)
  });

  const courses = coursesData?.data || [];
  const pagination = coursesData?.pagination;

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset στην πρώτη σελίδα όταν αλλάζουν τα filters
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      language: "all",
      level: "all",
      source: "all",
      category: "all",
      clusterId: "all"
    });
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset στην πρώτη σελίδα όταν αλλάζει το search
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== "all").length;
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white py-12 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Course Aggregator</h1>
          </div>
          <p className="text-lg opacity-90 max-w-2xl">
            Ανακαλύψτε χιλιάδες ανοικτά μαθήματα από διάφορες πλατφόρμες σε μία ενιαία πύλη
          </p>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-card border-b border-border py-8 shadow-sm">
        <div className="container mx-auto px-4">
          <SearchBar 
            value={searchQuery} 
            onChange={handleSearchChange}
            placeholder="Αναζήτηση με βάση τίτλο, λέξεις-κλειδιά, περιγραφή..."
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <CourseFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                activeFiltersCount={activeFiltersCount}
                categories={filterOptions.categories}
                languages={filterOptions.languages}
                sources={filterOptions.sources}
                clusterIds={filterOptions.clusterIds}
              />
            </div>
          </aside>

          {/* Courses Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Φόρτωση μαθημάτων...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-lg text-destructive mb-2">
                  Σφάλμα κατά τη φόρτωση των μαθημάτων
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Βεβαιωθείτε ότι ο server τρέχει στο http://localhost:5001
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    {courses.length} Μαθήματ{courses.length === 1 ? 'α' : 'α'}
                    {pagination && (
                      <span className="text-lg font-normal text-muted-foreground ml-2">
                        (Σελίδα {pagination.currentPage} από {pagination.totalPages})
                      </span>
                    )}
                  </h2>
                  {pagination && (
                    <p className="text-sm text-muted-foreground">
                      {pagination.totalItems} συνολικά μαθήματα
                    </p>
                  )}
                </div>

                {courses.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-lg text-muted-foreground mb-2">
                  Δεν βρέθηκαν μαθήματα με τα επιλεγμένα κριτήρια
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση
                </p>
                  <button
                    onClick={handleClearFilters}
                    className="text-primary hover:underline font-medium"
                  >
                    Καθαρισμός όλων των φίλτρων
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map(course => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                  
                  {pagination && pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">
            Course Aggregator - Οριζόντιο Repository Ανοικτών Μαθημάτων
          </p>
          <p className="text-xs mt-2">
            Powered by React & Apache Spark | Project 2 - 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
