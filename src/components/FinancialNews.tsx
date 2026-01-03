import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, RefreshCw, ChevronRight, TrendingUp, PiggyBank, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { financialNewsSchema } from "@/app/api/ai/generate-news/schema";
import { buttonClassName } from "@/models/constants";

// Cache configuration
const NEWS_CACHE_KEY = "financial_news_cache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface NewsArticle {
  title: string;
  description: string;
  category: string;
  content: string;
}

interface CachedNewsData {
  timestamp: number;
  articles: NewsArticle[];
}

// Map categories to images
const categoryImages: Record<string, string> = {
  "Market Updates": "/assets/news-finance.jpg",
  "Savings Tips": "/assets/news-savings.jpg",
  "Investment Strategy": "/assets/news-investment.jpg",
  "Economy": "/assets/news-finance.jpg",
  "Personal Finance": "/assets/news-savings.jpg",
  "Crypto": "/assets/news-investment.jpg",
};

// Fallback images if specific category not found
const defaultImages = [
  "/assets/news-finance.jpg",
  "/assets/news-savings.jpg",
  "/assets/news-investment.jpg",
];

const getCategoryImage = (category: string, index: number) => {
  return categoryImages[category] || defaultImages[index % defaultImages.length];
};

/**
 * Retrieves cached news data from sessionStorage
 * Returns null if cache is empty, invalid, or expired (> 30 minutes)
 */
const getCachedNewsData = (): CachedNewsData | null => {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedNewsData = JSON.parse(cached);

    // Validate cache structure
    if (!parsedCache.timestamp || !Array.isArray(parsedCache.articles)) {
      sessionStorage.removeItem(NEWS_CACHE_KEY);
      return null;
    }

    // Check if cache is expired (older than 30 minutes)
    const now = Date.now();
    if (now - parsedCache.timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(NEWS_CACHE_KEY);
      return null;
    }

    return parsedCache;
  } catch {
    // Remove corrupted cache
    sessionStorage.removeItem(NEWS_CACHE_KEY);
    return null;
  }
};

/**
 * Stores news data in sessionStorage with current timestamp
 */
const setCachedNewsData = (articles: NewsArticle[]): void => {
  if (typeof window === "undefined") return;

  try {
    const cacheData: CachedNewsData = {
      articles,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Silently fail if sessionStorage is unavailable or quota exceeded
  }
};

export default function FinancialNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );
  const hasInitialized = useRef(false);
  // Track whether we need to cache data (true when fetching fresh data)
  const pendingCacheRef = useRef(false);

  const { submit, object, isLoading, error, stop } = useObject({
    api: "/api/ai/generate-news",
    schema: financialNewsSchema,
  });

  // Update articles when AI response streams in
  useEffect(() => {
    if (object && Array.isArray(object)) {
      setArticles(object as NewsArticle[]);
    }
  }, [object]);

  // Cache data when AI response is complete (only for fresh fetches)
  useEffect(() => {
    if (pendingCacheRef.current && !isLoading && articles.length > 0) {
      setCachedNewsData(articles);
      pendingCacheRef.current = false;
    }
  }, [isLoading, articles]);

  // Check cache first, only fetch from API if cache is empty/expired
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      const cachedData = getCachedNewsData();
      if (cachedData && cachedData.articles.length > 0) {
        // Valid cache exists - use cached data
        setArticles(cachedData.articles);
      } else {
        // No valid cache - fetch fresh data from API
        pendingCacheRef.current = true;
        submit({});
      }
    }
  }, [submit]);

  /**
   * Handles manual refresh - invalidates cache and fetches fresh data
   */
  const handleRefresh = () => {
    sessionStorage.removeItem(NEWS_CACHE_KEY);
    pendingCacheRef.current = true;
    submit({});
  };

  if (isLoading && articles.length === 0) {
    return (
      <Card className="mac-card p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold mac-text-primary">
            Financial News
          </h3>
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mac-card p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold mac-text-primary">
            Financial News
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {articles.map((article, index) => (
            <Card
              key={index}
              className="p-3 mac-card transition-all cursor-pointer group hover:shadow-md border border-transparent hover:border-gray-200"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100">
                  <Image
                    src={getCategoryImage(article.category, index)}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold mb-1 uppercase tracking-wider">
                    {article.category === 'Market Updates' && <TrendingUp className="w-3 h-3" />}
                    {article.category === 'Savings Tips' && <PiggyBank className="w-3 h-3" />}
                    {article.category === 'Investment Strategy' && <DollarSign className="w-3 h-3" />}
                    {article.category}
                  </div>
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors mac-text-primary leading-tight">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-1 text-blue-600 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Read article <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs mac-text-tertiary text-center flex items-center justify-center gap-1">
            <SparkleIcon className="w-3 h-3 text-blue-500" />
            AI-powered financial insights
          </p>
        </div>
      </Card>

      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="mac-card max-w-2xl max-h-[80vh] overflow-y-auto p-0 gap-0">
          {selectedArticle && (
            <div className="flex flex-col">
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={getCategoryImage(selectedArticle.category, 0)}
                  alt={selectedArticle.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold mb-2">
                      {selectedArticle.category}
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white leading-tight">
                      {selectedArticle.title}
                    </DialogTitle>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-lg text-gray-700 mb-6 font-medium leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-2 rounded-r-lg">
                  {selectedArticle.description}
                </p>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {selectedArticle.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button className={buttonClassName} onClick={() => setSelectedArticle(null)}>
                    Close Article
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

