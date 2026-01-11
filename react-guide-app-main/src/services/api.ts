// API service για επικοινωνία με το backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  category: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  sourceUrl: string;
  enrollUrl: string;
  lastUpdated: string;
  relatedCourseIds?: string[];
  clusterId?: number | null;
}

// Interface για pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// Interface για filter parameters
export interface CourseFilters {
  language?: string;
  level?: string;
  source?: string;
  category?: string;
  search?: string;
  clusterId?: string;
}

// Fetch μαθημάτων με pagination και filtering
export const fetchCoursesPaginated = async (
  page: number = 1, 
  limit: number = 20,
  filters?: CourseFilters
): Promise<PaginatedResponse<Course>> => {
  // Φτιάχνουμε το query string με filters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters) {
    if (filters.language && filters.language !== 'all') {
      params.append('language', filters.language);
    }
    if (filters.level && filters.level !== 'all') {
      params.append('level', filters.level);
    }
    if (filters.source && filters.source !== 'all') {
      params.append('source', filters.source);
    }
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.clusterId && filters.clusterId !== 'all') {
      params.append('clusterId', filters.clusterId);
    }
    if (filters.search && filters.search.trim() !== '') {
      params.append('search', filters.search.trim());
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/courses?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  }
  
  const result: PaginatedResponse<Course> = await response.json();
  
  if (result.data && Array.isArray(result.data) && result.pagination) {
    return result;
  }
  
  throw new Error('Unexpected response format from API');
};

// Fetch όλων των μαθημάτων (backward compatibility - φορτώνει όλα)
export const fetchCourses = async (): Promise<Course[]> => {
  // Φορτώνουμε όλα τα μαθήματα - κάνουμε requests σε όλες τις σελίδες
  let allCourses: Course[] = [];
  let currentPage = 1;
  let hasMore = true;
  const pageLimit = 100; // Μαθήματα ανά σελίδα
  
  while (hasMore) {
    const response = await fetch(`${API_BASE_URL}/api/courses?page=${currentPage}&limit=${pageLimit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }
    
    const result: PaginatedResponse<Course> = await response.json();
    
    if (result.data && Array.isArray(result.data)) {
      allCourses = [...allCourses, ...result.data];
      
      // Αν φορτώσαμε λιγότερα από το limit, σημαίνει ότι είμαστε στην τελευταία σελίδα
      if (result.data.length < pageLimit || currentPage >= result.pagination.totalPages) {
        hasMore = false;
      } else {
        currentPage++;
      }
    } else {
      throw new Error('Unexpected response format from API');
    }
  }
  
  return allCourses;
};

// Fetch ενός συγκεκριμένου μαθήματος
export const fetchCourseById = async (id: string): Promise<Course> => {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Course not found');
    }
    throw new Error(`Failed to fetch course: ${response.statusText}`);
  }
  
  return response.json();
};

// Interface για filter options
export interface FilterOptions {
  categories: string[];
  languages: string[];
  sources: string[];
  clusterIds: number[];
}

// Fetch filter options (categories, languages, sources)
export const fetchFilterOptions = async (): Promise<FilterOptions> => {
  const response = await fetch(`${API_BASE_URL}/api/filters`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch similar courses για ένα συγκεκριμένο μάθημα (Spark-based recommendations)
export const fetchSimilarCourses = async (courseId: string): Promise<Course[]> => {
  const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/similar`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Course not found');
    }
    throw new Error(`Failed to fetch similar courses: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data || [];
};

// Trigger harvesting από συγκεκριμένη πηγή
export const triggerSync = async (source: string): Promise<{ success: boolean; message: string; source: string; timestamp: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/sync/${source}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to trigger sync: ${response.statusText}`);
  }
  
  return response.json();
};

