import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import {
  ArrowRight,
  Play,
  Star,
  PlusCircle,
  Share2,
  BarChart3,
  ClipboardList,
  Link2,
  Radio,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "@/components/HeroBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { XIcon, LinkedinIcon, GithubIcon } from "@/components/BrandIcons";
import { VoxlyMark } from "@/components/VoxlyMark";

export function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[100vh] flex flex-col items-center justify-start pt-12 pb-24 px-5">
      <HeroBackground />

      <div className="relative w-full max-w-[880px] mx-auto text-center flex flex-col items-center">
        {/* Live Badge */}
        <Badge
          variant="outline"
          className="hero-badge gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
        >
          <span className="live-dot" aria-hidden="true" />
          Live responses. Real time.
        </Badge>

        {/* Headline */}
        <h1
          className="hero-headline mt-6 font-display font-extrabold leading-[1.05] text-foreground text-balance"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
        >
          Live{" "}<span className="gradient-orange">Polls</span> with <span className="gradient-blue"> Real Responses</span> and Zero Hassle
        </h1>

        {/* Subheading */}
        <p className="hero-sub mt-5 text-muted-foreground max-w-[620px] mx-auto text-[18px] leading-relaxed text-balance">
          Build a poll in seconds, share one link, watch answers stream in.
        </p>

        {/* CTAs */}
        <div className="hero-ctas mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignedIn>
            <Link to="/polls/new">
              <PrimaryHeroBtn>
                Create Poll
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </PrimaryHeroBtn>
            </Link>
            <Link to="/dashboard">
              <SecondaryHeroBtn>
                <LayoutDashboard className="h-4 w-4" />
                Go to dashboard
              </SecondaryHeroBtn>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="modal">
              <PrimaryHeroBtn>
                Create Poll
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </PrimaryHeroBtn>
            </SignUpButton>
            <a href="#how-it-works">
              <SecondaryHeroBtn>
                <Play className="h-4 w-4" />
                See how it works
              </SecondaryHeroBtn>
            </a>
          </SignedOut>
        </div>

        {/* Social proof strip */}
        <div className="hero-proof mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-sm">
          <div className="flex items-center gap-3">
            <AvatarStack />
            <span className="text-muted-foreground">
              <strong className="text-foreground">100+</strong> polls created
              this week
            </span>
          </div>
          
          <span className="hidden sm:inline-block h-4 w-px bg-border" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">No signup</strong> required to
            respond
          </span>
        </div>

        {/* Hero Preview Card */}
        <div className="hero-card relative mt-14 w-full max-w-[680px]">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}

function PrimaryHeroBtn({ children }: { children: React.ReactNode }) {
  return (
    <Button
      size="lg"
      className="group h-auto rounded-full px-8 py-3.5 text-base font-bold text-white bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-500 hover:to-orange-700 hover:-translate-y-0.5 transition-all shadow-[0_6px_24px_rgba(249,115,22,0.40)] hover:shadow-[0_10px_30px_rgba(249,115,22,0.55)]"
    >
      {children}
    </Button>
  );
}

function SecondaryHeroBtn({ children }: { children: React.ReactNode }) {
  return (
    <Button
      size="lg"
      variant="outline"
      className="h-auto rounded-full px-8 py-3.5 text-base font-semibold border-[1.5px] hover:border-orange-400 hover:text-orange-500 hover:bg-transparent"
    >
      {children}
    </Button>
  );
}

function AvatarStack() {
  const seeds = ["asha", "ravi", "meera"];
  return (
    <div className="flex -space-x-2">
      {seeds.map((seed) => (
        <img
          key={seed}
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
          alt=""
          className="h-7 w-7 rounded-full border-2 border-background bg-elevated"
          loading="lazy"
        />
      ))}
    </div>
  );
}

