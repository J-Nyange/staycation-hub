import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, ShieldAlert } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function AdminGuard({ children, requireAdmin = true }: AdminGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isAdmin, isModerator, isLoading } = useUserRole();

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const hasAccess = requireAdmin ? isAdmin : isModerator;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
