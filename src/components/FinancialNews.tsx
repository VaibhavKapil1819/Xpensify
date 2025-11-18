import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import newsFinance from '@/assets/news-finance.jpg';
import newsSavings from '@/assets/news-savings.jpg';
import newsInvestment from '@/assets/news-investment.jpg';
import Image from 'next/image';
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { financialNewsSchema } from '@/app/api/ai/generate-news/schema';

  // const images={
  //   "news-finance": <Image src={newsFinance} alt="News Finance" />,
  //   "news-savings": <Image src={newsSavings} alt="News Savings" />,
  //   "news-investment": <Image src={newsInvestment} alt="News Investment" />,
  // }

interface NewsArticle {
  title: string;
  description: string;
  category: string;
  content: string;
}

export default function FinancialNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { submit, object, isLoading, error, stop } = useObject({
    api: "/api/ai/generate-news",
    schema: financialNewsSchema,
  });

  useEffect(() => {
    if (object && Array.isArray(object)) {
      setArticles(object as NewsArticle[]);
    }
  }, [object]);

  useEffect(() => {
    submit({});
  }, []);

  if (isLoading && articles.length === 0) {
    return (
      <Card className="glass-card p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Financial News</h3>
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-accent/10 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Financial News</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => submit({})}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="space-y-3 flex-1 overflow-y-auto">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <Card 
                key={index}
                className="p-3 glass-card hover:border-accent/50 transition-all cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-accent/10">
                    {/* Image placeholder */}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium mb-1">
                      {article.category}
                    </div>
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-1 text-accent text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read more <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {error ? `Error loading news: ${error.message}` : 'No news articles available'}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            AI-powered financial insights • Updated daily
          </p>
        </div>
      </Card>

      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-2 w-fit">
                  {selectedArticle.category}
                </div>
                <DialogTitle className="text-2xl gradient-text">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {selectedArticle.description}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedArticle.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 text-foreground/90">
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
