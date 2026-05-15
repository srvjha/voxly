import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VoxlyMark } from "@/components/VoxlyMark";


export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={[
          "fixed left-1/2 -translate-x-1/2 z-[100]",
          "flex items-center justify-between",
          "border transition-all duration-500",
          scrolled
            ? "top-5 w-[calc(100%-32px)] max-w-[860px] px-4 sm:px-5 py-2.5 rounded-full glass border-transparent"
            : "top-0 w-full max-w-none px-[clamp(20px,5vw,64px)] py-4 rounded-none bg-transparent border-transparent shadow-none",
        ].join(" ")}
        style={{
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Link
          to="/"
          aria-label="Voxly home"
          className="flex items-center gap-2 group"
        >
          <VoxlyMark size={28} />
          <span className="font-display font-bold tracking-tight text-[22px] text-foreground">
            Voxly
          </span>
        </Link>

        {isLanding && (
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <SignedIn>
              <RouterNavLink to="/dashboard">My polls</RouterNavLink>
            </SignedIn>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <SignedIn>
            {!isLanding && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hidden sm:inline-flex"
              >
                My polls
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate("/polls/new")}
              className="rounded-full shadow-orange-cta"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #F97316 0%, #EA6A00 100%)",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
              }}
            >
              <Plus className="h-4 w-4" /> Create Poll
            </Button>
            <ThemeToggle />
            <div className="ml-1 pl-2 border-l border-border/40">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="hidden sm:inline-flex items-center text-sm font-semibold text-foreground/85 hover:text-primary px-3 py-1.5 transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                size="sm"
                className="rounded-full text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #F97316 0%, #EA6A00 100%)",
                  boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                }}
              >
                Create Poll
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </SignUpButton>
            <ThemeToggle />
          </SignedOut>
        </div>
      </header>

      {/*
        Landing page handles its own full-bleed sections (incl. hero & footer).
        Inner app pages stay constrained for readability.
      */}
      {isLanding ? (
        <main className="pt-20">
          <Outlet />
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-6 py-10 pt-24">
          <Outlet />
        </main>
      )}
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group relative text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute left-1/2 -bottom-2 h-1 w-1 rounded-full bg-primary opacity-0 -translate-x-1/2 transition-opacity group-hover:opacity-100"
      />
    </a>
  );
}

function RouterNavLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute left-1/2 -bottom-2 h-1 w-1 rounded-full bg-primary opacity-0 -translate-x-1/2 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}

