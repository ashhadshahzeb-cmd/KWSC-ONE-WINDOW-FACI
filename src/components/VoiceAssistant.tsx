import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Activity, Minus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Type definitions for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const recognitionRef = useRef<any>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery, setSearchType, setOpenModal, formData, setFormData, openModal } = useVoice();
  const { userRole, isAdmin } = useAuth();

  const [conversationState, setConversationState] = useState<'initial' | 'asked_name' | 'general'>('initial');
  const [userName, setUserName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  // Only trigger initial greeting ONCE when the app starts.
  useEffect(() => {
    if (conversationState === 'initial' && userRole) {
      const timer = setTimeout(() => {
        let greeting = "";
        let urduGreeting = "";

        if (userRole === 'cfo') {
          greeting = "Assalam-o-Alaikum CFO Sahab! Aap kaise hain? Main aapki kya madad kar sakta hoon?";
          urduGreeting = "Assalam-o-Alaikum CFO Sahab! Aap kaise hain? Main aapki kya madad kar sakta hoon?";
        } else {
          greeting = `Hello ${userName || 'User'}! I am FinLedger AI. What can I do for you today?`;
          urduGreeting = greeting;
        }

        setConversationState('general');
        setShowTranscript(true);
        setTranscript(greeting);
        toast.info("Assistant: " + greeting);
        speakResponse(urduGreeting);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userRole, conversationState]);
  // Function to speak back replies
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Check for Urdu characters or common keywords to optimize voice
      const containsUrdu = /[\u0600-\u06FF]/.test(text) || text.includes('hain') || text.includes('hoon') || text.includes('shukriya');

      if (containsUrdu) {
        utterance.lang = 'hi-IN'; // Best fallback for Urdu pronunciation
        utterance.pitch = 1.1; // Slightly more human/friendly pitch
        utterance.rate = 0.9;  // Slightly slower for clarity
      } else {
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 1;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-PK'; // English (Pakistan) forces Roman/English text instead of Urdu Script

      recognition.onstart = () => {
        setIsListening(true);
        setShowTranscript(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;

            // Process Command Once Finalized
            handleVoiceCommand(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Show interim (live typing) or final
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          toast.error(`Microphone Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      toast.error("Aapka browser Voice Recognition support nahi karta.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Smarter Roman Urdu parsing
  const handleVoiceCommand = (command: string) => {
    if (!command.trim()) return;

    if (conversationState === 'asked_name') {
      let name = command.toLowerCase()
        .replace('mera naam', '')
        .replace('mera nam', '')
        .replace('my name is', '')
        .replace('main hoon', '')
        .replace('hoon', '')
        .replace('hai', '')
        .trim();

      if (!name) name = command.trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);

      setUserName(name);
      setConversationState('general');
      const reply = `Thank you ${name}! How can I help you today?`;

      setTranscript(reply);
      toast.success(`Assistant: ${reply}`);
      speakResponse(reply);
      setShowTranscript(true);

      // Keep it open for user to read
      setTimeout(() => stopListening(), 3000);
      return;
    }

    setShowTranscript(true);
    setTranscript(command); // Show what user just asked
    const speech = command.toLowerCase();
    let isHandled = false;

    // 0. Conversational / Human-like responses
    const isGreeting = speech.includes('kaise ho') || speech.includes('kaise hain') || speech.includes('how are you');
    const isStatusUpdate = speech.includes('theek hoon') || speech.includes('sahi hoon') || speech.includes('shukriya') || speech.includes('good') || speech.includes('fine');
    const isPrintIntent = speech.includes('print') || speech.includes('chaapo');
    const isFormIntent = speech.includes('nayi') || speech.includes('naya') || speech.includes('new') || speech.includes('add') || speech.includes('daalo') || speech.includes('dal') || speech.includes('darj') || speech.includes('bharo') || speech.includes('fill') || speech.includes('create') || speech.includes('dalo');
    const isSearchIntent = speech.includes('search') || speech.includes('filter') || speech.includes('dikhao') || speech.includes('talaash') || speech.includes('dekho') || speech.includes('last') || speech.includes('purani') || speech.includes('pichli') || speech.includes('tracking');

    // ----------------------------------------------------
    // PRECEDENCE 0: CONVERSATIONAL
    // ----------------------------------------------------
    if (isGreeting) {
      const reply = "Main bilkul theek hoon, shukriya! Aap batayein main aapki kya madad kar sakta hoon?";
      setTranscript(reply);
      speakResponse(reply);
      isHandled = true;
    }
    else if (isStatusUpdate) {
      const reply = "Bohat acha laga sun kar. Kuch kaam hai to batayein, main hazir hoon.";
      setTranscript(reply);
      speakResponse(reply);
      isHandled = true;
    }
    else if (isPrintIntent) {
      speakResponse("Ji bilkul, main print command bhej raha hoon.");
      window.print();
      isHandled = true;
    }

    // ----------------------------------------------------
    // PRECEDENCE 1: FORMS / DATA ENTRY
    // ----------------------------------------------------
    if (isFormIntent && (speech.includes('transaction') || speech.includes('entry') || speech.includes('amount') || speech.includes('medical') || speech.includes('employee') || speech.includes('banda') || speech.includes('salary') || speech.includes('bill') || speech.includes('contractor') || speech.includes('thekedaar'))) {
      isHandled = true;
      let modalType = "transaction";
      let targetRoute = "/transactions";

      if (speech.includes('medical') || speech.includes('bill') || speech.includes('dawae')) {
        modalType = "medical";
        targetRoute = "/book-section/medical";
      } else if (speech.includes('employee') || speech.includes('banda') || speech.includes('salary')) {
        modalType = "employee";
        targetRoute = "/book-section/regular-employee";
      } else if (speech.includes('contractor') || speech.includes('thekedaar')) {
        modalType = "contractor";
        targetRoute = "/book-section/contractor";
      }

      // Extract number if any
      const cleanedSpeech = speech.replace(/,/g, '');
      const amountRegex = /\d+/g;
      const amounts = cleanedSpeech.match(amountRegex);
      let parsedAmount = amounts ? parseInt(amounts[0]) : null;

      // Fallback for spoken thousands
      if (!parsedAmount) {
        if (speech.includes('thousand') || speech.includes('hazar')) {
          const words = speech.split(' ');
          const idx = words.findIndex(w => w.includes('thousand') || w.includes('hazar'));
          if (idx > 0 && !isNaN(parseInt(words[idx - 1]))) {
            parsedAmount = parseInt(words[idx - 1]) * 1000;
          }
        }
      }

      // Extract city/town if mentioned (simple detection: from [city])
      let city = "";
      if (speech.includes('from ')) {
        const parts = speech.split('from ');
        if (parts.length > 1) {
          city = parts[1].split(' ')[0].trim();
        }
      }

      // Extract voucher number if mentioned
      let voucher = "";
      if (speech.includes('voucher ')) {
        const parts = speech.split('voucher ');
        if (parts.length > 1) {
          voucher = parts[1].split(' ')[0].replace(/[^0-9]/g, '').trim();
        }
      }

      // Extract description
      let description = speech
        .replace('nayi', '').replace('naya', '').replace('new', '').replace('add', '').replace('daalo', '').replace('dalo', '').replace('dal', '').replace('darj', '').replace('karo', '').replace('fill', '').replace('bharo', '')
        .replace('transaction', '').replace('entry', '').replace('amount', '')
        .replace(parsedAmount ? parsedAmount.toString() : '', '')
        .trim();

      if (!description) description = "Voice Form Entry";

      // PREPARE STATE FIRST (Reliable for components mounting via Router)
      setFormData({
        amount: parsedAmount || '',
        description: description,
        name: description.length > 3 ? description : "Voice Data",
        category: "General",
        city: city,
        voucher: voucher
      });
      setOpenModal(modalType);

      // NAVIGATE
      navigate(targetRoute);

      const reply = "I have pre-filled the form with your data. Please check it!";
      toast.success("Voice Assistant: Form Pre-filled.");
      speakResponse(reply);
      stopListening();
    }

    // ----------------------------------------------------
    // PRECEDENCE 2: SEARCH & FILTER (Improved for specific types)
    // ----------------------------------------------------
    else if (isSearchIntent) {
      isHandled = true;
      let query = speech
        .replace('search', '').replace('filter', '').replace('dikhao', '').replace('talaash', '').replace('dekho', '')
        .replace('karo', '').replace('mujhe', '').replace('last week ki', '').replace('last', '').replace('pichli', '')
        .replace('by party code', '').replace('party code se', '').replace('party code', '')
        .replace('by voucher no', '').replace('voucher no se', '').replace('voucher no', '').replace('voucher number', '')
        .replace('approved', '').replace('pending', '').replace('reconciled', '')
        .replace('credit', '').replace('income', '').replace('debit', '').replace('expense', '')
        .trim();

      let targetRoute = "/transactions";
      let sType = "all";

      // Detect Page Target & Filter Types
      if (speech.includes('medical')) {
        targetRoute = "/book-section/medical";
        if (speech.includes('voucher')) sType = 'voucher';
        else if (speech.includes('party')) sType = 'party';
      } else if (speech.includes('employee') || speech.includes('banda') || speech.includes('staff')) {
        targetRoute = "/book-section/emp-details";
      } else if (speech.includes('account') || speech.includes('chart')) {
        targetRoute = "/chart-of-accounts";
      }

      // Special Transaction Filters Sync (Status/Type)
      if (targetRoute === "/transactions") {
        if (speech.includes('approved')) setFormData({ ...formData, filterStatus: 'approved' });
        if (speech.includes('pending')) setFormData({ ...formData, filterStatus: 'pending' });
        if (speech.includes('credit') || speech.includes('income')) setFormData({ ...formData, filterType: 'credit' });
        if (speech.includes('debit') || speech.includes('expense')) setFormData({ ...formData, filterType: 'debit' });
      }

      if (query || sType !== 'all') {
        setSearchType(sType);
        setSearchQuery(query);
        navigate(targetRoute);

        const typeText = sType === 'party' ? "Party Code" : sType === 'voucher' ? "Voucher Number" : "Text";
        const reply = `Searching for ${query} via ${typeText}...`;
        toast.success(`Search: ${query} (${typeText})`);
        speakResponse(reply);
        stopListening();
      } else {
        const reply = "What would you like to search for? Party code or voucher number?";
        toast.error("Search criteria missing");
        speakResponse(reply);
        stopListening();
      }
    }

    // ----------------------------------------------------
    // PRECEDENCE 3: NAVIGATION
    // ----------------------------------------------------
    else if (speech.includes('dashboard') || speech.includes('home')) {
      isHandled = true; navigate('/'); speakResponse("Opening Dashboard."); toast.success("Dashboard opened."); stopListening();
    }
    else if (speech.includes('transaction') || speech.includes('len den')) {
      isHandled = true; navigate('/transactions'); speakResponse("Transactions page opened."); toast.success("Transactions opened."); stopListening();
    }
    else if (speech.includes('ledger') || speech.includes('khata')) {
      isHandled = true; navigate('/general-ledger'); speakResponse("Ledger opened."); toast.success("Ledger opened."); stopListening();
    }
    else if (speech.includes('bank') || speech.includes('account')) {
      isHandled = true; navigate('/bank-accounts'); speakResponse("Bank Accounts opened."); toast.success("Bank Accounts opened."); stopListening();
    }
    else if (speech.includes('report') || speech.includes('record') || speech.includes('tracking')) {
      isHandled = true;
      if (speech.includes('tracking') || speech.includes('file')) {
        navigate('/book-section/file-tracking');
        speakResponse("File Tracking reports khul gayi hain.");
      } else {
        navigate('/reports');
        speakResponse("Reports page khul gaya hai.");
      }
      toast.success("Reports opened."); stopListening();
    }
    else if (speech.includes('medical') || speech.includes('dawae')) {
      isHandled = true; navigate('/book-section/medical'); speakResponse("Medical page opened."); toast.success("Medical opened."); stopListening();
    }
    else if (speech.includes('regular employee')) {
      isHandled = true; navigate('/book-section/regular-employee'); speakResponse("Regular employee page opened."); toast.success("Regular employee opened."); stopListening();
    }
    else if (speech.includes('retired employee')) {
      isHandled = true; navigate('/book-section/retired-employee'); speakResponse("Retired employee page opened."); toast.success("Retired employee opened."); stopListening();
    }
    else if (speech.includes('employee details') || speech.includes('employee record')) {
      isHandled = true; navigate('/book-section/emp-details'); speakResponse("Employee details opened."); toast.success("Employee details opened."); stopListening();
    }
    else if (speech.includes('pol bills') || speech.includes('petrol')) {
      isHandled = true; navigate('/book-section/pol-bills'); speakResponse("POL Bills opened."); toast.success("POL Bills opened."); stopListening();
    }
    else if (speech.includes('contractor') || speech.includes('thekedaar')) {
      isHandled = true; navigate('/book-section/contractor'); speakResponse("Contractor page opened."); toast.success("Contractor opened."); stopListening();
    }
    else if (speech.includes('security deposit')) {
      isHandled = true; navigate('/book-section/security-deposit'); speakResponse("Security Deposit opened."); toast.success("Security Deposit opened."); stopListening();
    }
    else if (speech.includes('contigency') || speech.includes('contingencies') || speech.includes('emergency')) {
      isHandled = true; navigate('/book-section/contingencies'); speakResponse("Contingencies opened."); toast.success("Contingencies opened."); stopListening();
    }
    else if (speech.includes('cheque') || speech.includes('check')) {
      isHandled = true; navigate('/book-section/cheque-record'); speakResponse("Cheque record opened."); toast.success("Cheque record opened."); stopListening();
    }

    // ----------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------
    if (!isHandled) {
      toast.error("Sorry, I couldn't understand that command.");
      speakResponse("Sorry, I couldn't understand your command.");
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        toast.info("Assistant is on, you can give commands now.");
      } catch (error) {
        console.error("Could not start recognition:", error);
      }
    }
  };

  return (
    <>
      {/* Live Transcript UI Box with Roman Urdu Prompts */}
      <div
        className={cn(
          "fixed bottom-24 right-6 w-80 glass-card p-5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 border border-primary/30 transition-all duration-300 transform backdrop-blur-md",
          showTranscript ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary-foreground">
            <span className="relative flex h-3 w-3">
              {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
              <span className={cn("relative inline-flex rounded-full h-3 w-3", isListening ? "bg-primary" : "bg-muted-foreground/50")}></span>
            </span>
            <Activity className="w-4 h-4 text-primary" />
            FinLedger Assistant
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-full p-1"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-muted-foreground hover:text-red-400 transition-colors bg-white/5 rounded-full p-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="min-h-[90px] max-h-[150px] overflow-y-auto w-full bg-black/20 p-4 rounded-lg border border-white/5 font-mono text-sm shadow-inner flex flex-col justify-end">
              <p className="text-foreground/90 font-medium leading-relaxed">
                {transcript ? (
                  <span className="text-white">
                    <span className="text-primary/70 block mb-1 text-xs">AI:</span>
                    "{transcript}"
                  </span>
                ) : isListening ? (
                  <span className="text-primary/70 italic flex flex-col gap-1">
                    <span>Listening... Please speak.</span>
                    <span className="text-xs text-muted-foreground/50 mt-1">💡 Try: "Open Dashboard" or type your command</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">Click the mic below and give your command. Or type here.</span>
                )}
              </p>
            </div>

            <div className="mt-3 flex gap-2 items-center">
              <Input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleVoiceCommand(textInput);
                    setTextInput('');
                  }
                }}
                placeholder="Type response..."
                className="h-8 text-xs bg-black/40 border-primary/20 text-white"
              />
              <Button
                size="sm"
                className="h-8 px-3 font-semibold"
                onClick={() => {
                  handleVoiceCommand(textInput);
                  setTextInput('');
                }}
              >
                Send
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Floating Microphone Button */}
      <button
        onClick={toggleListening}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 flex items-center justify-center",
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] ring-4 ring-red-500/20"
            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-4 ring-primary/20"
        )}
        title={isListening ? "Turn off Assistant" : "Turn on Assistant"}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 animate-pulse" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
