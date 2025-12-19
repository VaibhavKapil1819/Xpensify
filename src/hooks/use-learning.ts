// hooks/use-learning.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  UserLearningPreferences,
  SavePreferencesRequest,
  LearningConversation,
  TopicRecommendation,
} from '@/types/learning-coach';
import type { Course } from '@/types/course';

// Query Keys
export const learningKeys = {
  all: ['learning'] as const,
  preferences: () => [...learningKeys.all, 'preferences'] as const,
  conversations: () => [...learningKeys.all, 'conversations'] as const,
  courses: () => [...learningKeys.all, 'courses'] as const,
  course: (id: string) => [...learningKeys.courses(), id] as const,
  recommendations: () => [...learningKeys.all, 'recommendations'] as const,
  progress: (courseId: string) => [...learningKeys.all, 'progress', courseId] as const,
};

// Preferences Hooks
export function useLearningPreferences() {
  return useQuery({
    queryKey: learningKeys.preferences(),
    queryFn: async () => {
      const response = await fetch('/api/learning/preferences');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch preferences');
      }
      const data = await response.json();
      
      // Handle database unavailable warning - return defaults
      if (data.warning) {
        console.warn('Database temporarily unavailable, using default preferences');
      }
      
      return data.preferences as UserLearningPreferences | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a database connection error
      if (error?.message?.includes('Database temporarily unavailable')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: SavePreferencesRequest) => {
      const response = await fetch('/api/learning/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      const data = await response.json();
      return data.preferences as UserLearningPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(learningKeys.preferences(), data);
      toast.success('Preferences saved! 🎉');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save preferences');
    },
  });
}

// Conversations Hooks
export function useConversations(limit = 50) {
  return useQuery({
    queryKey: [...learningKeys.conversations(), limit],
    queryFn: async () => {
      const response = await fetch(`/api/learning/conversations?limit=${limit}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch conversations');
      }
      const data = await response.json();
      
      // Handle database unavailable warning
      if (data.warning) {
        console.warn('Database temporarily unavailable:', data.warning);
      }
      
      return data.conversations as LearningConversation[];
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry if it's a database connection error
      if (error?.message?.includes('Database temporarily unavailable')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useClearConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/learning/conversations', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear conversations');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.conversations() });
      toast.success('Conversation history cleared');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear conversations');
    },
  });
}

// Courses Hooks
export function useCourses() {
  return useQuery({
    queryKey: learningKeys.courses(),
    queryFn: async () => {
      const response = await fetch('/api/learning/courses');
      if (!response.ok) {
        // If it's a server error, try to get the error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch courses');
      }
      const data = await response.json();
      
      // Handle database unavailable warning
      if (data.warning) {
        console.warn('Database temporarily unavailable:', data.warning);
      }
      
      return data.courses as Array<{
        id: string;
        title: string;
        description: string;
        difficulty: string;
        duration?: string;
        progress: number;
        completed: boolean;
        created_at: string;
        updated_at: string;
      }>;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry if it's a database connection error
      if (error?.message?.includes('Database temporarily unavailable')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCourse(courseId: string | null) {
  return useQuery({
    queryKey: learningKeys.course(courseId || ''),
    queryFn: async () => {
      if (!courseId) return null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`/api/learning/courses/${courseId}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to fetch course');
        }

        const data = await response.json();
        
        if (!data.success || !data.course) {
          throw new Error('Invalid course data received');
        }

        // Validate course structure
        const course = data.course;
        if (!course.title || !course.modules || !Array.isArray(course.modules)) {
          throw new Error('Course data is missing required fields');
        }

        // The API now returns merged course data
        return course as Course & {
          id: string;
          progress: number;
          completed: boolean;
          createdAt: string;
          updatedAt: string;
        };
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    },
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });
}

export function useSaveCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: Course) => {
      const response = await fetch('/api/learning/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save course');
      }

      const data = await response.json();
      return data.course as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.courses() });
      toast.success('Course saved! 📚');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save course');
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await fetch(`/api/learning/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.courses() });
      toast.success('Course deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete course');
    },
  });
}

export function useUpdateCourseProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      progress,
      courseData,
    }: {
      courseId: string;
      progress: number;
      courseData?: Course;
    }) => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`/api/learning/courses/${courseId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            progress, 
            // Only include course_data if provided (to avoid large payloads)
            ...(courseData && { course_data: courseData })
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to update progress');
        }

        const data = await response.json();
        return data.course;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // If courseData was provided, update the cache with the full course data
      if (variables.courseData) {
        queryClient.setQueryData(learningKeys.course(variables.courseId), {
          ...variables.courseData,
          id: variables.courseId,
          progress: variables.progress,
          completed: variables.progress >= 100,
        });
      } else {
        // Otherwise, just update progress
        queryClient.setQueryData(learningKeys.course(variables.courseId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            progress: variables.progress,
            completed: variables.progress >= 100,
          };
        });
      }
      // Invalidate to ensure consistency and refetch
      queryClient.invalidateQueries({ queryKey: learningKeys.course(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: learningKeys.courses() });
    },
    onError: (error: Error) => {
      console.error('Progress update error:', error);
      toast.error(error.message || 'Failed to update progress');
    },
  });
}

// Recommendations Hooks
export function useRecommendations() {
  return useQuery({
    queryKey: learningKeys.recommendations(),
    queryFn: async () => {
      const response = await fetch('/api/learning/recommendations');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }
      const data = await response.json();
      
      // Handle database unavailable warning
      if (data.warning) {
        console.warn('Database temporarily unavailable:', data.warning);
      }
      
      return data.recommendations as TopicRecommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a database connection error
      if (error?.message?.includes('Database temporarily unavailable')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/learning/recommendations', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      return data.recommendations as TopicRecommendation[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(learningKeys.recommendations(), data);
      toast.success('Recommendations generated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate recommendations');
    },
  });
}

