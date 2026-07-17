import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Trash2 } from 'lucide-react';
import { askApi } from '../../services/askApi.js';
import RecommendationBubble from './RecommendationBubble.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const SUGGESTIONS = [
  'Something uplifting after work',
  'Mind-bending sci-fi',
  'Family movie night',
  'Slow psychological thriller',
  'Underrated action movies',
  'Movies like Interstellar'
];

export default function AskCineStream({ isOpen, onClose }) {
  // Chat History: [{ role: 'user' | 'assistant', content: string | array }]
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (textOverride) => {
    const text = (textOverride || inputValue).trim();
    if (!text || text.length > 500) return;

    // Cancel in-flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const newMessage = { role: 'user', content: text };
    const currentHistory = [...history, newMessage].slice(-10); // Keep last 10
    
    setHistory(currentHistory);
    setInputValue('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await askApi.ask(
        text,
        // Send previous history (excluding the one we just added) to the server
        history.slice(-9),
        abortControllerRef.current.signal
      );

      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        recommendations: data.recommendations
      };

      setHistory(prev => [...prev, assistantMessage].slice(-10));
    } catch (err) {
      if (err.name === 'CanceledError') return;
      
      let msg = 'Something went wrong. Please try again.';
      if (err.response?.status === 429) {
        msg = err.response?.data?.error?.message || 'You are asking questions too quickly. Please cool down.';
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      setErrorMsg(msg);
      // Remove the user message since it failed
      setHistory(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setHistory([]);
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-surface flex flex-col z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface bg-surface/30">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Sparkles size={20} className="fill-primary" />
                Ask CineStream
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-2 text-txt-muted hover:text-error transition-colors rounded-full hover:bg-surface"
                    title="Clear Conversation"
                    aria-label="Clear conversation"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-txt-muted hover:text-white transition-colors rounded-full hover:bg-surface"
                  aria-label="Close panel"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-txt-muted px-4">
                  <Sparkles size={48} className="mb-4 text-surface-light opacity-50" />
                  <p className="mb-8">What are you in the mood for?</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="text-sm px-3 py-1.5 rounded-full border border-surface bg-surface-light hover:border-primary/50 hover:text-primary transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                history.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full space-y-3">
                        {msg.content && (
                          <div className="bg-surface text-txt px-4 py-3 rounded-2xl rounded-tl-sm text-sm border border-surface-light">
                            {msg.content}
                          </div>
                        )}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="space-y-3 w-full pl-2 border-l-2 border-surface">
                            {msg.recommendations.map((rec, i) => (
                              <RecommendationBubble 
                                key={i} 
                                recommendation={rec} 
                                onClick={onClose} // close panel when a movie is clicked
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex items-start gap-2 text-txt-muted p-2">
                  <Spinner size="sm" />
                  <span className="text-sm animate-pulse">CineStream is thinking...</span>
                </div>
              )}
              
              {errorMsg && (
                <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-card">
                  {errorMsg}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-surface bg-surface/30">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for a recommendation..."
                  rows={1}
                  maxLength={500}
                  className="w-full bg-surface border border-surface-light rounded-xl pl-4 pr-12 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none custom-scrollbar"
                  style={{ minHeight: '46px', maxHeight: '120px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
                  aria-label="Send message"
                >
                  <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                </button>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-txt-muted px-1">
                <span>Enter to send, Shift+Enter for new line</span>
                <span>{inputValue.length}/500</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
