import Link from 'next/link';
import { ShieldCheck, ArrowRight, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAllPosts } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Food Safety Blog',
  description:
    'Practical guides on food safety compliance, health inspections, HACCP plans, and temperature management for restaurants.',
  openGraph: {
    title: 'Food Safety Blog | SafeCheck',
    description:
      'Practical guides on food safety compliance, health inspections, HACCP plans, and temperature management for restaurants.',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold">SafeCheck</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-emerald-600">
                Blog
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Food Safety <span className="text-emerald-600">Blog</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Practical guides to help your restaurant stay compliant, pass
          inspections, and keep customers safe.
        </p>
      </section>

      {/* Post List */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>
                  <h2 className="text-xl font-semibold leading-tight">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold">
            Ready to simplify food safety compliance?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Replace paper logs with digital checklists your team will actually
            use. Starting at $19/month.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">SafeCheck</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Food safety compliance for small restaurants.
          </p>
        </div>
      </footer>
    </div>
  );
}
