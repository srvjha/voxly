import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:opacity-90"
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Pulse Board</span>
          </Link>

          <nav className="flex items-center gap-2">
            <SignedIn>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                My Polls
              </Button>
              <Button size="sm" onClick={() => navigate("/polls/new")}>
                New Poll
              </Button>
              <div className="ml-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Sign up</Button>
              </SignUpButton>
            </SignedOut>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
