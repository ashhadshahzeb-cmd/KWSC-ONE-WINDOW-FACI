import React, { useState, useEffect, useRef } from 'react';
import { useAuth, getDepartmentUsers, DepartmentUser } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Send, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  receiver_role: string;
  receiver_name: string;
  message: string;
  created_at: string;
}

export default function Messages() {
  const { userRole, userName } = useAuth();
  const [contacts, setContacts] = useState<DepartmentUser[]>([]);
  const [selectedContact, setSelectedContact] = useState<DepartmentUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load contacts, excluding myself
    const allUsers = getDepartmentUsers();
    setContacts(allUsers.filter(u => u.roleId !== userRole));
  }, [userRole]);

  useEffect(() => {
    if (!selectedContact || !userRole) return;

    fetchMessages(selectedContact.roleId);

    const channel = supabase
      .channel('private_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Only append if it belongs to the current 1-on-1 conversation
          const isRelevant = 
            (newMsg.sender_role === userRole && newMsg.receiver_role === selectedContact.roleId) ||
            (newMsg.sender_role === selectedContact.roleId && newMsg.receiver_role === userRole);
          
          if (isRelevant) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, userRole]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async (contactRole: string) => {
    setLoading(true);
    setMessages([]);
    
    // Fetch messages between me and contact
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_role.eq.${userRole},receiver_role.eq.${contactRole}),and(sender_role.eq.${contactRole},receiver_role.eq.${userRole})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userRole || !selectedContact) return;

    const msg = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update could be done here, but Realtime will handle it instantly
    await supabase.from('messages').insert([
      {
        sender_role: userRole,
        sender_name: userName || userRole,
        receiver_role: selectedContact.roleId,
        receiver_name: selectedContact.displayName,
        message: msg
      }
    ]);
  };

  const filteredContacts = contacts.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.roleId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] w-full flex bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Left Sidebar - Contacts List */}
      <div className="w-80 flex flex-col border-r border-border/50 bg-muted/10">
        <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredContacts.map(contact => (
            <button
              key={contact.roleId}
              onClick={() => setSelectedContact(contact)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                selectedContact?.roleId === contact.roleId 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                selectedContact?.roleId === contact.roleId 
                  ? "bg-primary-foreground/20 border-primary-foreground/30" 
                  : "bg-background border-border"
              )}>
                <User className={cn("w-5 h-5", selectedContact?.roleId === contact.roleId ? "text-primary-foreground" : "text-muted-foreground")} />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{contact.displayName}</p>
                <p className={cn(
                  "text-[10px] truncate uppercase tracking-wider",
                  selectedContact?.roleId === contact.roleId ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {contact.roleId}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Area - Chat Window */}
      <div className="flex-1 flex flex-col bg-background/50 relative">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{selectedContact.displayName}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{selectedContact.roleId}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/noise.png')] bg-repeat bg-opacity-5">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p>No messages yet. Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_role === userRole;
                  const showHeader = index === 0 || messages[index - 1].sender_role !== msg.sender_role;

                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[70%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                      {showHeader && !isMe && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 ml-2">
                          {msg.sender_name}
                        </span>
                      )}
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-card border border-border/50 rounded-bl-sm"
                      )}>
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 px-1 opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 bg-card/50 backdrop-blur-xl border-t border-border/50 flex items-end gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedContact.displayName}...`}
                className="flex-1 bg-background border border-border/50 rounded-2xl px-5 py-3 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button type="submit" size="icon" className="h-[50px] w-[50px] rounded-2xl shrink-0 shadow-lg" disabled={!newMessage.trim()}>
                <Send className="w-5 h-5 ml-1" />
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <MessageCircle className="w-20 h-20 mb-6" />
            <h2 className="text-xl font-light tracking-tight">Select a contact to start messaging</h2>
            <p className="text-sm mt-2">All your conversations are end-to-end secured inside KW&SC Network.</p>
          </div>
        )}
      </div>
    </div>
  );
}
