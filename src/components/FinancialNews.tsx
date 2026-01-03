import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import newsFinance from "@/assets/news-finance.jpg";
import newsSavings from "@/assets/news-savings.jpg";
import newsInvestment from "@/assets/news-investment.jpg";
import Image from "next/image";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { financialNewsSchema } from "@/app/api/ai/generate-news/schema";

// const images={
//   "news-finance": <Image src={newsFinance} alt="News Finance" />,
//   "news-savings": <Image src={newsSavings} alt="News Savings" />,
//   "news-investment": <Image src={newsInvestment} alt="News Investment" />,
// }

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
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-100 rounded-lg" />
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

        <div className="space-y-3 flex-1 overflow-y-auto">
          {articles.map((article, index) => (
            <Card
              key={index}
              className="p-3 mac-card transition-all cursor-pointer group"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {/* <Image
                    src={categoryImages[article.category] || newsFinance} 
                    alt={article.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  /> */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mb-1">
                    {article.category}
                  </div>
                  <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors mac-text-primary">
                    {article.title}
                  </h4>
                  <p className="text-xs mac-text-secondary line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-1 text-blue-600 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read more <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs mac-text-tertiary text-center">
            AI-powered financial insights • Updated daily
          </p>
        </div>
      </Card>

      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="mac-card max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-2 w-fit">
                  {selectedArticle.category}
                </div>
                <DialogTitle className="text-2xl mac-text-primary">
                  {selectedArticle.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {/* <Image
                  src={categoryImages[selectedArticle.category] || newsFinance}
                  width={80}
                  height={80}
                  alt={selectedArticle.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                /> */}
                <p className="text-sm mac-text-secondary mb-4 font-medium">
                  {selectedArticle.description}
                </p>
                <div className="prose prose-sm max-w-none">
                  {selectedArticle.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-3 mac-text-primary">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
