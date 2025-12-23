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
                {/* Category Breakdown Pie Chart - Updated with Top-Right Legend List */}
                <Card className="p-6 relative">
                    <h4 className="font-semibold mb-4">Spending by Category</h4>

                    {/* Legend List - Top Right */}
                    <div className="absolute top-6 right-6 inline-block items-center gap-2 bg-blue-100 text-blue-700 px-6 py-2 rounded-sm text-sm font-medium mb-6">
                        <h5 className="font-medium text-sm mb-3 text-foreground tracking-tight">Category Breakdown</h5>
                        <ul className="space-y-2 text-xs">
                            {categoryLegend.map((item, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="font-medium text-foreground truncate">{item.name}</span>
                                    {/* <span className="text-muted-foreground ml-auto">₹{item.value.toLocaleString()}</span> */}
                                    <span className="text-muted-foreground">({item.percent}%)</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip labelClassName='text-foreground ' wrapperClassName='rounded-sm'
                                formatter={(value: number, name: string, props: any) => {
                                    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                                    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return [`₹${value.toLocaleString()} (${percent}%)`, name];
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
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