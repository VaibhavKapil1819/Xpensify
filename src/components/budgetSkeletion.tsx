import React from "react";

import DashboardNav from "./DashboardNav";

import { Card } from "./ui/card";

import { Skeleton } from "./ui/skeleton";

const BudgetSkeletion = () => {
  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}

        <div className="mb-8 animate-fade-in">
          <Skeleton className="h-10 w-64 mb-2" />

          <Skeleton className="h-6 w-96" />
        </div>

        {/* Summary Cards */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mac-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />

                <Skeleton className="h-6 w-32" />
              </div>

              <Skeleton className="h-8 w-40 mb-2" />

              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>

        {/* Transactions Section */}

        <Card className="mac-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />

            <Skeleton className="h-10 w-32" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 mac-card">
                <Skeleton className="w-10 h-10 rounded-full" />

                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />

                  <Skeleton className="h-4 w-32" />
                </div>

                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default BudgetSkeletion;
