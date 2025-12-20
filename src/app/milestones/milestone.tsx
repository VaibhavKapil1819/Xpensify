"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Trophy, Target, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { useRouter } from 'next/navigation';
import type { Milestone, MilestonesResponse, MilestoneToggleResponse, ApiError } from '@/types/milestone';
import { DashboardSkeleton } from '@/components/DashboardSkeletons';

export default function Milestones() {
  const { user } = useAuth();
  const navigate = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMilestones();
    }
  }, [user]);

  const loadMilestones = async (goalId?: string) => {
    try {
      setLoading(true);

      // Build URL with optional goalId query param
      const url = new URL('/api/milestones', window.location.origin);
      if (goalId) {
        url.searchParams.set('goalId', goalId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to load milestones');
      }

      const data: MilestonesResponse = await response.json();
      setMilestones(data.milestones);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load milestones');
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (milestoneId: string) => {
    try {
      setTogglingId(milestoneId);

      const response = await fetch(`/api/milestones/${milestoneId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to update milestone');
      }

      const data: MilestoneToggleResponse = await response.json();

      // Update the milestone in state optimistically
      setMilestones(prevMilestones =>
        prevMilestones.map(m =>
          m.id === milestoneId ? data.milestone : m
        )
      );

      toast.success(data.message);
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update milestone');
      // Reload milestones to ensure consistency
      await loadMilestones();
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />
  }

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Your Milestones</h1>
              <p className="text-muted-foreground">Track your progress toward financial goals</p>
            </div>
          </div>

          <Card className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <span className="text-2xl font-bold gradient-text">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress value={completionRate} className="h-3 mb-2 [&>div]:bg-blue-600" />
            <p className="text-sm text-muted-foreground">
              {completionRate.toFixed(0)}% of all milestones completed
            </p>
          </Card>
        </div>

        {milestones.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Milestones Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create a goal to start generating AI-powered milestones
            </p>
            <Button variant="default" onClick={() => navigate.push('/goals')}>
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <Card
                key={milestone.id}
                className={`glass-card p-6 transition-all ${milestone.completed ? 'opacity-75' : ''
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <button
                        onClick={() => toggleMilestone(milestone.id)}
                        disabled={togglingId === milestone.id}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${milestone.completed
                            ? 'bg-accent border-accent'
                            : 'border-muted-foreground hover:border-accent'
                          } ${togglingId === milestone.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {togglingId === milestone.id ? (
                          <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        ) : null}
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''
                          }`}>
                          {milestone.title}
                        </h3>
                        {milestone.goal?.title && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Goal: {milestone.goal.title}
                          </p>
                        )}
                        <p className="text-foreground/90 mb-3">{milestone.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {milestone.due_date && (
                            <Badge variant="outline">
                              {new Date(milestone.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                          {milestone.completed && milestone.completed_at && (
                            <Badge variant="secondary" className="bg-accent/20 text-accent">
                              Completed {new Date(milestone.completed_at).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
