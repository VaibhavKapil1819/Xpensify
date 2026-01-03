import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      navigate.replace("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="animate-fade-in">
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
