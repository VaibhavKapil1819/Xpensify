"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  TrendingUp,
  Plus,
  Loader2,
  Lightbulb,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import SmartUpload from '@/components/SmartUpload';
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType } from '@/types/transactions';
import { Skeleton } from '@/components/ui/skeleton';
import BudgetSkeletion from '@/components/budgetSkeletion';

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Other'
];

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Refund',
  'Other'
];

const Budget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState({ monthly: 0, categories: {} });
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [analyzingSpending, setAnalyzingSpending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as TransactionType
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(error.message || 'Failed to load transactions');

      if (error.message === 'Unauthorized') {
        navigate.push('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setAddingTransaction(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          type: newTransaction.type,
          category: newTransaction.category,
          description: newTransaction.description || undefined,
          date: newTransaction.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add transaction');
      }

      // Add new transaction to the list
      setTransactions([data.transaction, ...transactions]);

      // Reset form
      setNewTransaction({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: transactionType
      });
      setShowForm(false);

      toast.success(data.message);
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setAddingTransaction(false);
    }
  };

  const analyzeSpending = async () => {
    if (transactions.length === 0) {
      toast.error('Add some transactions first');
      return;
    }

    setAnalyzingSpending(true);
    try {
      // TODO: Create AI analysis API endpoint
      // const response = await fetch('/api/transactions/analyze', {
      //   method: 'POST',
      //   credentials: 'include',
      //   body: JSON.stringify({ transactions, budget }),
      // });
      // HIIII

      toast.info('AI analysis feature coming soon!');
    } catch (error) {
      console.error('Error analyzing spending:', error);
      toast.error('Failed to analyze spending');
    } finally {
      setAnalyzingSpending(false);
    }
  };

  const handleTransactionsExtracted = async (extractedTransactions: any[]) => {
    try {
      // Save each transaction through the API
      const promises = extractedTransactions.map(t =>
        fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: t.amount,
            type: t.type,
            category: t.category,
            description: t.description || undefined,
            date: t.date,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.json()));

      const successfulTransactions = data
        .filter((d, i) => responses[i].ok)
        .map(d => d.transaction);

      if (successfulTransactions.length > 0) {
        setTransactions([...successfulTransactions, ...transactions]);
        toast.success(`Successfully added ${successfulTransactions.length} transaction(s)!`);
      }

      const failures = data.filter((d, i) => !responses[i].ok);
      if (failures.length > 0) {
        toast.error(`Failed to add ${failures.length} transaction(s)`);
      }
    } catch (error) {
      console.error('Error saving extracted transactions:', error);
      toast.error('Failed to save transactions. Please try again.');
    }
  };

  // Calculate totals and balances
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <BudgetSkeletion />
    );
  }

  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Budget Tracker 💰</h2>
          <p className="text-muted-foreground">
            Track spending and get AI-powered insights
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          {/* Total Income */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">Total Income</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              ₹{totalIncome.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">
              {income.length} transactions
            </p>
          </Card>


          {/* Total Expenses */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">Total Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">
              ₹{totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">
              {expenses.length} transactions
            </p>
          </Card>

          {/* Net Balance */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${netBalance >= 0 ? 'bg-blue-50' : 'bg-red-50'} flex items-center justify-center`}>
                <TrendingUp className={`w-5 h-5 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">Net Balance</h3>
            </div>
            <p className={`text-3xl font-bold mb-1 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{netBalance.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">
              Current month
            </p>
          </Card>

          {/* Transactions */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">Transactions</h3>
            </div>
            <p className="text-3xl font-bold mac-text-primary mb-1">{transactions.length}</p>
            <p className="text-xs mac-text-secondary">
              {income.length} income • {expenses.length} expenses
            </p>
          </Card>
        </div>

        {/* Add Transaction */}
        <Card className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-6 h-6 text-blue-600 rounded-full" />
              <h3 className="text-xl font-semibold">Transactions</h3>
            </div>

            <Button className='bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all' variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {showForm && (
            <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-accent/5 rounded-lg">
              <div className="md:col-span-2">
                <Label>Transaction Type</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    className={`flex-1 ${transactionType === 'expense' ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all' : ''}`}
                    variant={transactionType === 'expense' ? 'default' : 'outline'}
                    onClick={() => {
                      setTransactionType('expense');
                      setNewTransaction({ ...newTransaction, type: 'expense', category: '' });
                    }}
                    
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    type="button"
                    variant={transactionType === 'income' ? 'default' : 'outline'}
                    onClick={() => {
                      setTransactionType('income');
                      setNewTransaction({ ...newTransaction, type: 'income', category: '' });
                    }}
                    className={`flex-1 ${transactionType === 'income' ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all' : ''}`}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Income
                  </Button>
                </div>
              </div>
              <div>
                <Label className='mb-2'>Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0.00"
                  className="glass-input"
                />
              </div>
              <div>
                <Label className='mb-2'>Category *</Label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='mb-2'>Date *</Label>
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="glass-input"
                  max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label className='mb-2'>Description</Label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="What was this for?"
                  className="glass-input"
                  maxLength={500}
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button
                  className='bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all'
                  onClick={addTransaction}
                  variant="default"
                  disabled={addingTransaction}
                >
                  {addingTransaction ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Transaction'
                  )}
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}

          {/* Transaction List */}
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
                    <div className="flex items-center gap-3">
                      {isIncome ? (
                        <ArrowUpCircle className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{t.description || t.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.category} • {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${isIncome ? 'text-blue-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Smart Upload */}
        <SmartUpload
          userId={user?.id || ''}
          onTransactionsExtracted={handleTransactionsExtracted}
        />

        {/* AI Analysis */}
        <Card className="glass-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              AI Spending Analysis
            </h3>
            <Button
              onClick={analyzeSpending}
              disabled={analyzingSpending || transactions.length === 0}
              variant="default"
            >
              {analyzingSpending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze Spending
                </>
              )}
            </Button>
          </div>

          {analysis ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-foreground/90">{analysis.summary}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Insights</h4>
                <ul className="space-y-2">
                  {analysis.insights.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-blue-600">
                      <span>✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Savings Opportunities</h4>
                <ul className="space-y-2">
                  {analysis.savingsOpportunities.map((opp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-accent">
                      <span>💡</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Add transactions and click "Analyze Spending" to get AI-powered insights</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default Budget;

 