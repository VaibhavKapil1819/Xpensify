"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Settings,
  Clock,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import CourseView from "@/components/learning/CourseView";
import { Progress } from "@/components/ui/progress";
import {
  useLearningPreferences,
  useUpdatePreferences,
  useConversations,
  useClearConversations,
  useCourses,
  useCourse,
  useSaveCourse,
  useDeleteCourse,
  useRecommendations,
  useGenerateRecommendations,
} from "@/hooks/use-learning";
import type { SavePreferencesRequest } from "@/types/learning-coach";
import type { Course } from "@/types/course";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { buttonClassName, progressClassName } from "@/models/constants";

const LearningCoach: React.FC = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [showCourseLibrary, setShowCourseLibrary] = useState(false);
  // Track detected courses in messages for immediate UI updates
  const [detectedCourses, setDetectedCourses] = useState<Map<string, Course>>(
    new Map(),
  );

  const [input, setInput] = useState("");

  // React Query hooks - declare saveCourse early so it can be used in useEffect
  const { data: preferences, isLoading: loadingPrefs } =
    useLearningPreferences();
  const updatePreferences = useUpdatePreferences();
  const { data: conversations = [] } = useConversations(50);
  const clearConversations = useClearConversations();
  const { data: savedCourses = [], isLoading: loadingCourses } = useCourses();
  const {
    data: currentCourseData,
    isLoading: loadingCourse,
    error: courseError,
  } = useCourse(currentCourseId);
  const saveCourse = useSaveCourse();
  const deleteCourse = useDeleteCourse();
  const { data: recommendations = [] } = useRecommendations();
  const generateRecommendations = useGenerateRecommendations();

  // Use useChat hook from AI SDK with error handling
  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error: chatError,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";

      // Check for quota errors
      if (
        errorMessage.includes("quota") ||
        errorMessage.includes("Quota exceeded") ||
        errorMessage.includes("429")
      ) {
        toast.error(
          "API Quota Exceeded: You've reached the daily limit. Please try again later.",
          {
            duration: 10000,
          },
        );
      } else {
        toast.error("Failed to get response. Please try again.", {
          duration: 5000,
        });
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Load conversation history from database on mount
  const hasLoadedConversations = React.useRef(false);

  useEffect(() => {
    // Only load once when conversations are available and messages are empty
    if (
      !hasLoadedConversations.current &&
      conversations.length > 0 &&
      messages.length === 0 &&
      !isLoading
    ) {
      // Convert database conversations to UIMessage format
      const dbMessages = conversations.map((conv) => ({
        id: conv.id,
        role: conv.role as "user" | "assistant",
        content: conv.content,
        parts: [
          {
            type: "text" as const,
            text: conv.content,
          },
        ],
      }));

      // Set messages from database
      if (setMessages && dbMessages.length > 0) {
        setMessages(dbMessages);
        hasLoadedConversations.current = true;

        // Also detect courses in loaded messages
        dbMessages.forEach((message) => {
          if (message.role === "assistant" && message.id) {
            const course = parseCourseFromMessage(message.content);
            if (course) {
              setDetectedCourses((prev) => {
                const newMap = new Map(prev);
                newMap.set(message.id!, course);
                return newMap;
              });
            }
          }
        });
      }
    }
  }, [conversations, messages.length, isLoading, setMessages]);

  // Track processed message IDs to avoid redundant parsing and concurrent saves
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Don't try to parse courses while streaming - wait for completion
    if (status === "streaming" || status === "submitted") {
      return;
    }

    messages.forEach((message) => {
      // Only process assistant messages with IDs that we haven't processed yet
      if (
        message.role === "assistant" &&
        message.id &&
        !processedMessageIds.current.has(message.id) &&
        !detectedCourses.has(message.id)
      ) {
        // Extract text from message parts
        const messageText = message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("");

        if (messageText && messageText.length > 200) {
          const course = parseCourseFromMessage(messageText);
          if (course) {
            console.log(
              "Course detected for message",
              message.id,
              course.title,
            );

            // Mark as processed BEFORE mutation to avoid concurrent triggers
            processedMessageIds.current.add(message.id);

            setDetectedCourses((prev) => {
              const newMap = new Map(prev);
              newMap.set(message.id!, course);
              return newMap;
            });

            // Auto-save the course
            saveCourse.mutate(course, {
              onSuccess: (result) => {
                console.log("Course saved with ID:", result?.id);
                toast.success("Course saved successfully! 📚");
              },
              onError: (error) => {
                console.error("Error saving course:", error);
                // If it failed, maybe we want to retry later, but for now we keep it in processed
              },
            });
          }
        }
      }
    });
  }, [messages, status, detectedCourses, saveCourse]);
  // Track if we've loaded initial conversations
  const hasLoadedInitialConversations = React.useRef(false);

  // Show welcome screen if no preferences
  useEffect(() => {
    if (!loadingPrefs && preferences && !preferences.id) {
      setShowWelcome(true);
    }
  }, [preferences, loadingPrefs]);

  const parseCourseFromMessage = (messageText: string): Course | null => {
    if (!messageText) return null;

    try {
      // Try multiple patterns to find course JSON
      let courseJsonMatch = messageText.match(
        /```course-json\s*([\s\S]*?)```/i,
      );

      // If not found, try without the "course-json" label
      if (!courseJsonMatch) {
        courseJsonMatch = messageText.match(/```json\s*([\s\S]*?)```/i);
      }

      // If still not found, try to find JSON object directly (more lenient for incomplete JSON)
      if (!courseJsonMatch) {
        // Try to find the start of JSON object
        const jsonStart = messageText.indexOf('{"title"');
        if (jsonStart !== -1) {
          // Try to find the complete JSON by matching braces
          let braceCount = 0;
          let jsonEnd = -1;
          let inString = false;
          let escapeNext = false;

          for (let i = jsonStart; i < messageText.length; i++) {
            const char = messageText[i];

            if (escapeNext) {
              escapeNext = false;
              continue;
            }

            if (char === "\\") {
              escapeNext = true;
              continue;
            }

            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === "{") braceCount++;
              if (char === "}") {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }

          if (jsonEnd > jsonStart) {
            const jsonCandidate = messageText.substring(jsonStart, jsonEnd);
            courseJsonMatch = ["", jsonCandidate];
          } else {
            // JSON is incomplete (still streaming)
            return null;
          }
        }
      }

      if (courseJsonMatch && courseJsonMatch[1]) {
        const jsonString = courseJsonMatch[1].trim();

        // Check if JSON looks complete (has closing braces and closing code block marker)
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;

        // Check if the code block is properly closed
        const hasClosingMarker =
          messageText.includes("```") &&
          (messageText.match(/```/g) || []).length >= 2;

        // If braces don't match significantly, JSON is likely incomplete
        if (Math.abs(openBraces - closeBraces) > 1) {
          console.log("JSON appears incomplete - braces mismatch:", {
            openBraces,
            closeBraces,
          });
          return null;
        }

        // If code block isn't closed, JSON might be incomplete
        if (!hasClosingMarker && messageText.includes("```course-json")) {
          console.log(
            "JSON code block appears incomplete - missing closing marker",
          );
          return null;
        }

        let courseData;

        try {
          courseData = JSON.parse(jsonString);
        } catch (parseError) {
          // Try to extract JSON from markdown code block
          const cleanedJson = jsonString
            .replace(/^```json\s*|\s*```$/gi, "")
            .trim();
          try {
            courseData = JSON.parse(cleanedJson);
          } catch (secondError) {
            console.error("JSON parse error:", parseError, secondError);
            // If parsing fails, JSON might be incomplete
            return null;
          }
        }

        if (
          !courseData ||
          !courseData.title ||
          !courseData.modules ||
          !Array.isArray(courseData.modules)
        ) {
          console.error(
            "Invalid course structure: missing required fields",
            courseData,
          );
          return null;
        }

        const hasLessons = courseData.modules.every(
          (module: any) =>
            module.lessons &&
            Array.isArray(module.lessons) &&
            module.lessons.length > 0,
        );

        if (!hasLessons) {
          console.error("Invalid course structure: modules missing lessons");
          return null;
        }

        console.log("Successfully parsed course:", courseData.title);
        return courseData as Course;
      } else {
        // Check if AI mentioned creating a course but didn't include JSON
        const courseMentionPatterns = [
          /let me create.*course/i,
          /i've put together.*course/i,
          /i've created.*course/i,
          /comprehensive course/i,
        ];
        const mentionsCourse = courseMentionPatterns.some((pattern) =>
          pattern.test(messageText),
        );

        if (mentionsCourse) {
          console.warn(
            "⚠️ AI mentioned creating a course but course JSON not found in message. This may indicate the AI response was incomplete or the JSON format was incorrect.",
          );
        } else {
          console.log("No course JSON found in message");
        }
      }
    } catch (error) {
      console.error("Error parsing course JSON:", error);
    }
    return null;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(
      { text: input },
      {
        body: {
          isLearningCoach: true,
        },
      },
    );
    setInput("");
  };

  const handleClearHistory = () => {
    if (
      !confirm(
        "Are you sure you want to clear your conversation history? This cannot be undone.",
      )
    ) {
      return;
    }
    clearConversations.mutate();
    // Clear messages from useChat if setMessages is available
    if (setMessages) {
      setMessages([]);
    }
    setDetectedCourses(new Map());
    hasLoadedConversations.current = false; // Reset so conversations can be loaded again if needed
  };

  const handleSavePreferences = async (prefs: SavePreferencesRequest) => {
    try {
      await updatePreferences.mutateAsync(prefs);
      setShowWelcome(false);

      // Send initial message to coach
      const welcomeMessage = `I want to learn about financial topics. My knowledge level is ${prefs.knowledge_level} and I prefer ${prefs.learning_style} style teaching.`;
      // Note: This will be handled by the parent component's sendMessage
      // For now, we'll set it in input and let user submit, or we can call sendMessage directly
      // But since we don't have access to sendMessage here, we'll set it in input
      setInput(welcomeMessage);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const handleLoadCourse = (courseId: string) => {
    setCurrentCourseId(courseId);
    setShowCourseLibrary(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm("Delete this course?")) {
      deleteCourse.mutate(courseId);
      if (currentCourseId === courseId) {
        setCurrentCourseId(null);
      }
    }
  };

  const handleBackToChat = () => {
    setCurrentCourseId(null);
    setShowCourseLibrary(false); // Ensure we're back to chat view, not course library
    // Scroll to top of chat when returning
    setTimeout(() => {
      // Scrolling is handled by ConversationScrollButton
    }, 100);
  };

  if (loadingPrefs) {
    return (
      <div className="min-h-screen mac-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show loading state when loading course
  if (currentCourseId && loadingCourse) {
    return (
      <div className="min-h-screen mac-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="mac-text-secondary">Loading course...</p>
        </div>
      </div>
    );
  }

  // Show error state if course failed to load
  if (currentCourseId && courseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="mac-card p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 mac-text-primary">
              Failed to Load Course
            </h2>
            <p className="mac-text-secondary mb-4">
              {courseError instanceof Error
                ? courseError.message
                : "Unable to load course data. The course may be corrupted or missing."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleBackToChat} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
              <Button
                onClick={() => {
                  setCurrentCourseId(null);
                  setTimeout(() => setCurrentCourseId(currentCourseId), 100);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show course view if a course is active and loaded
  if (currentCourseId && currentCourseData) {
    return (
      <CourseView
        course={currentCourseData}
        courseId={currentCourseId}
        onBack={handleBackToChat}
      />
    );
  }

  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {showWelcome ? (
          <WelcomeScreen onComplete={handleSavePreferences} />
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setShowCourseLibrary(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  !showCourseLibrary
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setShowCourseLibrary(true)}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  showCourseLibrary
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                📚 My Courses
                {savedCourses.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                    {savedCourses.length}
                  </span>
                )}
              </button>
            </div>

            {showCourseLibrary ? (
              <CourseLibrary
                courses={savedCourses}
                loading={loadingCourses}
                onSelectCourse={handleLoadCourse}
                onDeleteCourse={handleDeleteCourse}
              />
            ) : (
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Main Chat Area */}
                <div className="lg:col-span-3">
                  <Card className="mac-card h-[calc(100vh-200px)] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="font-semibold mac-text-primary">
                            XPensify Learn
                          </h2>
                          <p className="text-xs mac-text-secondary">
                            Your Financial Learning Coach
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Show active course button if there's a course in progress */}
                        {savedCourses.length > 0 &&
                          savedCourses.some(
                            (c) => c.progress > 0 && !c.completed,
                          ) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const activeCourse = savedCourses.find(
                                  (c) => c.progress > 0 && !c.completed,
                                );
                                if (activeCourse) {
                                  handleLoadCourse(activeCourse.id);
                                }
                              }}
                              className="text-xs border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              My Courses
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearHistory}
                          disabled={clearConversations.isPending}
                          className="text-xs"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Clear Chat
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <Conversation className="flex-1 overflow-y-auto">
                      <ConversationContent className="p-4">
                        {messages.length === 0 && (
                          <div className="text-center py-12">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                            <h3 className="text-lg font-semibold mb-2 mac-text-primary">
                              Welcome! 👋
                            </h3>
                            <p className="mac-text-secondary max-w-md mx-auto">
                              What financial topic would you like to learn
                              today? I'm here to help you master personal
                              finance!
                            </p>
                          </div>
                        )}

                        {messages.map((message, messageIndex) => {
                          // Extract text from message parts
                          const messageText = message.parts
                            .filter((part: any) => part.type === "text")
                            .map((part: any) => part.text)
                            .join("");

                          // Check if this is the last message and if it's still streaming
                          const isLastMessage =
                            messageIndex === messages.length - 1;
                          const isStreaming =
                            status === "streaming" &&
                            isLastMessage &&
                            message.role === "assistant";

                          // Check if we have a detected course for this message
                          const detectedCourse = message.id
                            ? detectedCourses.get(message.id)
                            : null;

                          // Also try parsing from message content if not already detected
                          // IMPORTANT: Only parse when streaming is complete to avoid parsing incomplete JSON
                          let parsedCourse: Course | null =
                            detectedCourse || null;

                          // Only try to parse if:
                          // 1. We don't already have a detected course
                          // 2. Message is from assistant
                          // 3. We have substantial content
                          // 4. Streaming is complete (not currently streaming)
                          if (
                            !parsedCourse &&
                            message.role === "assistant" &&
                            messageText &&
                            messageText.length > 200 &&
                            !isStreaming
                          ) {
                            try {
                              parsedCourse =
                                parseCourseFromMessage(messageText);
                              if (parsedCourse) {
                                // Store it in detected courses if not already there
                                if (
                                  message.id &&
                                  !detectedCourses.has(message.id)
                                ) {
                                  setDetectedCourses((prev) => {
                                    const newMap = new Map(prev);
                                    newMap.set(message.id!, parsedCourse!);
                                    return newMap;
                                  });
                                }
                              }
                            } catch (error) {
                              console.error(
                                "Error parsing course from message:",
                                error,
                              );
                            }
                          }

                          // Extract conversational text (text before the JSON) - ALWAYS remove JSON
                          let conversationalText = messageText;

                          // Remove JSON code blocks (course-json or json)
                          conversationalText = conversationalText
                            .replace(/```course-json\s*[\s\S]*?```/gi, "")
                            .trim();
                          conversationalText = conversationalText
                            .replace(/```json\s*[\s\S]*?```/gi, "")
                            .trim();

                          // Remove any JSON object that looks like a course (starts with {"title" and has "modules")
                          const jsonStartPattern =
                            /\{[\s\S]*?"title"[\s\S]*?"modules"/;
                          const jsonStartIndex =
                            conversationalText.search(jsonStartPattern);
                          if (jsonStartIndex !== -1) {
                            // Find the end of the JSON (look for matching braces)
                            let braceCount = 0;
                            let jsonEndIndex = jsonStartIndex;
                            let inString = false;
                            let escapeNext = false;

                            for (
                              let i = jsonStartIndex;
                              i < conversationalText.length;
                              i++
                            ) {
                              const char = conversationalText[i];

                              if (escapeNext) {
                                escapeNext = false;
                                continue;
                              }

                              if (char === "\\") {
                                escapeNext = true;
                                continue;
                              }

                              if (char === '"' && !escapeNext) {
                                inString = !inString;
                                continue;
                              }

                              if (!inString) {
                                if (char === "{") braceCount++;
                                if (char === "}") {
                                  braceCount--;
                                  if (braceCount === 0) {
                                    jsonEndIndex = i + 1;
                                    break;
                                  }
                                }
                              }
                            }

                            // Remove the JSON part
                            conversationalText = (
                              conversationalText.substring(0, jsonStartIndex) +
                              conversationalText.substring(jsonEndIndex)
                            ).trim();
                          }

                          // Clean up any remaining JSON artifacts
                          conversationalText = conversationalText
                            .replace(/\{[\s\S]*?"title"[\s\S]*/gi, "")
                            .trim();
                          conversationalText = conversationalText
                            .replace(/^[\s\S]*?"modules"[\s\S]*\}/gi, "")
                            .trim();

                          const hasCourse = !!parsedCourse;

                          return (
                            <div key={message.id}>
                              <Message from={message.role}>
                                <MessageContent>
                                  {/* Only show conversational text if it exists and is meaningful */}
                                  {conversationalText &&
                                    conversationalText.length > 0 && (
                                      <MessageResponse>
                                        {conversationalText}
                                      </MessageResponse>
                                    )}

                                  {/* Show course button if course is detected - this replaces any JSON display */}
                                  {hasCourse &&
                                    parsedCourse &&
                                    !isStreaming && (
                                      <div className="mt-4 space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="w-5 h-5 text-blue-600" />
                                          <span className="font-semibold">
                                            Course Generated! 🎓
                                          </span>
                                        </div>
                                        <p className="text-sm mac-text-secondary">
                                          I've created a complete course for
                                          you:{" "}
                                          <strong>{parsedCourse.title}</strong>
                                        </p>
                                        <Button
                                          onClick={() => {
                                            // Try to find the course in saved courses by title
                                            const savedCourse =
                                              savedCourses.find(
                                                (c) =>
                                                  c.title ===
                                                    parsedCourse!.title ||
                                                  c.title.toLowerCase() ===
                                                    parsedCourse!.title.toLowerCase(),
                                              );

                                            if (savedCourse) {
                                              console.log(
                                                "Found saved course, loading:",
                                                savedCourse.id,
                                              );
                                              handleLoadCourse(savedCourse.id);
                                            } else {
                                              console.log(
                                                "Course not found in saved courses, saving now...",
                                              );
                                              // Save it first, then load
                                              saveCourse.mutate(parsedCourse!, {
                                                onSuccess: (result) => {
                                                  console.log(
                                                    "Course saved, loading:",
                                                    result?.id,
                                                  );
                                                  if (result?.id) {
                                                    handleLoadCourse(result.id);
                                                  } else {
                                                    toast.error(
                                                      "Course saved but ID not returned. Please check My Courses.",
                                                    );
                                                  }
                                                },
                                                onError: (error) => {
                                                  console.error(
                                                    "Error saving course:",
                                                    error,
                                                  );
                                                  toast.error(
                                                    "Failed to save course. Please try again.",
                                                  );
                                                },
                                              });
                                            }
                                          }}
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                          disabled={saveCourse.isPending}
                                        >
                                          {saveCourse.isPending ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Saving Course...
                                            </>
                                          ) : (
                                            <>
                                              <BookOpen className="w-4 h-4 mr-2" />
                                              View Course
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                </MessageContent>
                              </Message>
                            </div>
                          );
                        })}

                        {status === "submitted" && <Loader />}

                        {/* Show error message if chat error occurs */}
                        {chatError && (
                          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                                  {chatError.message?.includes("quota") ||
                                  chatError.message?.includes("429")
                                    ? "API Quota Exceeded"
                                    : "Error"}
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  {chatError.message?.includes("quota") ||
                                  chatError.message?.includes("429")
                                    ? "You've reached the daily limit for AI requests (20 requests/day on free tier). Please try again later or upgrade your API plan."
                                    : chatError.message ||
                                      "Something went wrong. Please try again."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </ConversationContent>
                      <ConversationScrollButton />
                    </Conversation>

                    {/* Input */}
                    <form onSubmit={handleFormSubmit} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask me anything about personal finance..."
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Preferences Card */}
                  {preferences && (
                    <Card className="mac-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-sm mac-text-primary">
                          Your Profile
                        </h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="mac-text-secondary">Level:</span>
                          <Badge className="ml-2 capitalize bg-blue-100 text-blue-700">
                            {preferences.knowledge_level}
                          </Badge>
                        </div>
                        <div>
                          <span className="mac-text-secondary">Style:</span>
                          <Badge className="ml-2 capitalize bg-blue-100 text-blue-700">
                            {preferences.learning_style}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-xs"
                        onClick={() => setShowWelcome(true)}
                      >
                        Update Preferences
                      </Button>
                    </Card>
                  )}

                  {/* Recommendations */}
                  <Card className="mac-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-sm mac-text-primary">
                          Recommended Topics
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateRecommendations.mutate()}
                        disabled={generateRecommendations.isPending}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>

                    {recommendations.length === 0 ? (
                      <p className="text-xs mac-text-secondary">
                        No recommendations yet. Start learning to get
                        personalized suggestions!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recommendations.slice(0, 5).map((rec) => (
                          <button
                            key={rec.id}
                            onClick={() => {
                              const messageText = `I want to learn about ${rec.topic_name}`;
                              sendMessage(
                                { text: messageText },
                                {
                                  body: {
                                    isLearningCoach: true,
                                  },
                                },
                              );
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <p className="text-xs font-medium mac-text-primary">
                              {rec.topic_name}
                            </p>
                            <p className="text-xs mac-text-secondary mt-1">
                              {rec.reason}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen: React.FC<{
  onComplete: (prefs: SavePreferencesRequest) => void;
}> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [knowledgeLevel, setKnowledgeLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [learningStyle, setLearningStyle] = useState<
    | "simple"
    | "detailed"
    | "examples-based"
    | "story-based"
    | "fast-track"
    | "balanced"
  >("balanced");

  const handleComplete = () => {
    onComplete({
      knowledge_level: knowledgeLevel,
      learning_style: learningStyle,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mac-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 mac-text-primary">
            Welcome to XPensify Learn! 👋
          </h1>
          <p className="mac-text-secondary">
            Let's personalize your learning experience
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 mac-text-primary">
                What's your knowledge level?
              </h3>
              <div className="grid gap-3">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setKnowledgeLevel(level as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      knowledgeLevel === level
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="font-medium capitalize mac-text-primary">
                      {level}
                    </p>
                    <p className="text-sm mac-text-secondary mt-1">
                      {level === "beginner" &&
                        "Just starting with personal finance"}
                      {level === "intermediate" &&
                        "Have some financial knowledge"}
                      {level === "advanced" &&
                        "Experienced with financial concepts"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              className={`w-full ${buttonClassName}`}
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 mac-text-primary">
                How do you prefer to learn?
              </h3>
              <div className="grid gap-3">
                {[
                  {
                    value: "simple",
                    label: "Simple",
                    desc: "Easy language, short explanations",
                  },
                  {
                    value: "detailed",
                    label: "Detailed",
                    desc: "In-depth, comprehensive coverage",
                  },
                  {
                    value: "examples-based",
                    label: "Examples-Based",
                    desc: "Real-world scenarios",
                  },
                  {
                    value: "story-based",
                    label: "Story-Based",
                    desc: "Narratives and storytelling",
                  },
                  {
                    value: "fast-track",
                    label: "Fast-Track",
                    desc: "Quick, concise bullet points",
                  },
                  {
                    value: "balanced",
                    label: "Balanced",
                    desc: "Mix of all approaches",
                  },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setLearningStyle(style.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      learningStyle === style.value
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="font-medium mac-text-primary">
                      {style.label}
                    </p>
                    <p className="text-sm mac-text-secondary mt-1">
                      {style.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Course Library Component
interface CourseLibraryProps {
  courses: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration?: string;
    progress: number;
    completed: boolean;
  }>;
  loading: boolean;
  onSelectCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
}

const CourseLibrary: React.FC<CourseLibraryProps> = ({
  courses,
  loading,
  onSelectCourse,
  onDeleteCourse,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="mac-card p-12 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 mac-text-primary">
          No Courses Yet
        </h3>
        <p className="mac-text-secondary max-w-md mx-auto">
          Start a conversation in the chat to generate your first course!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="mac-card p-4 hover:shadow-lg transition-shadow"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge variant="secondary" className="capitalize mb-2">
                  {course.difficulty}
                </Badge>
                <h3 className="font-semibold mac-text-primary line-clamp-2">
                  {course.title}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCourse(course.id);
                }}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm mac-text-secondary line-clamp-2">
              {course.description}
            </p>

            {course.duration && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {course.duration}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="mac-text-secondary ">Progress</span>
                <span className="font-medium text-blue-600">
                  {course.progress}%
                </span>
              </div>
              <Progress value={course.progress} className={progressClassName} />
            </div>

            <Button
              onClick={() => onSelectCourse(course.id)}
              className={`w-full ${buttonClassName}`}
              variant={course.progress > 0 ? "default" : "outline"}
            >
              {course.progress > 0 ? "Continue Learning" : "Start Course"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default LearningCoach;
