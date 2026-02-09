"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  TrendingUp,
  Plus,
  Loader2,
  Lightbulb,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import SmartUpload from "@/components/SmartUpload";
import EditTransactionDialog from "@/components/EditTransactionDialog";
import SpendingCharts from "@/components/SpendingCharts";
import { useRouter } from "next/navigation";
import type { Transaction, TransactionType } from "@/types/transactions";
import BudgetSkeletion from "@/components/budgetSkeletion";
import { buttonClassName } from "@/models/constants";
import ConfirmDialog from "@/components/confirm-dialog/confirm-dialog";
import InfoDialog from "@/components/info-dialog/info-dialog";
import { se } from "date-fns/locale";

const expenseCategories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Health",
  "Other",
];

const incomeCategories = [
  "Salary",
  "Freelance",
  "Investment",
  "Business",
  "Gift",
  "Refund",
  "Other",
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
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Delete Transaction
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense" as TransactionType,
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      toast.error(error.message || "Failed to load transactions");

      if (error.message === "Unauthorized") {
        navigate.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setAddingTransaction(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
        throw new Error(data.error || "Failed to add transaction");
      }

      // Add new transaction to the list
      setTransactions([data.transaction, ...transactions]);

      // Reset form
      setNewTransaction({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        type: transactionType,
      });
      setShowForm(false);

      toast.success(data.message);
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast.error(error.message || "Failed to add transaction");
    } finally {
      setAddingTransaction(false);
    }
  };

  const analyzeSpending = async () => {
    if (transactions.length === 0) {
      toast.error("Add some transactions first");
      return;
    }

    setAnalyzingSpending(true);
    try {
      const response = await fetch("/api/transactions/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze spending");
      }

      setAnalysis(data.analysis);
      toast.success("AI analysis complete!");
    } catch (error: any) {
      console.error("Error analyzing spending:", error);
      toast.error(error.message || "Failed to analyze spending");
    } finally {
      setAnalyzingSpending(false);
    }
  };

  const handleTransactionsExtracted = async (extractedTransactions: any[]) => {
    try {
      // Save each transaction through the API
      const promises = extractedTransactions.map((t) =>
        fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
      const data = await Promise.all(responses.map((r) => r.json()));

      const successfulTransactions = data
        .filter((d, i) => responses[i].ok)
        .map((d) => d.transaction);

      if (successfulTransactions.length > 0) {
        setTransactions([...successfulTransactions, ...transactions]);
        toast.success(
          `Successfully added ${successfulTransactions.length} transaction(s)!`
        );
      }

      const failures = data.filter((d, i) => !responses[i].ok);
      if (failures.length > 0) {
        // Show the specific failure message from the server to help identify invalid dates
        const failureMessage = failures[0].error || "Validation error";
        toast.error(
          `Failed to add ${failures.length} transaction(s): ${failureMessage}`
        );
      }
    } catch (error) {
      console.error("Error saving extracted transactions:", error);
      toast.error("Failed to save transactions. Please try again.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setDeletingTransaction(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      // Remove from local state
      setTransactions(transactions.filter((t) => t.id !== id));

      // Close confirm dialog and show success
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast.error(error.message || "Failed to delete transaction");
      setShowDeleteConfirm(false);
    } finally {
      setDeletingTransaction(false);
      setTransactionToDelete("");
    }
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      handleDeleteTransaction(transactionToDelete);
    }
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(
      transactions.map((t) =>
        t.id === updatedTransaction.id ? updatedTransaction : t
      )
    );
  };

  // Filtering logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory =
      filterCategory === "all" || t.category === filterCategory;
    const matchesDate =
      (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(t.date) <= new Date(dateRange.end));
    return matchesType && matchesCategory && matchesDate;
  });

  // Calculate totals and balances based on ALL transactions (global summary)
  const allExpenses = transactions.filter((t) => t.type === "expense");
  const allIncome = transactions.filter((t) => t.type === "income");

  const totalExpenses = allExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = allIncome.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  // Category totals for charts - still based on filtered data
  const categoryTotals = filteredTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  // Unique categories for filter dropdown to avoid key collisions
  const uniqueFilterCategories = Array.from(new Set([...expenseCategories, ...incomeCategories]));

  if (loading) {
    return <BudgetSkeletion />;
  }

  return (
    <div className="min-h-screen mac-bg bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
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
              <h3 className="text-sm font-medium mac-text-primary">
                Total Income
              </h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              ₹{totalIncome.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">
              {allIncome.length} transactions
            </p>
          </Card>

          {/* Total Expenses */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">
                Total Expenses
              </h3>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">
              ₹{totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">
              {allExpenses.length} transactions
            </p>
          </Card>

          {/* Net Balance */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full ${netBalance >= 0 ? "bg-blue-50" : "bg-red-50"
                  } flex items-center justify-center`}
              >
                <TrendingUp
                  className={`w-5 h-5 ${netBalance >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">
                Net Balance
              </h3>
            </div>
            <p
              className={`text-3xl font-bold mb-1 ${netBalance >= 0 ? "text-blue-600" : "text-red-600"
                }`}
            >
              ₹{netBalance.toLocaleString()}
            </p>
            <p className="text-xs mac-text-secondary">Current month</p>
          </Card>

          {/* Transactions */}
          <Card className="mac-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium mac-text-primary">
                Transactions
              </h3>
            </div>
            <p className="text-3xl font-bold mac-text-primary mb-1">
              {transactions.length}
            </p>
            <p className="text-xs mac-text-secondary">
              {allIncome.length} income • {allExpenses.length} expenses
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

            <Button
              className={buttonClassName}
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {/* Filters UI */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-foreground/[0.02] rounded-2xl border border-foreground/[0.05]">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Type</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="h-10 bg-background border-foreground/10 rounded-xl">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 bg-background border-foreground/10 rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueFilterCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">From</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="h-10 bg-background border-foreground/10 rounded-xl"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">To</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="h-10 bg-background border-foreground/10 rounded-xl"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setDateRange({ start: "", end: "" });
                }}
                className="h-10 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-all px-4 rounded-xl"
              >
                Reset
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-accent/5 rounded-lg">
              <div className="md:col-span-2">
                <Label>Transaction Type</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    className={`flex-1 ${transactionType === "expense" ? buttonClassName : ""
                      }`}
                    variant={
                      transactionType === "expense" ? "default" : "outline"
                    }
                    onClick={() => {
                      setTransactionType("expense");
                      setNewTransaction({
                        ...newTransaction,
                        type: "expense",
                        category: "",
                      });
                    }}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    type="button"
                    variant={
                      transactionType === "income" ? "default" : "outline"
                    }
                    onClick={() => {
                      setTransactionType("income");
                      setNewTransaction({
                        ...newTransaction,
                        type: "income",
                        category: "",
                      });
                    }}
                    className={`flex-1 ${transactionType === "income"
                      ? "bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all"
                      : ""
                      }`}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Income
                  </Button>
                </div>
              </div>
              <div>
                <Label className="mb-2">Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="mb-2">Category *</Label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, category: value })
                  }
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(transactionType === "expense"
                      ? expenseCategories
                      : incomeCategories
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">Date *</Label>
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                  className="glass-input"
                  max={
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                />
              </div>
              <div>
                <Label className="mb-2">Description</Label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  placeholder="What was this for?"
                  className="glass-input"
                  maxLength={500}
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button
                  className={buttonClassName}
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
                    "Add Transaction"
                  )}
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 bg-foreground/[0.02] rounded-2xl border border-dashed border-foreground/10">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium">No transactions found match your filters.</p>
              <Button
                variant="link"
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setDateRange({ start: "", end: "" });
                }}
                className="text-blue-600 mt-2"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {(showAllTransactions
                  ? filteredTransactions
                  : filteredTransactions.slice(0, 10)
                ).map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <div
                      key={t.id}
                      className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${isIncome
                        ? "bg-linear-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200/50 dark:border-green-800/30 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20"
                        : "bg-linear-to-r from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 border-r-200/50 dark:border-red-800/30 hover:shadow-lg hover:shadow-red-100/50 dark:hover:shadow-red-900/20"
                        } hover:scale-[1.01] hover:border-opacity-100`}
                    >
                      <div className="flex items-center gap-4 flex-1 ml-2">
                        {/* Icon with gradient background */}
                        <div
                          className={`p-2.5 rounded-xl ${isIncome
                            ? "bg-linear-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200/50 dark:shadow-green-900/30"
                            : "bg-linear-to-br from-red-400 to-rose-500 shadow-lg shadow-red-200/50 dark:shadow-red-900/30"
                            }`}
                        >
                          {isIncome ? (
                            <ArrowUpCircle className="w-5 h-5 text-white" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {t.description || t.category}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${isIncome
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                            >
                              {t.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(t.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Amount with gradient text */}
                        <p
                          className={`text-lg font-bold bg-linear-to-r ${isIncome
                            ? "from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
                            : "from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400"
                            } bg-clip-text text-transparent`}
                        >
                          {isIncome ? "+" : "-"}₹
                          {Number(t.amount).toLocaleString()}
                        </p>

                        {/* Action buttons with better styling */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTransaction(t)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransactionToDelete(t.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredTransactions.length > 10 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="w-full mt-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300"
                >
                  {showAllTransactions ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View All {filteredTransactions.length} Transactions
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </Card>

        {/* Smart Upload */}
        <SmartUpload
          userId={user?.id || ""}
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
              className="bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all"
            >
              {analyzingSpending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2 " />
                  {analysis ? "Refresh Analysis" : "Analyze Spending"}
                </>
              )}
            </Button>
          </div>

          {/* Interactive Charts */}
          <SpendingCharts transactions={filteredTransactions} analysis={analysis} />
        </Card>

        {/* Edit Transaction Dialog */}
        {editingTransaction && (
          <EditTransactionDialog
            transaction={editingTransaction!}
            open={!!editingTransaction}
            onOpenChange={(open) => !open && setEditingTransaction(null)}
            onTransactionUpdated={handleTransactionUpdated}
          />
        )}

        <ConfirmDialog
          title="DELETE TRANSACTION"
          subTitle="Are you sure you want to delete this transaction?"
          description="This action will permanently delete this transaction from the database."
          show={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          okClass="bg-red-400 hover:bg-red-400"
          titleClass="text-red-400"
        />

        <InfoDialog
          title="DELETED TRANSACTION"
          description="Your transaction has been permanently deleted successfully"
          open={showDeleteSuccess}
          closeLabel="OK"
          onClose={() => {
            setShowDeleteSuccess(false);
          }}
        />
      </main>
    </div>
  );
};

export default Budget;
