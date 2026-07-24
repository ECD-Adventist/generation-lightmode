import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function LegalDocument({ title, summary, sections }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <Link to="/Feed" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="h-4 w-4" /> Back to Feed
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal Document</p><h1 className="mt-1 text-3xl font-bold text-balance sm:text-4xl">{title}</h1></div>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{summary}</p>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 24, 2026</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-10 sm:px-8 sm:py-14">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-bold text-card-foreground">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">{section.content}</p>
          </section>
        ))}
        <p className="pt-4 text-center text-sm text-muted-foreground">Questions? Contact lightmode@ecd.adventist.org.</p>
      </main>
    </div>
  );
}