function HeroPreviewCard() {
  const bars = [
    { label: "Real-time analytics", pct: 58 },
    { label: "Cross-poll comparison", pct: 24 },
    { label: "Embedded widget", pct: 12 },
    { label: "Custom domain", pct: 6 },
  ];

  return (
    <Card
      className="glass rounded-[20px] p-5 sm:p-6 border-white/40 dark:border-white/10 shadow-2xl"
      style={{ transform: "perspective(1200px) rotateX(4deg)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 text-left">
        <div>
          <div className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground">
            Poll · Q3 Feedback
          </div>
          <div className="mt-1 font-display font-semibold text-foreground text-[15px] sm:text-base">
            Which feature matters most to you?
          </div>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
        >
          <span className="live-dot" aria-hidden="true" />
          Live
        </Badge>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label} className="text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-foreground/80">{b.label}</span>
              <span className="font-mono tabular-nums text-foreground">
                {b.pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-elevated/80 overflow-hidden">
              <div
                className="h-full rounded-full bar-fill bg-gradient-to-r from-orange-500 to-orange-700"
                style={
                  {
                    ["--fill-width" as never]: `${b.pct}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">128 responses</strong>
        </span>
        <span className="font-mono">Updated just now</span>
      </div>
    </Card>
  );
}

/* ══ FEATURES ════════════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-[clamp(64px,8vw,120px)] px-[clamp(20px,5vw,80px)]"
    >
      <div className="absolute inset-0 rangoli-dots pointer-events-none" />
      <div className="relative max-w-[1200px] mx-auto">
        <SectionHeader
          title="Built for the speed of now"
          subtitle="From question to insight in under a minute."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={PlusCircle}
            tone="orange"
            title="Build in minutes"
            body="Add questions, set expiry, choose anonymous or authenticated. Done."
          />
          <FeatureCard
            icon={Share2}
            tone="blue"
            title="One link, anywhere"
            body="Share your poll link on WhatsApp, email, or social. No app needed to respond."
          />
          <FeatureCard
            icon={BarChart3}
            tone="gradient"
            title="Live results, always"
            body="Watch responses arrive in real time. Publish final results when you're ready."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "orange" | "blue" | "gradient";
  title: string;
  body: string;
}) {
  const accentBar = {
    orange: "bg-gradient-to-r from-orange-500 to-transparent",
    blue: "bg-gradient-to-r from-blue-500 to-transparent",
    gradient: "bg-gradient-to-r from-orange-500 to-blue-500",
  }[tone];

  const iconWrap = {
    orange: "bg-orange-500/10 text-orange-500",
    blue: "bg-blue-500/10 text-blue-500",
    gradient:
      "bg-gradient-to-br from-orange-500/15 to-blue-500/15 text-orange-500",
  }[tone];

  return (
    <Card className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-[250ms] ease-out hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentBar}`} />
      <div
        className={`inline-flex h-14 w-14 items-center justify-center rounded-full mb-5 ${iconWrap}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display font-bold text-foreground text-xl">
        {title}
      </h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

/* ══ HOW IT WORKS ════════════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-[clamp(64px,8vw,120px)] px-[clamp(20px,5vw,80px)] bg-blue-900/10"
      
    >
       {/* Rangoli dot field */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto">
        <SectionHeader
          title="Three steps. That's it."
          subtitle="Get from idea to insight in less than a minute."
        />

        <div className="mt-14 relative">
          {/* Dashed connector — sits behind icons, masked by their solid bg */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-[56px] left-[18%] right-[18%] h-px border-t-2 border-dashed border-orange-500/35 pointer-events-none z-0"
          />
          <div className="relative z-[1] grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            <Step
              number="01"
              icon={ClipboardList}
              title="Create Your Poll"
              body="Pick a question type, write your prompt, set an expiry. Voxly handles the rest."
            />
            <Step
              number="02"
              icon={Link2}
              title="Share the Link"
              body="One shareable URL. Drop it in WhatsApp, email, Slack, or your stream chat."
            />
            <Step
              number="03"
              icon={Radio}
              title="Watch Live"
              body="Responses stream in instantly. Publish the final results in a single click."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  body,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center px-2">
      {/* Solid disc — matches section bg so dashed connector is masked behind it */}
      <div
        className="relative inline-flex h-[88px] w-[88px] items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--color-bg-warm)" }}
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)]">
          <Icon className="h-6 w-6" />
        </div>
        {/* Step number chip — anchored to the disc */}
        <span
          className="absolute -top-1 -right-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold text-orange-600 bg-orange-500/15 border border-orange-500/40"
        >
          {number}
        </span>
      </div>
      <h3 className="mt-5 font-display font-bold text-foreground text-xl">
        {title}
      </h3>
      <p className="mt-2 text-muted-foreground max-w-xs">{body}</p>
    </div>
  );
}

/* ══ TESTIMONIALS ════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "We replaced three different polling tools with Voxly. The real-time tallies on stream are unreal.",
      name: "Priya N.",
      role: "Community Lead, OpenChai",
      seed: "priya",
    },
    {
      quote:
        "Set it up during a town hall. Had 200 responses in 8 minutes. No one needed an account.",
      name: "Rahul S.",
      role: "PM, Hyderabad",
      seed: "rahul",
    },
    {
      quote:
        "The cleanest poll product I've used since Slido. Honestly, just better.",
      name: "Ananya K.",
      role: "Designer, Bengaluru",
      seed: "ananya",
    },
  ];

  return (
    <section className="relative py-[clamp(64px,8vw,120px)] px-[clamp(20px,5vw,80px)]">
      <div className="max-w-[1200px] mx-auto">
        <SectionHeader
          title="What people are saying"
          subtitle="From community managers to founders — Voxly is the polling tool they wished existed."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="rounded-2xl bg-white/70 dark:bg-card/80 backdrop-blur-xl border border-orange-500/15 shadow-md hover:shadow-lg"
            >
              <CardContent className="p-6 pt-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-orange-500 text-orange-500"
                    />
                  ))}
                </div>
                <p className="italic text-foreground/90 leading-relaxed text-base">
                  "{t.quote}"
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}`}
                    alt=""
                    className="h-10 w-10 rounded-full bg-elevated"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ FINAL CTA ═══════════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section
      id="pricing"
      className={[
        "relative py-[clamp(48px,6vw,80px)] px-[clamp(20px,5vw,80px)] overflow-hidden",
        // Light mode: warm cream → indigo wash so the dark "Ready" heading reads
        "bg-gradient-to-br from-orange-50 via-orange-100/60 to-indigo-100",
        // Dark mode: keep the subtle dark indigo tint that was already there
        "dark:bg-blue-900/10 dark:from-transparent dark:via-transparent dark:to-transparent",
      ].join(" ")}
    >
      {/* Rangoli dot field — orange in light, white in dark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "rgba(249, 115, 22, 0.35)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none hidden dark:block opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-[760px] mx-auto text-center">
        <h2
          className="font-display font-extrabold leading-[1.15] text-blue-950 dark:text-white"
          style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)" }}
        >
          Ready to hear from your audience?
        </h2>
        <p className="mt-3 text-blue-950/70 dark:text-white/85 text-[16px] max-w-[520px] mx-auto">
          Spin up your first poll in seconds. No credit card, no signup required
          to respond.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignedIn>
            <Link to="/polls/new">
              <FinalCTAButton>
                Create Your First Poll — Free
                <ArrowRight className="h-4 w-4" />
              </FinalCTAButton>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="modal">
              <FinalCTAButton>
                Create Your First Poll — Free
                <ArrowRight className="h-4 w-4" />
              </FinalCTAButton>
            </SignUpButton>
          </SignedOut>
        </div>

        <p className="mt-3 text-[13px] text-blue-950/60 dark:text-white/70">
          No account needed to respond
        </p>
      </div>
    </section>
  );
}

function FinalCTAButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      size="lg"
      className={[
        "h-auto rounded-full px-8 py-3.5 text-base font-bold hover:scale-[1.03] transition-all",
        // Light: filled orange (inverted from the dark variant) so it pops on cream bg
        "bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-500 hover:to-orange-600 shadow-[0_8px_24px_rgba(249,115,22,0.35)]",
        // Dark: keep the original white pill with orange text
        "dark:bg-white dark:from-white dark:to-white dark:text-orange-500 dark:hover:bg-white dark:hover:text-orange-600 dark:shadow-[0_8px_24px_rgba(0,0,0,0.20)]",
      ].join(" ")}
    >
      {children}
    </Button>
  );
}

/* ══ FOOTER ══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer
      className={[
        "relative",
        // Light: cream-tinted footer with dark text
        "bg-orange-50/60 border-t border-orange-200/60 text-blue-950/70",
        // Dark: original deep indigo, unchanged
        "dark:bg-blue-950 dark:border-transparent dark:text-white/75",
      ].join(" ")}
    >
      <div className="max-w-[1200px] mx-auto px-[clamp(20px,5vw,80px)] py-14 flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <VoxlyMark size={28} />
            <span className="font-display font-bold text-blue-950 dark:text-white text-xl tracking-tight">
              Voxly
            </span>
          </div>
          <p className="text-blue-950/60 dark:text-white/60 text-sm max-w-[260px] leading-relaxed">
            Polls that pulse. Feedback that flows.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <SocialIcon href="https://twitter.com" label="Twitter / X">
              <XIcon size={14} />
            </SocialIcon>
            <SocialIcon href="https://linkedin.com" label="LinkedIn">
              <LinkedinIcon size={14} />
            </SocialIcon>
            <SocialIcon href="https://github.com" label="GitHub">
              <GithubIcon size={14} />
            </SocialIcon>
          </div>
        </div>

        <div>
          <div className="font-display font-semibold text-blue-950 dark:text-white mb-4">
            Explore
          </div>
          <ul className="space-y-2.5 text-sm">
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#how-it-works">How It Works</FooterLink>
          </ul>
        </div>
      </div>

      {/* Giant VOXLY wordmark — faint orange in light, faint white in dark */}
      <div className="relative max-w-[1400px] mx-auto px-[clamp(20px,5vw,80px)] pb-2 -mb-2 select-none">
        <div
          aria-hidden="true"
          className={[
            "font-display font-extrabold leading-none tracking-[-0.04em] text-center",
            // Light mode wordmark — faint orange so it reads on the cream bg
            "text-orange-500/12",
            // Dark mode wordmark — gradient (kept as inline style below)
            "dark:text-transparent",
          ].join(" ")}
          style={{ fontSize: "clamp(5rem, 22vw, 22rem)" }}
        >
          <span
            className="dark:bg-clip-text dark:[-webkit-text-fill-color:transparent]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            VOXLY
          </span>
        </div>
      </div>

      <div className="border-t border-orange-200/60 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-[clamp(20px,5vw,80px)] py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-blue-950/55 dark:text-white/45">
          <span>
            © {new Date().getFullYear()} Voxly. Made with chai in India.
          </span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        className="text-blue-950/65 hover:text-blue-950 dark:text-white/60 dark:hover:text-white transition-colors"
      >
        {children}
      </a>
    </li>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/8 text-blue-950/65 hover:text-blue-950 hover:bg-orange-500/15 dark:bg-white/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
    >
      {children}
    </a>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h2
        className="font-display font-bold text-foreground leading-tight"
        style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground text-[18px]">{subtitle}</p>
    </div>
  );
}
