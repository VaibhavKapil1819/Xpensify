'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { useRouter } from 'next/navigation';
import type { Goal, Milestone } from '@/types/goals';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  currency: string;
}

const Goals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    category: 'savings',
    currency: 'USD'
  });

  useEffect(() => {
    if (user) {
      loadGoalsData();
    }
  }, [user]);

  const loadGoalsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load goals');
      }

      const data = await response.json();
      setProfile(data.profile);
      setGoals(data.goals || []);
    } catch (error: any) {
      console.error('Error loading goals:', error);
      toast.error(error.message || 'Failed to load goals');
      
      if (error.message === 'Unauthorized') {
        navigate.push('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async (goalId: string) => {
    try {
      setLoadingMilestones(true);
      const response = await fetch(`/api/goals/${goalId}/milestones`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load milestones');
      }

      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (error: any) {
      console.error('Error loading milestones:', error);
      toast.error(error.message || 'Failed to load milestones');
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingGoal(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description || undefined,
          target_amount: parseFloat(newGoal.target_amount),
          current_amount: parseFloat(newGoal.current_amount),
          target_date: newGoal.target_date || undefined,
          category: newGoal.category,
          currency: newGoal.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create goal');
      }

      toast.success('Goal created with milestones! 🎉');
      setShowCreateDialog(false);

      // Reload goals
      await loadGoalsData();

      // Reset form
      setNewGoal({
        title: '',
        description: '',
        target_amount: '',
        current_amount: '0',
        target_date: '',
        category: 'savings',
        currency: 'USD'
      });

      // Auto-select the new goal
      setSelectedGoal(data.goal);
      await loadMilestones(data.goal.id);

    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error(error.message || 'Failed to create goal');
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleSelectGoal = async (goal: Goal) => {
    setSelectedGoal(goal);
    await loadMilestones(goal.id);
  };

  const toggleMilestone = async (milestone: Milestone) => {
    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update milestone');
      }

      toast.success(data.message);

      // Reload milestones
      if (selectedGoal) {
        await loadMilestones(selectedGoal.id);
      }
    } catch (error: any) {
      console.error('Error toggling milestone:', error);
      toast.error(error.message || 'Failed to update milestone');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">My Goals</h1>
            <p className="text-muted-foreground">Track your financial milestones and achievements</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl gradient-text">Create New Goal</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Emergency Fund"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this goal for?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="debt">Debt Payment</SelectItem>
                        <SelectItem value="purchase">Big Purchase</SelectItem>
                        <SelectItem value="emergency">Emergency Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newGoal.currency} onValueChange={(value) => setNewGoal({ ...newGoal, currency: value })}>
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_amount">Current Amount</Label>
                    <Input
                      id="current_amount"
                      type="number"
                      placeholder="0"
                      value={newGoal.current_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                      className="glass-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Target Amount *</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      placeholder="10000"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <Button 
                  onClick={handleCreateGoal} 
                  variant="default" 
                  className="w-full"
                  disabled={creatingGoal}
                >
                  {creatingGoal ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Creating goal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Goal with Milestones
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <Card className="glass-card p-12 text-center animate-fade-in">
            <Target className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Goals Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your financial journey by creating your first goal
            </p>
            <Button variant="default" size="lg" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Goal
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Goals List */}
            <div className="lg:col-span-1 space-y-4">
              {goals.map((goal) => {
                const targetAmount = Number(goal.target_amount || 0);
                const currentAmount = Number(goal.current_amount);
                const progress = targetAmount > 0 
                  ? (currentAmount / targetAmount) * 100 
                  : 0;
                
                return (
                  <Card 
                    key={goal.id}
                    className={`glass-card p-4 cursor-pointer transition-all hover:border-accent/50 ${
                      selectedGoal?.id === goal.id ? 'border-accent' : ''
                    }`}
                    onClick={() => handleSelectGoal(goal)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{goal.category}</p>
                      </div>
                      {goal.ai_completion_probability && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-accent">
                            {goal.ai_completion_probability}%
                          </div>
                          <div className="text-xs text-muted-foreground">likely</div>
                        </div>
                      )}
                    </div>
                    <Progress value={progress} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {profile?.currency || 'USD'} {currentAmount.toLocaleString()}
                      </span>
                      <span className="font-medium">
                        {profile?.currency || 'USD'} {targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Goal Details & Milestones */}
            <div className="lg:col-span-2">
              {selectedGoal ? (
                <div className="space-y-6 animate-fade-in">
                  <Card className="glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedGoal.title}</h2>
                        <p className="text-muted-foreground">{selectedGoal.description}</p>
                      </div>
                      <div className="text-right">
                        {selectedGoal.ai_completion_probability && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-2">
                            <TrendingUp className="w-4 h-4" />
                            {selectedGoal.ai_completion_probability}% Success Rate
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Target</div>
                          <div className="font-semibold">
                            {profile?.currency || 'USD'} {Number(selectedGoal.target_amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Current</div>
                          <div className="font-semibold">
                            {profile?.currency || 'USD'} {Number(selectedGoal.current_amount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {selectedGoal.target_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Due</div>
                            <div className="font-semibold">
                              {new Date(selectedGoal.target_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Progress 
                      value={(Number(selectedGoal.current_amount) / Number(selectedGoal.target_amount || 1)) * 100} 
                      className="h-3"
                    />
                  </Card>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      Milestones
                    </h3>
                    
                    {loadingMilestones ? (
                      <Card className="glass-card p-8 text-center">
                        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                      </Card>
                    ) : milestones.length === 0 ? (
                      <Card className="glass-card p-8 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No milestones yet</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <Card 
                            key={milestone.id}
                            className={`glass-card p-4 transition-all ${
                              milestone.completed ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => toggleMilestone(milestone)}
                                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  milestone.completed
                                    ? 'bg-accent border-accent'
                                    : 'border-muted-foreground hover:border-accent'
                                }`}
                              >
                                {milestone.completed && <CheckCircle2 className="w-4 h-4 text-background" />}
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className={`font-semibold ${milestone.completed ? 'line-through' : ''}`}>
                                    {index + 1}. {milestone.title}
                                  </h4>
                                  {milestone.target_amount && (
                                    <span className="text-sm font-medium text-accent">
                                      {profile?.currency || 'USD'} {Number(milestone.target_amount).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {milestone.description}
                                </p>
                                {milestone.due_date && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="glass-card p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a goal to view details and milestones
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Goals
