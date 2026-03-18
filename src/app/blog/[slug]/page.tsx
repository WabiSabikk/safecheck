import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: `${post.title} | SafeCheck Blog`,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.date,
      },
    };
  } catch {
    return {
      title: 'Post Not Found',
    };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Blog post content is generated from trusted local markdown files
 * in content/blog/*.md at build time via remark. These files are
 * part of the repository (not user-submitted), so XSS risk is minimal.
 */
function ArticleBody({ html }: { html: string }) {
  return (
    <div
      className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-td:py-2 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-1 prose-hr:my-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }

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

      {/* Back link */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article className="mx-auto max-w-3xl px-4 pt-6 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground italic">
            {post.excerpt}
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
          </div>
          <hr className="mt-6" />
        </header>

        {/* Article Body — content sourced from trusted local markdown files */}
        <ArticleBody html={post.contentHtml} />

        {/* CTA Block */}
        <div className="mt-12 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600 mb-4" />
          <h2 className="text-2xl font-bold">
            Simplify food safety with SafeCheck
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Digital checklists, temperature logging, and inspection-ready
            reports. Set up in 5 minutes, starting at $19/month.
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
          <p className="mt-3 text-sm text-muted-foreground">
            No credit card required. Free plan available.
          </p>
        </div>
      </article>

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
