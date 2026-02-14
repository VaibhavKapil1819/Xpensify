import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import DashboardNav from "@/components/DashboardNav";
// A skeleton loader for the dashboard page
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Financial Wellness Score */}
        <Card className="mac-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-80 mt-2" />
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Today's Focus */}
          <Card className="mac-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4 mt-2" />
          </Card>

          {/* Learning Streak */}
          <Card className="mac-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-48 mt-1" />
          </Card>
        </div>

        {/* Active Goals */}
        <Card className="mac-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-4 mac-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Skeleton className="h-5 w-48 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))}
          </div>
        </Card>

        {/* Next Milestone */}
        <Card className="mac-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-5 w-full mb-1" />
          <Skeleton className="h-5 w-3/4 mb-4" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </main>
    </div>
  );
}

// A skeleton loader for the profile page
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pattern-grid pb-12 pt-24">
      <DashboardNav />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8 animate-fade-in">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 opacity-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </Card>

            {/* Financial Identity Card */}
            <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Preferences Card */}
            <Card className="p-6 glass-card border-slate-200/50 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-36 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </Card>

            {/* Save Button Skeleton */}
            <Skeleton className="w-full h-14 rounded-xl shadow-lg" />

            {/* AI Adaptation Card Skeleton */}
            <Card className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-fade-in">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
