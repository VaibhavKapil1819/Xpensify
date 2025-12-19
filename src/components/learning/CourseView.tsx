'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Sparkles,
  X,
  Home,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { useUpdateCourseProgress } from '@/hooks/use-learning';
import type { Course, Module as CourseModule, Lesson, Quiz, Question } from '@/types/course';

interface CourseViewProps {
  course: Course;
  courseId: string;
  onBack: () => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  course,
  courseId,
  onBack,
}) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [courseState, setCourseState] = useState<Course>(course);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState<Map<string, string>>(new Map());
  const [noteInput, setNoteInput] = useState('');

  const updateProgress = useUpdateCourseProgress();

  // Update course state when course prop changes and merge with saved progress
  useEffect(() => {
    if (course && course.modules && Array.isArray(course.modules)) {
      // Merge course data with any saved progress from database
      // The course prop already has progress merged from API, but ensure lesson/module completion is preserved
      setCourseState(course);

      // Load notes from course data
      const notesMap = new Map<string, string>();
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          // Check if lesson has a note property (stored in course_data)
          if ((lesson as any).note) {
            const noteKey = `${module.id}-${lesson.id}`;
            notesMap.set(noteKey, (lesson as any).note);
          }
        });
      });
      setUserNotes(notesMap);

      // Reset to first incomplete lesson if available
      const firstIncompleteModule = course.modules.find(mod =>
        !mod.locked && mod.lessons.some(lesson => !lesson.completed)
      );
      if (firstIncompleteModule) {
        const firstIncompleteLessonIndex = firstIncompleteModule.lessons.findIndex(lesson => !lesson.completed);
        if (firstIncompleteLessonIndex >= 0) {
          const moduleIndex = course.modules.indexOf(firstIncompleteModule);
          setCurrentModuleIndex(moduleIndex);
          setCurrentLessonIndex(firstIncompleteLessonIndex);
        }
      }
    }
  }, [course]);

  // Safety check for course data
  if (!courseState || !courseState.modules || !Array.isArray(courseState.modules) || courseState.modules.length === 0) {
    return (
      <div className="min-h-screen mac-bg flex items-center justify-center">
        <Card className="mac-card p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 mac-text-primary">Course Data Error</h2>
            <p className="mac-text-secondary mb-4">
              The course data is invalid or incomplete. Please try refreshing or contact support.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentModule = courseState.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];

  // Get completion status directly from current course state to ensure it updates
  const lessonCompletionStatus = currentLesson?.completed || false;

  // Calculate total lessons and progress from current course state
  const calculateProgress = (course: Course): number => {
    const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const completedLessons = course.modules.reduce(
      (acc, mod) => acc + mod.lessons.filter(l => l.completed).length,
      0
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Calculate total lessons for display
  const totalLessons = courseState.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const overallProgress = calculateProgress(courseState);

  // Debounced progress save to avoid too many API calls
  const saveProgress = React.useCallback(
    async (updatedCourse: Course, includeCourseData = false) => {
      const progress = calculateProgress(updatedCourse);

      try {
        await updateProgress.mutateAsync({
          courseId,
          progress,
          // Only send course_data when explicitly needed (e.g., module unlock)
          courseData: includeCourseData ? updatedCourse : undefined,
        });
      } catch (error) {
        console.error('Error saving progress:', error);
        toast.error('Failed to save progress. Please try again.');
      }
    },
    [courseId, updateProgress]
  );

  const goToNextLesson = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setShowHint(false);
      setShowExplanation(null);
    } else if (currentModuleIndex < courseState.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
      setShowHint(false);
      setShowExplanation(null);
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setShowHint(false);
      setShowExplanation(null);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      const prevModule = courseState.modules[currentModuleIndex - 1];
      setCurrentLessonIndex(prevModule.lessons.length - 1);
      setShowHint(false);
      setShowExplanation(null);
    }
  };

  const handleLessonComplete = async () => {
    if (!currentLesson) return;

    // Create a completely new course object to ensure React detects the change
    const updatedCourse: Course = {
      ...courseState,
      modules: courseState.modules.map((module, modIdx) => {
        if (modIdx === currentModuleIndex) {
          return {
            ...module,
            lessons: module.lessons.map((lesson, lesIdx) => {
              if (lesIdx === currentLessonIndex) {
                return { ...lesson, completed: true }; // Create new object with completed flag
              }
              return lesson;
            }),
          };
        }
        return module;
      }),
    };

    // Update state immediately for UI responsiveness
    setCourseState(updatedCourse);

    // Save progress - include full course data to persist lesson completion
    try {
      await saveProgress(updatedCourse, true); // Include course data to save lesson completion
      toast.success('Lesson completed! ✅');

      // Small delay to ensure state update is visible before navigation
      setTimeout(() => {
        goToNextLesson();
      }, 500);
    } catch (error) {
      console.error('Error saving progress:', error);
      // Revert the UI change if save fails
      setCourseState(courseState);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const handleQuizComplete = (score: number) => {
    const updatedCourse: Course = {
      ...courseState,
      modules: courseState.modules.map((module, modIdx) =>
        modIdx === currentModuleIndex && module.quiz
          ? {
            ...module,
            quiz: { ...module.quiz, completed: true, score },
            completed: true,
          }
          : module
      ),
    };

    setCourseState(updatedCourse);

    // Check if we need to unlock next module
    const shouldUnlockNext = score >= (currentModule.quiz?.passingScore || 70) &&
      currentModuleIndex < courseState.modules.length - 1;

    if (shouldUnlockNext) {
      const updatedCourseUnlocked: Course = {
        ...updatedCourse,
        modules: updatedCourse.modules.map((module, modIdx) =>
          modIdx === currentModuleIndex + 1
            ? { ...module, locked: false }
            : module
        ),
      };
      setCourseState(updatedCourseUnlocked);
      // Save with course data when unlocking modules
      saveProgress(updatedCourseUnlocked, true);
      toast.success(`Quiz passed with ${score}%! 🎉 Next module unlocked!`);
    } else {
      // Just save progress without full course data
      saveProgress(updatedCourse, false);
      if (score >= (currentModule.quiz?.passingScore || 70)) {
        toast.success(`Quiz passed with ${score}%! 🎉`);
      } else {
        toast.info(`You scored ${score}%. Try again to pass!`);
      }
    }
    setShowQuiz(false);
  };

  const saveNote = async () => {
    if (!noteInput.trim() || !currentLesson) return;
    const noteKey = `${currentModule.id}-${currentLesson.id}`;
    const updatedNotes = new Map(userNotes);
    updatedNotes.set(noteKey, noteInput);
    setUserNotes(updatedNotes);

    // Save note to course data in database
    try {
      // Update course data with notes
      const updatedCourse: Course = {
        ...courseState,
        modules: courseState.modules.map((module, modIdx) => {
          if (modIdx === currentModuleIndex) {
            return {
              ...module,
              lessons: module.lessons.map((lesson, lesIdx) => {
                if (lesIdx === currentLessonIndex) {
                  return {
                    ...lesson,
                    // Store note in lesson
                    note: noteInput,
                  };
                }
                return lesson;
              }),
            };
          }
          return module;
        }),
      };

      // Update local state immediately
      setCourseState(updatedCourse);

      // Save to database with course data
      await saveProgress(updatedCourse, true);
      setNoteInput('');
      toast.success('Note saved! 📝');
    } catch (error) {
      console.error('Error saving note:', error);
      // Still keep it in local state even if save fails
      setNoteInput('');
      toast.error('Note saved locally but failed to sync. Please try again.');
    }
  };

  const currentNote = useMemo(() => {
    if (!currentLesson) return '';
    // First check if lesson has a saved note property
    if (currentLesson.note) {
      return currentLesson.note;
    }
    // Fallback to local state
    const noteKey = `${currentModule.id}-${currentLesson.id}`;
    return userNotes.get(noteKey) || '';
  }, [currentModule, currentLesson, userNotes]);

  // Update note input when lesson changes
  useEffect(() => {
    if (currentNote) {
      setNoteInput(currentNote);
    } else {
      setNoteInput('');
    }
  }, [currentNote]);

  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Learn</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {courseState.title}
            </span>
          </nav>

          {/* Sticky Back Button - Appears on scroll */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={onBack}
              size="lg"
              className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Chat</span>
              <ArrowLeft className="w-5 h-5 sm:hidden" />
            </Button>
          </div>

          {/* Main Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Learn Chat</span>
            </Button>
          </div>
        </div>

        <Card className="mac-card p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {courseState.difficulty}
                </Badge>
                {courseState.duration && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {courseState.duration}
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2 mac-text-primary">
                {courseState.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {courseState.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">
                    {courseState.modules.length} Modules
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">
                    {totalLessons} Lessons
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallProgress / 100)}`}
                    className="text-blue-600 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(overallProgress)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Overall Progress
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Module Navigation */}
        <div className="lg:col-span-1">
          <Card className="mac-card p-4 sticky top-4">
            {/* Sidebar Back Button */}
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full mb-4 justify-start text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back to Chat</span>
            </Button>

            <h3 className="font-semibold mb-4 mac-text-primary">Course Modules</h3>
            <div className="space-y-2">
              {courseState.modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => {
                    if (!module.locked) {
                      setCurrentModuleIndex(index);
                      setCurrentLessonIndex(0);
                      setShowQuiz(false);
                      setShowHint(false);
                      setShowExplanation(null);
                    }
                  }}
                  disabled={module.locked}
                  className={`w-full text-left p-3 rounded-lg transition-all ${currentModuleIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${module.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {module.locked ? (
                        <Lock className="w-4 h-4 text-gray-400" />
                      ) : module.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mac-text-primary truncate">
                        {module.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={module.lessons.every(l => l.completed) ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                          {module.lessons.filter(l => l.completed).length}/{module.lessons.length} lessons
                        </span>
                        {module.lessons.every(l => l.completed) && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 ml-1" />
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card className="mac-card p-6">
            {!showQuiz ? (
              <LessonContent
                lesson={currentLesson}
                module={currentModule}
                onComplete={handleLessonComplete}
                onNext={goToNextLesson}
                onPrevious={goToPreviousLesson}
                hasPrevious={currentModuleIndex > 0 || currentLessonIndex > 0}
                hasNext={
                  currentModuleIndex < courseState.modules.length - 1 ||
                  currentLessonIndex < currentModule.lessons.length - 1
                }
                onStartQuiz={() => setShowQuiz(true)}
                showQuizButton={
                  currentLessonIndex === currentModule.lessons.length - 1 &&
                  !!currentModule.quiz
                }
                showHint={showHint}
                onToggleHint={() => setShowHint(!showHint)}
                showExplanation={showExplanation}
                onToggleExplanation={(index) => setShowExplanation(showExplanation === index ? null : index)}
                currentNote={currentNote}
                noteInput={noteInput}
                onNoteInputChange={setNoteInput}
                onSaveNote={saveNote}
                lessonCompleted={lessonCompletionStatus}
              />
            ) : (
              <InteractiveQuizView
                quiz={currentModule.quiz!}
                onComplete={handleQuizComplete}
                onBack={() => setShowQuiz(false)}
              />
            )}
          </Card>
        </div>
      </div>
    </div>

  );
};

// Enhanced Lesson Content Component with Interactive Features
const LessonContent: React.FC<{
  lesson: Lesson;
  module: CourseModule;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onStartQuiz: () => void;
  showQuizButton: boolean;
  showHint: boolean;
  onToggleHint: () => void;
  showExplanation: number | null;
  onToggleExplanation: (index: number) => void;
  currentNote: string;
  noteInput: string;
  onNoteInputChange: (value: string) => void;
  onSaveNote: () => void;
  lessonCompleted: boolean;
}> = ({
  lesson,
  module,
  onComplete,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  onStartQuiz,
  showQuizButton,
  showHint,
  onToggleHint,
  showExplanation,
  onToggleExplanation,
  currentNote,
  noteInput,
  onNoteInputChange,
  onSaveNote,
  lessonCompleted,
}) => {
    return (
      <div className="space-y-6">
        {/* Lesson Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{module.title}</Badge>
            {lesson.duration && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {lesson.duration}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold mac-text-primary">{lesson.title}</h2>
        </div>

        {/* Interactive Tutor Assistant */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 mac-text-primary">Your AI Tutor</h3>
              <p className="text-sm mac-text-secondary mb-3">
                Need help? I'm here to guide you through this lesson!
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleHint}
                  className="text-xs"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  {showHint ? 'Hide Hint' : 'Get Hint'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleExplanation(0)}
                  className="text-xs"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {showExplanation === 0 ? 'Hide Explanation' : 'Explain More'}
                </Button>
              </div>
              {showHint && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Hint:</strong> Focus on understanding the key concepts before moving forward. Take your time to read through each section carefully.
                  </p>
                </div>
              )}
              {showExplanation === 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📚 <strong>Explanation:</strong> This lesson covers fundamental concepts that build the foundation for more advanced topics. Make sure you understand each point before proceeding.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Lesson Content */}
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {lesson.content}
          </div>
        </div>

        {/* Examples */}
        {lesson.examples && lesson.examples.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mac-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Real-Life Examples
            </h3>
            {lesson.examples.map((example, index) => (
              <Card key={index} className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2 mac-text-primary">{example.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {example.description}
                    </p>
                    {example.scenario && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 italic">
                        {example.scenario}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExplanation(index + 1)}
                    className="ml-2"
                  >
                    {showExplanation === index + 1 ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <HelpCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {showExplanation === index + 1 && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm mac-text-secondary">
                      This example demonstrates how the concept applies in real-world scenarios. Notice how the principles we discussed are put into practice here.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Key Takeaways */}
        {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mac-text-primary flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Key Takeaways
            </h3>
            <ul className="space-y-2">
              {lesson.keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resources */}
        {lesson.resources && lesson.resources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mac-text-primary mb-3">
              Additional Resources
            </h3>
            <div className="grid gap-2">
              {lesson.resources.map((resource, index) => {
                // Check if resource has a direct URL
                const hasDirectUrl = resource.url &&
                  (resource.url.startsWith('http://') || resource.url.startsWith('https://'));

                // For articles without URLs, show a message instead of search
                if (resource.type === 'article' && !hasDirectUrl) {
                  return (
                    <Card key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {resource.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium mac-text-primary">{resource.title}</p>
                          {resource.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {resource.description}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                            💡 Search for this article in your browser or ask the AI coach for the link
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                }

                // For videos and resources with URLs, use direct navigation
                const resourceUrl = hasDirectUrl ? resource.url : (() => {
                  if (resource.type === 'video') {
                    // Search YouTube for the title
                    const searchQuery = encodeURIComponent(resource.title);
                    return `https://www.youtube.com/results?search_query=${searchQuery}`;
                  } else {
                    // For other types, show message
                    return null;
                  }
                })();

                if (!resourceUrl) {
                  return (
                    <Card key={index} className="p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {resource.type}
                        </Badge>
                        <span className="font-medium mac-text-primary">{resource.title}</span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {resource.description}
                        </p>
                      )}
                    </Card>
                  );
                }

                return (
                  <a
                    key={index}
                    href={resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {resource.type}
                      </Badge>
                      <span className="font-medium mac-text-primary flex-1">{resource.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                    )}
                    {!hasDirectUrl && resource.type === 'video' && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Opens YouTube search
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <h3 className="text-lg font-semibold mac-text-primary mb-3">My Notes</h3>
          {currentNote && (
            <Card className="p-3 mb-2 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <p className="text-sm mac-text-primary whitespace-pre-wrap">{currentNote}</p>
            </Card>
          )}
          <div className="flex gap-2">
            <Input
              value={noteInput}
              onChange={(e) => onNoteInputChange(e.target.value)}
              placeholder="Add your notes here..."
              className="flex-1"
            />
            <Button onClick={onSaveNote} disabled={!noteInput.trim()}>
              Save Note
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {showQuizButton && (
              <Button
                onClick={onStartQuiz}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Take Quiz
                <Award className="w-4 h-4 ml-2" />
              </Button>
            )}
            {!lessonCompleted && (
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {lessonCompleted && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Completed</span>
              </div>
            )}
            {hasNext && (
              <Button onClick={onNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

// Enhanced Interactive Quiz View
const InteractiveQuizView: React.FC<{
  quiz: Quiz;
  onComplete: (score: number) => void;
  onBack: () => void;
}> = ({ quiz, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showExplanations, setShowExplanations] = useState<Set<number>>(new Set());
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set());

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const correct = quiz.questions.filter(
        (q, i) => answers[i] === q.correctAnswer
      ).length;
      const score = (correct / quiz.questions.length) * 100;
      setShowResults(true);
    }
  };

  const handleFinish = () => {
    const correct = quiz.questions.filter(
      (q, i) => answers[i] === q.correctAnswer
    ).length;
    const score = (correct / quiz.questions.length) * 100;
    onComplete(score);
  };

  const toggleExplanation = (questionIndex: number) => {
    const newSet = new Set(showExplanations);
    if (newSet.has(questionIndex)) {
      newSet.delete(questionIndex);
    } else {
      newSet.add(questionIndex);
    }
    setShowExplanations(newSet);
  };

  const useHint = () => {
    if (!hintsUsed.has(currentQuestion)) {
      setHintsUsed(new Set([...hintsUsed, currentQuestion]));
      toast.info('💡 Hint: Read each option carefully and eliminate obviously wrong answers first.');
    }
  };

  if (showResults) {
    const correct = quiz.questions.filter(
      (q, i) => answers[i] === q.correctAnswer
    ).length;
    const score = (correct / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}>
            {passed ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <Circle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2 mac-text-primary">
            {passed ? 'Congratulations! 🎉' : 'Keep Learning! 📚'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You scored {Math.round(score)}% ({correct} out of {quiz.questions.length} correct)
          </p>

          {/* Review Section */}
          <div className="space-y-4 mt-8 text-left">
            <h3 className="font-semibold mac-text-primary">Review Your Answers</h3>
            {quiz.questions.map((question, index) => {
              const isCorrect = answers[index] === question.correctAnswer;
              return (
                <Card key={index} className={`p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium mac-text-primary">{question.question}</p>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <Circle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-sm mac-text-secondary mb-2">
                    Your answer: {question.options[answers[index]] || 'Not answered'}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Correct answer: {question.options[question.correctAnswer]}
                    </p>
                  )}
                  {question.explanation && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExplanation(index)}
                        className="text-xs"
                      >
                        {showExplanations.has(index) ? 'Hide' : 'Show'} Explanation
                      </Button>
                      {showExplanations.has(index) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={onBack}>
              Back to Lesson
            </Button>
            <Button onClick={handleFinish}>
              {passed ? 'Continue' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge>Question {currentQuestion + 1} of {quiz.questions.length}</Badge>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={useHint}
              disabled={hintsUsed.has(currentQuestion)}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Hint
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
        <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} className="mb-4" />
        <h3 className="text-xl font-semibold mac-text-primary">{question.question}</h3>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion] === index
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion] === index
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
                }`}>
                {answers[currentQuestion] === index && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="mac-text-primary">{option}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={answers[currentQuestion] === undefined}
        >
          {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default CourseView;
