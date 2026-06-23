import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Network, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface JourneyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export default function JourneyMapModal({ isOpen, onClose, record }: JourneyMapModalProps) {
  if (!record || !record.history || record.history.length === 0) return null;

  const history = record.history;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-[#09090b] border-white/10 text-white p-0 overflow-hidden rounded-[32px] shadow-2xl">
        
        {/* Header */}
        <div className="bg-sky-500/10 border-b border-sky-500/20 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
            <Network className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black text-white uppercase tracking-wider">
              Visual File Journey
            </DialogTitle>
            <p className="text-xs font-medium text-sky-400 uppercase tracking-[0.2em] mt-1">
              {record.cfo_diary_number} | {record.receiving_number}
            </p>
          </div>
        </div>

        {/* Journey Map Canvas */}
        <div className="p-8 h-[60vh] bg-[url('/noise.png')] bg-repeat relative overflow-hidden">
          <ScrollArea className="h-full w-full custom-scrollbar pr-4">
            
            <div className="relative flex flex-col items-center py-8">
              {/* Central Line */}
              <div className="absolute top-8 bottom-8 left-1/2 w-1 -ml-[2px] bg-gradient-to-b from-emerald-500 via-sky-500 to-amber-500 rounded-full opacity-30"></div>

              {history.map((step: any, index: number) => {
                const isLeft = index % 2 === 0;
                const isLast = index === history.length - 1;
                
                return (
                  <div key={index} className={cn(
                    "relative w-full flex mb-12",
                    isLeft ? "justify-start" : "justify-end"
                  )}>
                    
                    {/* The Node connecting line */}
                    <div className={cn(
                      "absolute top-1/2 w-1/2 h-[2px] bg-white/10 -translate-y-1/2",
                      isLeft ? "left-1/2" : "right-1/2"
                    )}></div>

                    {/* Central Dot */}
                    <div className="absolute left-1/2 top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#09090b] border-4 border-sky-500 z-10 shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                      {isLast && <div className="absolute inset-0 bg-sky-500 rounded-full animate-ping opacity-50"></div>}
                    </div>

                    {/* Card Content */}
                    <div className={cn(
                      "w-[45%] relative z-20 group animate-in fade-in slide-in-from-bottom-4",
                      isLeft ? "pr-8 text-right" : "pl-8 text-left"
                    )}>
                      <div className={cn(
                        "p-5 rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]",
                        isLast 
                          ? "bg-sky-500/10 border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.15)]" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}>
                        
                        <div className={cn(
                          "flex items-center gap-3 mb-3",
                          isLeft ? "justify-end flex-row-reverse" : "justify-start"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            isLast ? "bg-sky-500/20 text-sky-400" : "bg-white/10 text-white/60"
                          )}>
                            {isLast ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase tracking-widest text-white">
                              {step.processed_by || 'Unknown'}
                            </p>
                            <div className={cn(
                              "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/40 mt-1",
                              isLeft ? "justify-end" : "justify-start"
                            )}>
                              <Calendar className="w-3 h-3" />
                              {new Date(step.date).toLocaleDateString()} {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className={cn(
                          "bg-black/30 p-3 rounded-2xl border border-white/5 flex gap-3",
                          isLeft ? "flex-row-reverse" : "flex-row"
                        )}>
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-white/70 italic font-medium leading-relaxed">
                            "{step.remarks || step.action || 'No remarks recorded'}"
                          </p>
                        </div>
                        
                        <div className={cn(
                          "mt-3 text-[9px] uppercase font-black tracking-[0.2em]",
                          step.action === 'REGISTERED' ? 'text-amber-400' : step.action === 'EDITED' ? 'text-indigo-400' : 'text-emerald-400'
                        )}>
                          Action: {step.action || 'PROCESSED'}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
              
            </div>
            
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
