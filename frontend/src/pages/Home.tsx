import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Clock, Users, Lock } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Live analytics",
    desc: "Watch responses tally in real time as people answer.",
  },
  {
    icon: Clock,
    title: "Auto-expiry",
    desc: "Set a deadline; the poll closes itself when time's up.",
  },
  {
    icon: Users,
    title: "Anonymous or signed-in",
    desc: "Pick the mode that fits your audience.",
  },
  {
    icon: Lock,
    title: "Locked structure",
    desc: "Once responses arrive, the questions are frozen for fairness.",
  },
];

export function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Run pulse polls in <span className="text-primary">seconds</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Build a quick poll, share the link, watch the answers stream in. Then
          publish the results when you're ready.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <SignedIn>
            <Link to="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
            <Link to="/polls/new">
              <Button size="lg" variant="outline">
                New poll
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg">Get started</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/15 p-2 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle>{f.title}</CardTitle>
              </div>
              <CardDescription className="pt-1">{f.desc}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  );
}
