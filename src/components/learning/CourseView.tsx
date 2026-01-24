"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import { useUpdateCourseProgress } from "@/hooks/use-learning";
import type {
  Course,
  Module as CourseModule,
  Lesson,
  Quiz,
  Question,
} from "@/types/course";
import { buttonClassName, progressClassName } from "@/models/constants";

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
  const [noteInput, setNoteInput] = useState("");
  const [hintContent, setHintContent] = useState<string>("");
  const [explanationContent, setExplanationContent] = useState<string>("");
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);

  const updateProgress = useUpdateCourseProgress();

  // Fetch AI assistance using fetch API directly
  const fetchAIAssistance = async (
    lessonContent: string,
    lessonTitle: string,
    moduleTitle: string,
    requestType: "hint" | "elaborate",
    userNote?: string,
  ): Promise<string> => {
    try {
      const response = await fetch("/api/ai/lesson-assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonContent,
          lessonTitle,
          moduleTitle,
          requestType,
          userNote: userNote || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      // Handle text stream response (toTextStreamResponse format)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Text stream format: plain text chunks, no JSON wrapping
        result += chunk;
      }

      const finalResult = result.trim();
      if (!finalResult) {
        console.warn("No content extracted from stream");
      }

      return finalResult || "No response received. Please try again.";
    } catch (error: any) {
      console.error("Error fetching AI assistance:", error);
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error("API quota exceeded. Please try again later.");
      }
      throw error;
    }
  };

  useEffect(() => {
    if (course && course.modules && Array.isArray(course.modules)) {
      setCourseState(course);
      const notesMap = new Map<string, string>();
      course.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if ((lesson as any).note) {
            const noteKey = `${module.id}-${lesson.id}`;
            notesMap.set(noteKey, (lesson as any).note);
          }
        });
      });
      setUserNotes(notesMap);

      const firstIncompleteModule = course.modules.find(
        (mod) => !mod.locked && mod.lessons.some((lesson) => !lesson.completed),
      );
      if (firstIncompleteModule) {
        const firstIncompleteLessonIndex =
          firstIncompleteModule.lessons.findIndex(
            (lesson) => !lesson.completed,
          );
        if (firstIncompleteLessonIndex >= 0) {
          const moduleIndex = course.modules.indexOf(firstIncompleteModule);
          setCurrentModuleIndex(moduleIndex);
          setCurrentLessonIndex(firstIncompleteLessonIndex);
        }
      }
    }
  }, [course]);

  if (
    !courseState ||
    !courseState.modules ||
    courseState.modules.length === 0
  ) {
    return (
      <div className="min-h-screen mac-bg flex items-center justify-center">
        <Card className="mac-card p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4 mac-text-primary">
            Course Data Error
          </h2>
          <p className="mac-text-secondary mb-4">
            The course data is invalid or incomplete.
          </p>
          <Button onClick={onBack} variant="outline">
            Back to Chat
          </Button>
        </Card>
      </div>
    );
  }

  const currentModule = courseState.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];
  const lessonCompletionStatus = currentLesson?.completed || false;

  const calculateProgress = (course: Course): number => {
    const totalLessons = course.modules.reduce(
      (acc, mod) => acc + mod.lessons.length,
      0,
    );
    const completedLessons = course.modules.reduce(
      (acc, mod) => acc + mod.lessons.filter((l) => l.completed).length,
      0,
    );
    return totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  };

  const overallProgress = calculateProgress(courseState);

  const saveProgress = async (
    updatedCourse: Course,
    includeCourseData = false,
  ) => {
    const progress = calculateProgress(updatedCourse);
    try {
      await updateProgress.mutateAsync({
        courseId,
        progress,
        courseData: includeCourseData ? updatedCourse : undefined,
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress.");
    }
  };

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
    const updatedCourse: Course = {
      ...courseState,
      modules: courseState.modules.map((module, modIdx) => {
        if (modIdx === currentModuleIndex) {
          return {
            ...module,
            lessons: module.lessons.map((lesson, lesIdx) => {
              if (lesIdx === currentLessonIndex)
                return { ...lesson, completed: true };
              return lesson;
            }),
          };
        }
        return module;
      }),
    };

    setCourseState(updatedCourse);
    try {
      await saveProgress(updatedCourse, true);
      toast.success("Lesson completed! ✅");
      setTimeout(() => goToNextLesson(), 500);
    } catch (error) {
      setCourseState(courseState);
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
          : module,
      ),
    };

    const shouldUnlockNext =
      score >= (currentModule.quiz?.passingScore || 70) &&
      currentModuleIndex < courseState.modules.length - 1;

    if (shouldUnlockNext) {
      const updatedCourseUnlocked: Course = {
        ...updatedCourse,
        modules: updatedCourse.modules.map((module, modIdx) =>
          modIdx === currentModuleIndex + 1
            ? { ...module, locked: false }
            : module,
        ),
      };
      setCourseState(updatedCourseUnlocked);
      saveProgress(updatedCourseUnlocked, true);
      toast.success(`Passed with ${score}%! Next module unlocked!`);
    } else {
      setCourseState(updatedCourse);
      saveProgress(updatedCourse, true);
      if (score >= (currentModule.quiz?.passingScore || 70))
        toast.success(`Passed with ${score}%!`);
      else toast.info(`You scored ${score}%. Try again!`);
    }
    setShowQuiz(false);
  };

  const saveNote = async () => {
    if (!noteInput.trim() || !currentLesson) return;
    const noteKey = `${currentModule.id}-${currentLesson.id}`;
    const updatedNotes = new Map(userNotes);
    updatedNotes.set(noteKey, noteInput);
    setUserNotes(updatedNotes);

    const updatedCourse: Course = {
      ...courseState,
      modules: courseState.modules.map((module, modIdx) => {
        if (modIdx === currentModuleIndex) {
          return {
            ...module,
            lessons: module.lessons.map((lesson, lesIdx) => {
              if (lesIdx === currentLessonIndex)
                return { ...lesson, note: noteInput };
              return lesson;
            }),
          };
        }
        return module;
      }),
    };

    setCourseState(updatedCourse);
    await saveProgress(updatedCourse, true);
    setNoteInput("");
    toast.success("Note saved! 📝");
  };

  const currentNote = useMemo(() => {
    if (!currentLesson) return "";
    if (currentLesson.note) return currentLesson.note;
    const noteKey = `${currentModule.id}-${currentLesson.id}`;
    return userNotes.get(noteKey) || "";
  }, [currentModule, currentLesson, userNotes]);

  useEffect(() => {
    setNoteInput(currentNote || "");
  }, [currentNote]);

  // Reset hint/explanation when lesson changes
  useEffect(() => {
    setShowHint(false);
    setShowExplanation(null);
    setHintContent("");
    setExplanationContent("");
  }, [currentModuleIndex, currentLessonIndex]);

  const handleGetHint = async () => {
    if (!currentLesson || !currentModule) return;

    if (showHint && hintContent) {
      setShowHint(false);
      setHintContent("");
      return;
    }

    setLoadingHint(true);
    setShowHint(true);
    setHintContent("");

    try {
      const content = await fetchAIAssistance(
        currentLesson.content,
        currentLesson.title,
        currentModule.title,
        "hint",
        noteInput || undefined,
      );
      setHintContent(content);
    } catch (error) {
      console.error("Error requesting hint:", error);
      toast.error("Failed to get hint. Please try again.");
      setShowHint(false);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleGetExplanation = async () => {
    if (!currentLesson || !currentModule) return;

    if (showExplanation === 0 && explanationContent) {
      setShowExplanation(null);
      setExplanationContent("");
      return;
    }

    setLoadingExplanation(true);
    setShowExplanation(0);
    setExplanationContent("");

    try {
      const content = await fetchAIAssistance(
        currentLesson.content,
        currentLesson.title,
        currentModule.title,
        "elaborate",
        noteInput || undefined,
      );
      setExplanationContent(content);
    } catch (error) {
      console.error("Error requesting explanation:", error);
      toast.error("Failed to get explanation. Please try again.");
      setShowExplanation(null);
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <div className="min-h-screen mac-bg h-screen flex flex-col overflow-hidden">
      <DashboardNav />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Modern Immersive Sidebar */}
        <aside className="w-80 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col flex-shrink-0 animate-in slide-in-from-left duration-500">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button
              onClick={onBack}
              className="group mb-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              Course Catalog
            </button>
            <h1 className="text-lg font-extrabold mac-text-primary leading-tight mb-6">
              {courseState.title}
            </h1>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                <span className="text-gray-400 uppercase tracking-widest">
                  Progress
                </span>
                <span className="text-blue-600">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className={progressClassName} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 py-6">
            {courseState.modules.map((module, mIdx) => (
              <div key={module.id} className="space-y-1">
                <div className="px-3 mb-2 flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.15em] font-black text-gray-400">
                    Module {mIdx + 1}
                  </h3>
                  {module.completed && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  )}
                </div>

                <div className="space-y-1">
                  {module.lessons.map((lesson, lIdx) => {
                    const isActive =
                      mIdx === currentModuleIndex &&
                      lIdx === currentLessonIndex &&
                      !showQuiz;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (!module.locked) {
                            setCurrentModuleIndex(mIdx);
                            setCurrentLessonIndex(lIdx);
                            setShowQuiz(false);
                          }
                        }}
                        disabled={module.locked}
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left relative overflow-hidden group ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        } ${module.locked ? "opacity-30" : ""}`}
                      >
                        <div
                          className={`shrink-0 ${isActive ? "text-white" : lesson.completed ? "text-emerald-500" : "text-gray-300"}`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-sm tracking-tight truncate ${isActive ? "font-bold" : "font-semibold"}`}
                        >
                          {lesson.title}
                        </span>
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-40" />
                        )}
                      </button>
                    );
                  })}
                  {module.quiz && (
                    <button
                      onClick={() => {
                        if (!module.locked) {
                          setCurrentModuleIndex(mIdx);
                          setShowQuiz(true);
                        }
                      }}
                      disabled={module.locked}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left ${
                        showQuiz && mIdx === currentModuleIndex
                          ? "bg-blue-600 text-white shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                          : "text-gray-600 dark:text-gray-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 border border-transparent"
                      } ${module.locked ? "opacity-30" : ""}`}
                    >
                      <Award
                        className={`w-4 h-4 ${showQuiz && mIdx === currentModuleIndex ? "text-white" : module.quiz.completed ? "text-emerald-500" : "text-purple-400"}`}
                      />
                      <span
                        className={`text-sm tracking-tight ${showQuiz && mIdx === currentModuleIndex ? "font-bold" : "font-semibold"}`}
                      >
                        Assessment
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Focused Content Area - Two Column Layout */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950 relative">
          <div className="h-full flex">
            {!showQuiz ? (
              currentLesson && currentModule ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Main Content Area - Left Column (70%) */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="h-full px-8 py-12">
                      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <LessonContent
                          lesson={currentLesson}
                          module={currentModule}
                          showHint={showHint}
                          hintContent={hintContent}
                          loadingHint={loadingHint}
                          onToggleHint={handleGetHint}
                          showExplanation={showExplanation}
                          explanationContent={explanationContent}
                          loadingExplanation={loadingExplanation}
                          onToggleExplanation={handleGetExplanation}
                          noteInput={noteInput}
                          onNoteInputChange={setNoteInput}
                          onSaveNote={saveNote}
                          lessonCompleted={lessonCompletionStatus}
                          savedNotes={userNotes}
                          currentNoteKey={`${currentModule.id}-${currentLesson.id}`}
                          onToggleSavedNotes={() =>
                            setShowSavedNotes(!showSavedNotes)
                          }
                          showSavedNotes={showSavedNotes}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lesson Navigation Footer */}
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3">
                    <div className="max-w-7xl mx-auto">
                      <Card className="mac-card p-4 shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 flex flex-row items-center justify-between rounded-xl">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={goToPreviousLesson}
                          disabled={
                            currentModuleIndex === 0 && currentLessonIndex === 0
                          }
                          className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-20 shrink-0"
                        >
                          <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </Button>

                        <div className="flex flex-col items-center flex-1 mx-3 text-center shrink">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 leading-none">
                            Module {currentModuleIndex + 1} •{" "}
                            {currentLessonIndex + 1}/
                            {currentModule.lessons.length}
                          </span>
                          <span className="text-xs font-semibold mac-text-primary line-clamp-1 max-w-[180px] md:max-w-[350px] mt-0.5">
                            {currentLesson?.title || "Loading..."}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!lessonCompletionStatus ? (
                            <Button
                              onClick={handleLessonComplete}
                              className={buttonClassName}
                            >
                              <span className="hidden sm:inline">Complete</span>
                              <span className="sm:hidden">Done</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={goToNextLesson}
                              disabled={
                                currentModuleIndex ===
                                  courseState.modules.length - 1 &&
                                currentLessonIndex ===
                                  currentModule.lessons.length - 1
                              }
                              className={buttonClassName}
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold mac-text-primary mb-2">
                      Content Unavailable
                    </h3>
                    <p className="mac-text-secondary max-w-xs mx-auto text-sm">
                      The requested lesson content could not be found or is
                      currently being loaded.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-12">
                  {currentModule?.quiz ? (
                    <div className="animate-in zoom-in-95 fade-in duration-500">
                      <InteractiveQuizView
                        quiz={currentModule.quiz}
                        onComplete={handleQuizComplete}
                        onBack={() => setShowQuiz(false)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="mac-text-secondary font-bold">
                        Quiz not available for this module.
                      </p>
                      <Button
                        onClick={() => setShowQuiz(false)}
                        className={buttonClassName}
                      >
                        Back to Lesson
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const LessonContent: React.FC<{
  lesson: Lesson;
  module: CourseModule;
  showHint: boolean;
  hintContent: string;
  loadingHint: boolean;
  onToggleHint: () => void;
  showExplanation: number | null;
  explanationContent: string;
  loadingExplanation: boolean;
  onToggleExplanation: () => void;
  noteInput: string;
  onNoteInputChange: (value: string) => void;
  onSaveNote: () => void;
  lessonCompleted: boolean;
  savedNotes: Map<string, string>;
  currentNoteKey: string;
  onToggleSavedNotes: () => void;
  showSavedNotes: boolean;
}> = ({
  lesson,
  module,
  showHint,
  hintContent,
  loadingHint,
  onToggleHint,
  showExplanation,
  explanationContent,
  loadingExplanation,
  onToggleExplanation,
  noteInput,
  onNoteInputChange,
  onSaveNote,
  lessonCompleted,
  savedNotes,
  currentNoteKey,
  onToggleSavedNotes,
  showSavedNotes,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content Area - Left Column (70%) */}
      <div className="flex-1 lg:flex-[0.7] space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none font-semibold uppercase tracking-wider text-xs px-3 py-1">
              {module.title}
            </Badge>
            {lesson.duration && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{lesson.duration}</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mac-text-primary tracking-tight leading-tight">
            {lesson.title}
          </h1>
        </div>

        {/* Main Content Card */}
        <Card className="p-8 mac-card border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 rounded-2xl">
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {lesson.content}
            </div>
          </div>
        </Card>

        {/* Interactive Examples */}
        {lesson.examples && lesson.examples.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-lg font-semibold mac-text-primary uppercase tracking-wide text-sm">
                Deep Dive Examples
              </h3>
            </div>
            <div className="space-y-4">
              {lesson.examples.map((example, index) => (
                <Card
                  key={index}
                  className="p-6 mac-card border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 rounded-xl hover:shadow-md transition-shadow"
                >
                  <h4 className="text-base font-semibold mac-text-primary mb-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>
                    {example.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {example.description}
                  </p>
                  {example.scenario && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-sm text-blue-600 dark:text-blue-400 italic border border-blue-100 dark:border-blue-900/30">
                      "{example.scenario}"
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar (30%) - Sticky */}
      <div className="w-full lg:w-auto lg:flex-[0.3]">
        <div className="sticky top-6 space-y-6">
          {/* YOUR NOTE Section */}
          <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                YOUR NOTE
              </h4>
              {savedNotes.size > 0 && (
                <button
                  onClick={onToggleSavedNotes}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  {savedNotes.size} saved
                </button>
              )}
            </div>
            <textarea
              value={noteInput}
              onChange={(e) => onNoteInputChange(e.target.value)}
              placeholder="Write your observation..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[140px] mb-4"
            />
            <Button
              onClick={onSaveNote}
              disabled={!noteInput.trim()}
              className={buttonClassName}
            >
              Save Note
            </Button>

            {/* Saved Notes Display */}
            {showSavedNotes && savedNotes.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Saved Notes ({savedNotes.size})
                </h5>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {Array.from(savedNotes.entries()).map(([key, note]) => (
                    <div
                      key={key}
                      className={`p-2 rounded-lg text-xs bg-gray-50 dark:bg-white/5 border ${
                        key === currentNoteKey
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* AI TUTOR Section */}
          <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-none shadow-xl rounded-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
              <Sparkles className="w-full h-full" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider leading-none mb-1">
                    AI TUTOR
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase">
                      LIVE ASSISTANCE
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Get an instant perspective or a quick hint to clarify any
                confusion.
              </p>

              <div className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={onToggleHint}
                  disabled={loadingHint}
                  className={`w-full justify-start text-xs font-bold h-12 rounded-lg border-2 transition-all ${
                    showHint
                      ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-400"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                  } disabled:opacity-50`}
                >
                  {loadingHint ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      GET A HINT
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={onToggleExplanation}
                  disabled={loadingExplanation}
                  className={`w-full justify-start text-xs font-bold h-12 rounded-lg border-2 transition-all ${
                    showExplanation === 0
                      ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-500"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                  } disabled:opacity-50`}
                >
                  {loadingExplanation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      ELABORATE
                    </>
                  )}
                </Button>
              </div>

              {showHint && (
                <div className="mt-6 p-4 rounded-lg bg-white text-gray-900 animate-in slide-in-from-top-4 duration-300 shadow-lg">
                  {loadingHint ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      <p className="text-xs text-gray-600">
                        Getting your hint...
                      </p>
                    </div>
                  ) : hintContent ? (
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        {hintContent}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {showExplanation === 0 && (
                <div className="mt-6 p-4 rounded-lg bg-white text-gray-900 animate-in slide-in-from-top-4 duration-300 shadow-lg">
                  {loadingExplanation ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <p className="text-xs text-gray-600">
                        Getting explanation...
                      </p>
                    </div>
                  ) : explanationContent ? (
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        {explanationContent}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const InteractiveQuizView: React.FC<{
  quiz: Quiz;
  onComplete: (score: number) => void;
  onBack: () => void;
}> = ({ quiz, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1)
      setCurrentQuestion(currentQuestion + 1);
    else setShowResults(true);
  };

  if (showResults) {
    const correct = quiz.questions.filter(
      (q, i) => answers[i] === q.correctAnswer,
    ).length;
    const score = (correct / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    return (
      <div className="space-y-8">
        <div className="text-center space-y-4 pt-6">
          <div
            className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center p-1 border-4 ${passed ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}`}
          >
            <div className="w-full h-full rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{Math.round(score)}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Score
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black mac-text-primary tracking-tight">
              {passed ? "Module Mastered!" : "Keep Practicing"}
            </h2>
            <p className="text-gray-500 font-bold">
              You answered {correct} out of {quiz.questions.length} questions
              correctly.
            </p>
          </div>
          <div className="flex gap-4 justify-center pt-8">
            <Button
              onClick={() => onComplete(score)}
              className={buttonClassName}
            >
              {passed ? "Unlock Next Module" : "Review & Finish"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">
            Response Review
          </h3>
          {quiz.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <Card
                key={i}
                className={`p-6 border-none rounded-3xl ${isCorrect ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "bg-red-50/50 dark:bg-red-900/10"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="font-bold mac-text-primary pr-8">
                    {i + 1}. {q.question}
                  </p>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="grid gap-2">
                  <p
                    className={`text-sm font-bold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}
                  >
                    Your answer: {q.options[answers[i]] || "Skipped"}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm font-bold text-emerald-600">
                      Correct: {q.options[q.correctAnswer]}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  return (
    <div className="space-y-12 py-12">
      <div className="space-y-4">
        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 border-none font-bold uppercase tracking-widest text-[9px]">
          Module Assessment
        </Badge>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black mac-text-primary tracking-tight">
            Question {currentQuestion + 1}
          </h2>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        <Progress
          value={((currentQuestion + 1) / quiz.questions.length) * 100}
          className="h-1 bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-bold mac-text-primary leading-snug">
          {question.question}
        </h3>
        <div className="grid gap-4">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full p-6 text-left rounded-[1.5rem] border-4 transition-all ${
                answers[currentQuestion] === idx
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10"
                  : "border-gray-50 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${answers[currentQuestion] === idx ? "border-blue-600" : "border-gray-300"}`}
                >
                  {answers[currentQuestion] === idx && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span
                  className={`text-lg font-bold ${answers[currentQuestion] === idx ? "text-blue-700 dark:text-blue-400" : "mac-text-primary"}`}
                >
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <Button
          onClick={handleNext}
          disabled={answers[currentQuestion] === undefined}
          className={buttonClassName}
        >
          {currentQuestion < quiz.questions.length - 1
            ? "Next Question"
            : "Complete Assessment"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default CourseView;
