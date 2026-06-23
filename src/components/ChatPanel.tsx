import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const { userRole, userName } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          if (!isOpen && newMsg.sender_role !== userRole) {
            setUnread(u => u + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, userRole]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
      
    if (data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userRole) return;

    const msg = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert([
      {
        sender_role: userRole,
        sender_name: userName || userRole,
        message: msg
      }
    ]);
  };

  if (!userRole) return null; // Don't show chat if not logged in

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[100] md:bottom-10 md:right-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
            isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90 hover:scale-105"
          )}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-primary-foreground" />}
          
          {!isOpen && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background animate-bounce">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-10 w-[calc(100vw-32px)] md:w-[380px] h-[500px] max-h-[70vh] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[99] animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="h-14 border-b border-border/50 bg-primary/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Department Chat</h3>
                <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time Secure
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 custom-scrollbar">
            {loading && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                <MessageCircle className="w-10 h-10" />
                <p className="text-xs">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_role === userRole;
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                    {!isMe && (
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1 ml-1">
                        {msg.sender_name}
                      </span>
                    )}
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm",
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-white/10 dark:bg-zinc-800 border border-white/5 rounded-bl-sm"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[8px] text-muted-foreground mt-1 opacity-50">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-border/50 bg-background flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-muted/50 border border-border/50 rounded-full px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0 h-10 w-10 shadow-md" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
