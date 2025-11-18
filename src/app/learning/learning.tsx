'use client'
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Trophy, 
  Target,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { articleSchema } from '../api/ai/generate-lessons/schema';
import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { SaveProgressRequest, SaveProgressResponse, ApiError } from '@/types/learning';

const categories = [
  { id: 'budgeting', name: 'Budgeting Basics', icon: '💰', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'saving', name: 'Smart Saving', icon: '🏦', color: 'bg-green-500/10 text-green-600' },
  { id: 'investing', name: 'Investment 101', icon: '📈', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'debt', name: 'Debt Management', icon: '💳', color: 'bg-red-500/10 text-red-600' },
];

const levels = ['beginner', 'intermediate', 'advanced'];

const Learning:React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const { submit, object, isLoading, error, stop } = useObject({
    api: "/api/ai/generate-lessons",
    schema: articleSchema,
  });

  const generateLesson = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      submit({
        category: selectedCategory,
        level: selectedLevel,
      });

      if (error) throw error;
      setLesson(object?.article);
      setQuizAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast.error('Failed to generate lesson');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (quizAnswer === null || !lesson || !selectedCategory) return;
    
    const isCorrect = quizAnswer === lesson.quiz.correctAnswer;
    setSubmittingQuiz(true);

    try {
      // Prepare progress data
      const progressData: SaveProgressRequest = {
        lessonId: `${selectedCategory}-${selectedLevel}`,
        lessonTitle: lesson.title,
        category: selectedCategory,
        completed: isCorrect,
        score: isCorrect ? 100 : 0,
        isCorrect: isCorrect,
      };

      // Call API to save progress and update streak
      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to save progress');
      }

      const result: SaveProgressResponse = await response.json();
      setShowResult(true);

      // Show success/error toast
      if (isCorrect) {
        toast.success('Correct! Well done! 🎉', {
          description: `Score: ${result.progress.score}/100`,
        });
        
        // Show streak information
        if (result.streak) {
          toast.success(
            `🔥 Streak: ${result.streak.current_streak} days | Total: ${result.streak.total_lessons_completed} lessons`,
            { duration: 5000 }
          );
        }
      } else {
        toast.error('Not quite. Try again!', {
          description: 'Keep practicing to improve your score',
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save progress');
      setShowResult(true); // Still show result even if save fails
      
      if (isCorrect) {
        toast.success('Correct! Well done! 🎉');
      } else {
        toast.error('Not quite. Try again!');
      }
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Financial Learning Hub 📚</h2>
          <p className="text-muted-foreground">
            Master financial literacy with AI-powered personalized lessons
          </p>
        </div>

        {!lesson ? (
          <>
            {/* Category Selection */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  className={`glass-card p-6 cursor-pointer transition-all hover:scale-105 ${
                    selectedCategory === cat.id ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{cat.icon}</div>
                    <h3 className="font-semibold mb-1">{cat.name}</h3>
                    <Badge className={cat.color}>Learn</Badge>
                  </div>
                </Card>
              ))}
            </div>

            {/* Level Selection */}
            {selectedCategory && (
              <Card className="glass-card p-6 mb-6 animate-fade-in">
                <h3 className="text-lg font-semibold mb-4">Select Your Level</h3>
                <div className="flex gap-3">
                  {levels.map((level) => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? 'default' : 'outline'}
                      onClick={() => setSelectedLevel(level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Generate Button */}
            {selectedCategory && (
              <Button
                onClick={generateLesson}
                disabled={loading}
                size="lg"
                variant="default"
                className="w-full"
              >
                {loading || isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Your Lesson...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Generate AI Lesson
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
          {lesson &&(
            <div className="space-y-6 animate-fade-in">
            {/* Lesson Content */}
            <Card className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4 gradient-text">{lesson.title}</h2>
              <div className="prose prose-lg max-w-none text-foreground/90">
                {lesson.content.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>

              <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {lesson.keyTakeaways.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Quiz */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                Test Your Knowledge
              </h3>
              <p className="text-lg mb-4">{lesson.quiz.question}</p>
              <div className="space-y-3 mb-6">
                {lesson.quiz.options.map((option: string, i: number) => (
                  <Button
                    key={i}
                    variant={quizAnswer === i ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => !showResult && !submittingQuiz && setQuizAnswer(i)}
                    disabled={showResult || submittingQuiz}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                    {showResult && i === lesson.quiz.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />
                    )}
                  </Button>
                ))}
              </div>

              {!showResult ? (
                <Button
                  onClick={submitQuiz}
                  disabled={quizAnswer === null || submittingQuiz}
                  variant="default"
                  className="w-full"
                >
                  {submittingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving Progress...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setLesson(null)}
                  variant="outline"
                  className="w-full"
                >
                  Try Another Lesson
                </Button>
              )}
            </Card>
          </div>
          )}
          </>
          
        )}
      </main>
    </div>
  );
}

export default Learning;