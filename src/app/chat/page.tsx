'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Fragment, useState, useEffect, memo, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon, Sparkles, TrendingUp, Wallet, Target, CheckIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

// Optimized suggestion chip with better visual feedback
const SuggestionChip = memo(({ icon: Icon, title, description, onClick }: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/60 backdrop-blur-sm p-4 cursor-pointer transition-all duration-300 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</span>
    </div>
    <p className="text-xs text-gray-600 leading-relaxed">{description}</p>

    {/* Subtle gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  </div>
));

SuggestionChip.displayName = 'SuggestionChip';

// Optimized message component with streaming support
const ChatMessage = memo(({ message, isLast, onRegenerate, onCopy }: {
  message: any;
  isLast: boolean;
  onRegenerate: () => void;
  onCopy: (text: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';

  const handleCopy = useCallback((text: string) => {
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Sources Section */}
      {isAssistant && message.parts.filter((part: any) => part.type === 'source-url').length > 0 && (
        <div className="mb-3">
          <Sources>
            <SourcesTrigger
              count={message.parts.filter((part: any) => part.type === 'source-url').length}
            />
            {message.parts.filter((part: any) => part.type === 'source-url').map((part: any, i: number) => (
              <SourcesContent key={`${message.id}-${i}`}>
                <Source href={part.url} title={part.url} />
              </SourcesContent>
            ))}
          </Sources>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Assistant Avatar */}
        {isAssistant && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-100">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] lg:max-w-[65%] ${isUser ? 'items-end' : 'items-start'}`}>
          {message.parts.map((part: any, i: number) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={`${message.id}-${i}`} className="w-full">
                    <div className={`
                      rounded-2xl px-4 py-3 shadow-sm
                      ${isUser
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20'
                        : 'bg-white border border-gray-200/80 text-gray-800'
                      }
                    `}>
                      <MessageResponse className={`
                        prose prose-sm max-w-none
                        ${isUser ? 'prose-invert' : ''}
                        prose-p:leading-relaxed
                        prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200
                        prose-code:text-sm
                      `}>
                        {part.text}
                      </MessageResponse>
                    </div>

                    {/* Actions for assistant messages */}
                    {isAssistant && isLast && (
                      <div className="flex gap-1 mt-2 ml-1">
                        <button
                          onClick={onRegenerate}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                          title="Retry"
                        >
                          <RefreshCcwIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(part.text)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                          title={copied ? "Copied!" : "Copy"}
                        >
                          {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              case 'reasoning':
                return (
                  <div key={`${message.id}-${i}`} className="w-full mb-2">
                    <Reasoning className="w-full" isStreaming={false}>
                      <ReasoningTrigger />
                      <ReasoningContent>{part.text}</ReasoningContent>
                    </Reasoning>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-gray-200">
            <span className="text-white text-xs font-semibold">
              {message.role.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

// Enhanced typing indicator
const TypingIndicator = memo(() => (
  <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-100">
      <Sparkles className="w-4 h-4 text-white animate-pulse" />
    </div>
    <div className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate, error } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  }, [model, webSearch, sendMessage]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const userName = user?.full_name?.split(' ')[0] || 'there';
  const greetingMessages = [
    `Hello ${userName}! 👋 I'm Finley, your AI financial companion.`,
    `I'm here to help you track expenses, manage your budget, and achieve your financial goals.`,
    `What would you like to know today?`
  ];

  const suggestions = [
    {
      icon: Wallet,
      title: 'Track Expenses',
      description: 'Show me my spending this month',
      prompt: 'Can you show me a summary of my expenses this month?'
    },
    {
      icon: TrendingUp,
      title: 'Budget Help',
      description: 'Help me create a budget',
      prompt: 'Can you help me create a monthly budget based on my income and expenses?'
    },
    {
      icon: Target,
      title: 'Goal Planning',
      description: 'Plan my savings goals',
      prompt: 'I want to save for a vacation. Can you help me plan a savings goal?'
    }
  ];

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">


        <div className="max-w-7xl h-screen mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          {/* Enhanced Header */}
          <div className="mb-4 animate-in fade-in slide-in-from-top duration-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 ring-4 ring-blue-100">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Chat with Finley
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Your AI Financial Companion</p>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex flex-col h-[calc(100vh-160px)]">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
              <Conversation className="h-full flex-1 overflow-y-auto scrollbar-none overscroll-contain">
                <ConversationContent className="px-6 py-8 bg-gradient-to-b from-gray-50/50 to-transparent">
                  {/* Welcome Message */}
                  {messages.length === 0 && (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-100">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 space-y-3">
                          {greetingMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm animate-in fade-in slide-in-from-left duration-500"
                              style={{ animationDelay: `${idx * 200}ms` }}
                            >
                              <p className="text-gray-800 leading-relaxed">{msg}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suggestion Chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="animate-in fade-in zoom-in-95 duration-500 text-semibold"
                            style={{ animationDelay: `${(idx + 3) * 200}ms` }}
                          >
                            <SuggestionChip
                              icon={suggestion.icon}
                              title={suggestion.title}
                              description={suggestion.description}
                              onClick={() => handleSuggestionClick(suggestion.prompt)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="space-y-6 animate-in fade-in duration-1000 text-semibold">
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={index === messages.length - 1}
                        onRegenerate={regenerate}
                        onCopy={handleCopy}
                      />
                    ))}

                    {/* Typing Indicator */}
                    {status === 'submitted' && <TypingIndicator />}

                    {/* Error Message */}
                    {error && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-red-100">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-red-800 mb-1">
                                  {error.message?.includes('429') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('token')
                                    ? 'Token Limit Exceeded'
                                    : 'Something went wrong'}
                                </p>
                                <p className="text-xs text-red-600 leading-relaxed">
                                  {error.message?.includes('429') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('token')
                                    ? 'Maximum token limit has been reached. Please try again later or contact support.'
                                    : error.message || 'An unexpected error occurred. Please try again.'}
                                </p>
                              </div>
                              <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              {/* Enhanced Input Area */}
              <div className="border-t border-gray-200/80 bg-white/95 backdrop-blur-md p-4">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">

                  {/* Input Area */}
                  <PromptInput
                    onSubmit={handleSubmit}
                    className="flex-1"
                    globalDrop
                    multiple
                  >
                    <PromptInputBody
                      className="bg-gray-50/50 rounded-xl border border-gray-200/80 
                   focus-within:border-blue-400 focus-within:bg-white 
                   transition-all duration-200"
                    >
                      <PromptInputTextarea
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        placeholder="Ask me anything about your finances..."
                        className="resize-none bg-transparent focus:ring-0 border-0 
                     placeholder:text-gray-400"
                      />
                    </PromptInputBody>

                    <PromptInputFooter />
                  </PromptInput>

                  {/* Submit Button */}
                  <PromptInputSubmit
                    disabled={!input && !status}
                    status={status}
                    className="h-11 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBotDemo;