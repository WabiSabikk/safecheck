import Link from 'next/link';
import {
  ShieldCheck,
  ClipboardCheck,
  Thermometer,
  FileText,
  Clock,
  Smartphone,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PricingCards } from '@/components/billing/pricing-cards';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Digital Checklists',
    description: 'Pre-built opening & closing checklists. Tap to complete, no training needed.',
  },
  {
    icon: Thermometer,
    title: 'Temperature Logging',
    description: '30-second entries with instant validation. Auto-alerts when out of range.',
  },
  {
    icon: FileText,
    title: 'Inspector-Ready Reports',
    description: 'One-click PDF export. 30-60 days of compliance data, formatted for audits.',
  },
  {
    icon: Clock,
    title: 'Save 2 Hours/Day',
    description: 'Replace 120 minutes of paperwork with 10-20 minutes of tap-tap-done.',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'No WiFi in the walk-in? No problem. Syncs automatically when connected.',
  },
  {
    icon: DollarSign,
    title: 'Free Forever Plan',
    description: 'Checklists, temp logs, allergen tracking — all free. Upgrade only when you need premium features.',
  },
];

const comparisons = [
  { name: 'Jolt', price: '$90-300/mo', issue: 'App crashes 55% of the time', highlight: false },
  { name: 'FoodDocs', price: '€199/mo + €999 setup', issue: 'Expensive setup fee', highlight: false },
  { name: 'SafetyCulture', price: '$29/seat', issue: 'Per-seat pricing adds up fast', highlight: false },
  { name: 'SafeCheck', price: 'Free — $19/mo for premium', issue: 'Never fail an inspection again', highlight: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold">SafeCheck</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Start Free — No Credit Card
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 mb-6">
          <CheckCircle2 className="h-4 w-4" />
          FDA Food Code compliant
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Never Fail Another
          <br />
          <span className="text-emerald-600">Health Inspection.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A single failed inspection costs $10,000+ in fines, closure, and lost customers.
          SafeCheck keeps your restaurant compliant 24/7 — 100% free for your first restaurant.
          Set up in under 5 minutes. No credit card required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
              Start Free — No Credit Card
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Join restaurants that never worry about surprise inspections.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y bg-muted/50 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">What a failed inspection actually costs you:</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
            <span>$10K+ in fines</span>
            <span>Temporary closure</span>
            <span>Lost customers</span>
            <span>Bad press &amp; reviews</span>
            <span>Staff retraining</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Pass Every Inspection. Every Time.</h2>
          <p className="mt-2 text-muted-foreground">
            Built specifically for small restaurants with 1-10 locations. Set up in under 5 minutes.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <feature.icon className="h-8 w-8 text-emerald-600 mb-3" />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Free — less than a single health code violation fine.</h2>
            <p className="mt-2 text-muted-foreground">
              The average violation fine is $500-$1,000. SafeCheck pays for itself the first day.
            </p>
          </div>
          <div className="space-y-3">
            {comparisons.map((comp) => (
              <div
                key={comp.name}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  comp.highlight
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {comp.highlight ? (
                    <Star className="h-5 w-5 text-emerald-600 fill-emerald-600" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                  <div>
                    <span className={`font-medium ${comp.highlight ? 'text-emerald-700' : ''}`}>
                      {comp.name}
                    </span>
                    <p className="text-xs text-muted-foreground">{comp.issue}</p>
                  </div>
                </div>
                <span className={`font-bold ${comp.highlight ? 'text-emerald-600' : ''}`}>
                  {comp.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Protect your restaurant starting today.</h2>
          <p className="mt-2 text-muted-foreground">
            Start free. No credit card required. Upgrade when you&apos;re ready.
          </p>
        </div>
        <PricingCards mode="landing" />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
        <h2 className="text-3xl font-bold">Your next inspection could be tomorrow.</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Set up in under 5 minutes. Be inspection-ready before your shift ends today.
          No training required — your staff will get it instantly.
        </p>
        <Link href="/register" className="mt-8 inline-block">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
            Start Free — No Credit Card
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">SafeCheck</span>
            </div>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Never fail another health inspection. Free forever. Premium from $19/mo.
          </p>
        </div>
      </footer>
    </div>
  );
}
