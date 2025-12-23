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
import { Fragment, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon, Sparkles, TrendingUp, Wallet, Target } from 'lucide-react';
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
const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();
  const { user } = useAuth();
  
  const handleSubmit = (message: PromptInputMessage) => {
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
  };

  const userName = user?.full_name?.split(' ')[0] || 'there';
  const greetingMessages = [
    `Hello ${userName}! 👋 I'm Finley, your AI financial companion.`,
    `I'm here to help you track expenses, manage your budget, and achieve your financial goals.`,
    `What would you like to know today?`
  ];

  return (
    <div className="min-h-screen mac-bg">
      <DashboardNav />
      <div className="max-w-5xl h-screen mx-auto px-4 sm:px-6 py-6 pt-24 relative">
        {/* Header Section */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mac-text-primary">Chat with Finley</h1>
              <p className="text-sm mac-text-secondary">Your AI Financial Companion</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-180px)]">
          <Card className="mac-card flex-1 flex flex-col overflow-hidden shadow-xl border border-gray-200/50">
            <Conversation className="h-full flex-1">
              <ConversationContent className="p-6">
                {/* Welcome Message - Show when no messages */}
                {messages.length === 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        {greetingMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className="mac-card p-4 rounded-2xl shadow-sm border border-gray-100 animate-fade-in"
                            style={{ animationDelay: `${idx * 200}ms` }}
                          >
                            <p className="mac-text-primary leading-relaxed">{msg}</p>
                          </div>
                        ))}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                          <div className="mac-card p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                              <Wallet className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-semibold mac-text-primary">Track Expenses</span>
                            </div>
                            <p className="text-xs mac-text-secondary">Ask about your spending</p>
                          </div>
                          <div className="mac-card p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-semibold mac-text-primary">Budget Help</span>
                            </div>
                            <p className="text-xs mac-text-secondary">Get budget insights</p>
                          </div>
                          <div className="mac-card p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-semibold mac-text-primary">Goal Planning</span>
                            </div>
                            <p className="text-xs mac-text-secondary">Plan your goals</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                    </Sources>
                  )}
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Message key={`${message.id}-${i}`} from={message.role}>
                            <MessageContent>
                              <MessageResponse>
                                {part.text}
                              </MessageResponse>
                            </MessageContent>
                            {message.role === 'assistant' && i === messages.length - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              ))}
                {status === 'submitted' && <Loader />}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            
            {/* Input Area with Enhanced Styling */}
            <div className="border-t border-gray-200 bg-white/50 backdrop-blur-sm p-4">
              <PromptInput onSubmit={handleSubmit} className="w-full" globalDrop multiple>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  variant={webSearch ? 'default' : 'ghost'}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                >
                  <PromptInputSelectTrigger>
                    <PromptInputSelectValue />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {models.map((model) => (
                      <PromptInputSelectItem key={model.value} value={model.value}>
                        {model.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
                <PromptInputSubmit disabled={!input && !status} status={status} />
              </PromptInputFooter>
            </PromptInput>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default ChatBotDemo;
 