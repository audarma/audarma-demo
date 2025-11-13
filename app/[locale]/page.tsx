"use client";

import { AudarProvider, ViewTranslationProvider } from "audarma";
import { useEffect, useState } from "react";
import { useAudarmaConfig } from "@/lib/audarma-config";
import { getTopStories, getStorySummary, type HNStory } from "@/lib/hackernews";
import { StoryCard } from "@/components/story-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GlobalStats } from "@/components/global-stats";
import { TranslatedText } from "@/components/translated-text";
import { IconBrandGithub, IconBrandNpm, IconTrash } from "@tabler/icons-react";
import { useLocale } from "next-intl";
import Image from "next/image";

export default function DemoPage() {
  const [stories, setStories] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(true);
  const config = useAudarmaConfig();
  const currentLocale = useLocale();

  // Debug: Log locale changes
  useEffect(() => {
    console.log('[Demo Page] Current locale:', currentLocale);
  }, [currentLocale]);

  const handleClearCache = () => {
    if (
      confirm(
        "Clear all translation cache? This will force re-translation of all content."
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const data = await getTopStories(8); // Fetch top 8 stories
      setStories(data);
      setLoading(false);
    };

    fetchStories();
  }, []);

  // Prepare translation items - stories + all UI text
  const uiTexts = [
    { contentType: "ui", contentId: "header_title", text: "Audarma Demo" },
    {
      contentType: "ui",
      contentId: "header_subtitle",
      text: "LLM-powered translation with live Hacker News headlines",
    },
    {
      contentType: "ui",
      contentId: "stories_heading",
      text: "Latest Tech Stories from Hacker News",
    },
    {
      contentType: "ui",
      contentId: "stories_desc",
      text: "Switch languages to see real-time LLM translation with smart caching",
    },
    {
      contentType: "ui",
      contentId: "stats_heading",
      text: "Global Usage (All Users)",
    },
    {
      contentType: "ui",
      contentId: "stats_translations",
      text: "Translations:",
    },
    { contentType: "ui", contentId: "stats_tokens", text: "Tokens:" },
    { contentType: "ui", contentId: "stats_cost", text: "Total Cost:" },
    {
      contentType: "ui",
      contentId: "stats_powered",
      text: "Powered by Cerebras Qwen3 (free tier)",
    },
    { contentType: "ui", contentId: "how_heading", text: "How It Works" },
    {
      contentType: "ui",
      contentId: "how_step1",
      text: "Select a language from the dropdown",
    },
    {
      contentType: "ui",
      contentId: "how_step2",
      text: "Watch stories translate in real-time",
    },
    {
      contentType: "ui",
      contentId: "how_step3",
      text: "Switch back → instant (cached!)",
    },
    {
      contentType: "ui",
      contentId: "how_step4",
      text: "Try another language → only new content translates",
    },
    { contentType: "ui", contentId: "powered_by", text: "Powered by:" },
    {
      contentType: "ui",
      contentId: "powered_cerebras",
      text: "Cerebras Qwen3-32B (blazing fast!)",
    },
    {
      contentType: "ui",
      contentId: "powered_cache",
      text: "localStorage caching",
    },
    {
      contentType: "ui",
      contentId: "powered_kv",
      text: "Vercel KV for global stats",
    },
    { contentType: "ui", contentId: "try_heading", text: "Try Audarma" },
    {
      contentType: "ui",
      contentId: "try_desc",
      text: "Add LLM-powered translation to your React app:",
    },
    { contentType: "ui", contentId: "try_docs", text: "Read documentation →" },
    { contentType: "ui", contentId: "footer_built", text: "Built by" },
    { contentType: "ui", contentId: "footer_with", text: "with Audarma" },
    { contentType: "ui", contentId: "story_points", text: "points" },
    { contentType: "ui", contentId: "story_by", text: "by" },
    { contentType: "ui", contentId: "story_comments", text: "comments" },
    { contentType: "ui", contentId: "story_read", text: "Read article" },
  ];

  const translationItems = [
    ...uiTexts,
    ...stories.flatMap((story) => {
      const summary = getStorySummary(story);
      return [
        {
          contentType: "hn_title",
          contentId: story.id.toString(),
          text: story.title,
        },
        {
          contentType: "hn_summary",
          contentId: story.id.toString(),
          text: summary,
        },
      ];
    }),
  ];

  return (
    <AudarProvider config={config}>
      <ViewTranslationProvider
        viewName="hackernews-feed"
        items={translationItems}
      >
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Audarma Logo"
                    width={48}
                    height={48}
                  />
                  <div>
                    <TranslatedText
                      id="header_title"
                      text="Audarma Demo"
                      as="h1"
                      className="text-2xl font-bold"
                    />
                    <TranslatedText
                      id="header_subtitle"
                      text="LLM-powered translation with live Hacker News headlines"
                      as="p"
                      className="text-sm text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-stretch gap-3">
                  <LanguageSwitcher />
                  <button
                    onClick={handleClearCache}
                    className="px-3 py-2 border rounded-md bg-background text-sm hover:bg-muted transition-colors flex items-center gap-2 h-[42px]"
                    title="Clear translation cache"
                  >
                    <IconTrash size={16} />
                    <span>Clear cache</span>
                  </button>
                  <a
                    href="https://github.com/audarma/audarma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border rounded-md bg-background hover:bg-muted transition-colors flex items-center justify-center h-[42px] w-[42px]"
                    aria-label="GitHub"
                  >
                    <IconBrandGithub size={16} />
                  </a>
                  <a
                    href="https://www.npmjs.com/package/audarma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border rounded-md bg-background hover:bg-muted transition-colors flex items-center justify-center h-[42px] w-[42px]"
                    aria-label="npm"
                  >
                    <IconBrandNpm size={16} />
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Stories */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <TranslatedText
                    id="stories_heading"
                    text="Latest Tech Stories from Hacker News"
                    as="h2"
                    className="text-xl font-semibold mb-2"
                  />
                  <TranslatedText
                    id="stories_desc"
                    text="Switch languages to see real-time LLM translation with smart caching"
                    as="p"
                    className="text-sm text-muted-foreground"
                  />
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-6 animate-pulse"
                      >
                        <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        summary={getStorySummary(story)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Global Stats */}
                <GlobalStats />

                {/* Info Panel */}
                <div className="border rounded-lg p-6 bg-card">
                  <TranslatedText
                    id="how_heading"
                    text="How It Works"
                    as="h3"
                    className="text-sm font-semibold mb-3"
                  />
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <TranslatedText
                      id="how_step1"
                      text="Select a language from the dropdown"
                      as="li"
                    />
                    <TranslatedText
                      id="how_step2"
                      text="Watch headlines translate in real-time"
                      as="li"
                    />
                    <TranslatedText
                      id="how_step3"
                      text="Switch back → instant (cached!)"
                      as="li"
                    />
                    <TranslatedText
                      id="how_step4"
                      text="Try another language → only new content translates"
                      as="li"
                    />
                  </ol>
                  <div className="mt-4 p-3 bg-muted rounded text-xs">
                    <TranslatedText
                      id="powered_by"
                      text="Powered by:"
                      as="p"
                      className="font-semibold mb-1"
                    />
                    <ul className="space-y-1">
                      <li>
                        •{" "}
                        <TranslatedText
                          id="powered_cerebras"
                          text="Cerebras Qwen3-32B (blazing fast!)"
                        />
                      </li>
                      <li>
                        •{" "}
                        <TranslatedText
                          id="powered_cache"
                          text="localStorage caching"
                        />
                      </li>
                      <li>
                        •{" "}
                        <TranslatedText
                          id="powered_kv"
                          text="Vercel KV for global stats"
                        />
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Installation CTA */}
                <div className="border rounded-lg p-6 bg-primary/5">
                  <TranslatedText
                    id="try_heading"
                    text="Try Audarma"
                    as="h3"
                    className="text-sm font-semibold mb-2"
                  />
                  <TranslatedText
                    id="try_desc"
                    text="Add LLM-powered translation to your React app:"
                    as="p"
                    className="text-xs text-muted-foreground mb-3"
                  />
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    npm install audarma
                  </pre>
                  <a
                    href="https://github.com/audarma/audarma#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-3 inline-block"
                  >
                    <TranslatedText id="try_docs" text="Read documentation →" />
                  </a>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t mt-12 py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>
                <TranslatedText id="footer_built" text="Built by" />{" "}
                <a
                  href="https://github.com/eldarski"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @eldarski
                </a>{" "}
                <TranslatedText id="footer_with" text="with Audarma" />
              </p>
            </div>
          </footer>
        </div>
      </ViewTranslationProvider>
    </AudarProvider>
  );
}
