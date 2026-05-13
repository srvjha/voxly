import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="text-center text-muted-foreground py-12">Loading…</div>
    );
  }
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
}
