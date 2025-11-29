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
