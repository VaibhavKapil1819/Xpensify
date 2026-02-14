"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DashboardNav from "@/components/DashboardNav";
import { toast } from "sonner";
import {
    User,
    Mail,
    Target,
    TrendingUp,
    DollarSign,
    BrainCircuit,
    Save,
    Loader2,
    ChevronRight
} from "lucide-react";

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // State for form fields
    const [fullName, setFullName] = useState("");
    const [primaryGoal, setPrimaryGoal] = useState("");
    const [riskLevel, setRiskLevel] = useState("moderate");
    const [currency, setCurrency] = useState("USD");
    const [knowledgeLevel, setKnowledgeLevel] = useState("beginner");

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "");
            setPrimaryGoal(user.primary_goal || "");
            setRiskLevel(user.risk_level || "moderate");
            setCurrency(user.currency || "USD");
            // Fetch extended profile data (knowledge level etc)
            fetchExtendedProfile();
        }
    }, [user]);

    const fetchExtendedProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.learning_preferences) {
                    setKnowledgeLevel(data.learning_preferences.knowledge_level || "beginner");
                }
            }
        } catch (error) {
            console.error("Error fetching extended profile:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName,
                    primaryGoal,
                    riskLevel,
                    currency,
                    knowledgeLevel
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Profile updated successfully!");
                if (user) {
                    setUser({
                        ...user,
                        full_name: fullName,
                        primary_goal: primaryGoal,
                        risk_level: riskLevel as any,
                        currency: currency
                    });
                }
            } else {
                toast.error(data.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("An error occurred while updating profile");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background pattern-grid">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pattern-grid pb-12 pt-24">
            <DashboardNav />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                <div className="flex flex-col gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-4xl font-bold text-foreground/90 tracking-tight">Profile Settings</h1>
                    <p className="text-foreground/50">Manage your account and personalized financial identity</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Settings */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                                    <User size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground/80">Personal Information</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground/60">Full Name</Label>
                                    <div className="relative group">
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="glass-input transition-all pl-4"
                                            placeholder="Your name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-foreground/60">Email Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="glass-input bg-foreground/[0.02] border-dashed text-foreground/40 cursor-not-allowed pl-4"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20">
                                            <Mail size={16} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-foreground/30 italic">Email cannot be changed for security</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                                    <Target size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground/80">Financial Identity</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryGoal" className="text-sm font-medium text-foreground/60">Primary Goal</Label>
                                    <Input
                                        id="primaryGoal"
                                        value={primaryGoal}
                                        onChange={(e) => setPrimaryGoal(e.target.value)}
                                        className="glass-input pl-4 h-12"
                                        placeholder="e.g., Save for a house"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Label className="text-sm font-medium text-foreground/60 mb-3 block">Risk Appetite</Label>
                                    <RadioGroup value={riskLevel} onValueChange={setRiskLevel} className="grid grid-cols-3 gap-3">
                                        {['conservative', 'moderate', 'aggressive'].map((level) => (
                                            <div key={level} className="relative">
                                                <RadioGroupItem value={level} id={level} className="sr-only" />
                                                <label
                                                    htmlFor={level}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center h-20 ${riskLevel === level
                                                            ? 'bg-blue-600/10 border-blue-500 text-blue-600 shadow-sm'
                                                            : 'bg-foreground/[0.02] border-foreground/5 text-foreground/40 hover:border-foreground/20'
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-wider">{level}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="pt-2">
                                    <Label className="text-sm font-medium text-foreground/60 mb-3 block">Knowledge Level</Label>
                                    <RadioGroup value={knowledgeLevel} onValueChange={setKnowledgeLevel} className="grid grid-cols-3 gap-3">
                                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                                            <div key={level} className="relative">
                                                <RadioGroupItem value={level} id={`k-${level}`} className="sr-only" />
                                                <label
                                                    htmlFor={`k-${level}`}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center h-20 ${knowledgeLevel === level
                                                            ? 'bg-blue-600/10 border-blue-500 text-blue-600 shadow-sm'
                                                            : 'bg-foreground/[0.02] border-foreground/5 text-foreground/40 hover:border-foreground/20'
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-wider">{level}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                                    <DollarSign size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground/80">Preferences</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground/60">Preferred Currency</Label>
                                    <RadioGroup value={currency} onValueChange={setCurrency} className="space-y-2">
                                        {[
                                            { code: 'USD', symbol: '$' },
                                            { code: 'INR', symbol: '₹' },
                                            { code: 'EUR', symbol: '€' },
                                            { code: 'GBP', symbol: '£' },
                                        ].map((cur) => (
                                            <div key={cur.code} className="relative">
                                                <RadioGroupItem value={cur.code} id={cur.code} className="sr-only" />
                                                <label
                                                    htmlFor={cur.code}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${currency === cur.code
                                                            ? 'bg-blue-600/10 border-blue-500 text-blue-600'
                                                            : 'bg-foreground/[0.02] border-foreground/5 text-foreground/60 hover:border-foreground/20'
                                                        }`}
                                                >
                                                    <span className="font-bold">{cur.code}</span>
                                                    <span className="text-lg opacity-60">{cur.symbol}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </Card>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-premium h-14 text-lg font-bold shadow-[var(--shadow-glow)] group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            {loading ? "Updating..." : "Save Changes"}
                        </Button>

                        <Card className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                            <div className="flex gap-3">
                                <BrainCircuit className="text-blue-500 shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">AI Adaptation</p>
                                    <p className="text-[10px] text-foreground/60 leading-relaxed">
                                        Changing these settings will cause Finley and Ava to re-calibrate their coaching strategies for you.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
