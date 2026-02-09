"use client"
import { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { Transaction } from '@/types/transactions';

interface SpendingChartsProps {
    transactions: Transaction[];
    analysis?: {
        summary: string;
        insights: string[];
        recommendations: string[];
        savingsOpportunities: string[];
    };
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function SpendingCharts({ transactions, analysis }: SpendingChartsProps) {
    // Category breakdown data
    const categoryData = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.type === 'expense') {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
            }
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Income vs Expenses data
    const incomeVsExpenses = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return [
            { name: 'Income', value: income, fill: '#10b981' },
            { name: 'Expenses', value: expenses, fill: '#ef4444' },
        ];
    }, [transactions]);

    // Spending trends over time (last 30 days)
    const trendData = useMemo(() => {
        const dailyData: Record<string, { date: string; income: number; expenses: number }> = {};

        // Get last 30 days
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = { date: dateStr, income: 0, expenses: 0 };
        }

        // Aggregate transactions by date
        transactions.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                if (t.type === 'income') {
                    dailyData[dateStr].income += Number(t.amount);
                } else {
                    dailyData[dateStr].expenses += Number(t.amount);
                }
            }
        });

        return Object.values(dailyData).map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: d.income,
            expenses: d.expenses,
        }));
    }, [transactions]);

    // Category legend list with percentages
    const categoryLegend = useMemo(() => {
        const total = categoryData.reduce((sum, item) => sum + item.value, 0);
        return categoryData.map((entry, index) => {
            const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
            return {
                name: entry.name,
                value: entry.value,
                percent,
                color: COLORS[index % COLORS.length]
            };
        });
    }, [categoryData]);

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Add transactions to see visual insights</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Category Breakdown Pie Chart - Fixed Overlap */}
                <Card className="p-6">
                    <h4 className="font-semibold mb-6">Spending by Category</h4>

                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="w-full lg:w-1/2 min-h-[300px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        labelClassName='text-foreground'
                                        wrapperClassName='rounded-xl shadow-2xl border-0 !bg-background/80 backdrop-blur-md'
                                        formatter={(value: number, name: string) => {
                                            const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return [`₹${value.toLocaleString()} (${percent}%)`, name];
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend List - Side by Side */}
                        <div className="w-full lg:w-1/2 space-y-4">
                            <h5 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 mb-4 px-1">
                                Category Breakdown
                            </h5>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                {categoryLegend.map((item, index) => (
                                    <li key={index} className="flex items-center gap-3 p-2 rounded-xl bg-foreground/[0.02] border border-foreground/[0.05] transition-all hover:bg-foreground/[0.04]">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div className="flex-1 flex justify-between items-center min-w-0">
                                            <span className="text-sm font-medium text-foreground truncate mr-2">{item.name}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs font-bold text-foreground">₹{item.value.toLocaleString()}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-md bg-foreground/5">
                                                    {item.percent}%
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Income vs Expenses Bar Chart */}
                <Card className="p-6">
                    <h4 className="font-semibold mb-4">Income vs Expenses</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeVsExpenses}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip labelClassName='text-foreground ' wrapperClassName='rounded-sm'
                                formatter={(value: number) => `₹${value.toLocaleString()}`}
                            />
                            <Bar dataKey="value" fill="#8884d8">
                                {incomeVsExpenses.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Spending Trends Line Chart */}
            <Card className="p-6">
                <h4 className="font-semibold mb-4">Spending Trends (Last 30 Days)</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                            labelClassName='text-foreground '
                            wrapperClassName='rounded-sm'
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* AI Insights (if available) */}
            {analysis && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h4 className="font-semibold mb-3">💡 Key Insights</h4>
                        <ul className="space-y-2">
                            {analysis.insights.slice(0, 3).map((insight, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-blue-600">•</span>
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-6">
                        <h4 className="font-semibold mb-3">✓ Recommendations</h4>
                        <ul className="space-y-2">
                            {analysis.recommendations.slice(0, 3).map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-blue-600">
                                    <span>✓</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            )}
        </div>
    );
}