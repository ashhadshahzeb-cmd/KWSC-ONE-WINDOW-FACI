import React, { useEffect, useRef, useState } from 'react';
import animationData from '../maintenance-animation.json';
import { useAppConfig } from '@/hooks/useAppConfig';

// Define window type for typescript
declare global {
  interface Window {
    lottie: any;
  }
}

const Maintenance = () => {
  const container = useRef<HTMLDivElement>(null);
  const lottieInstance = useRef<any>(null);
  const { maintenanceEndTime } = useAppConfig();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!maintenanceEndTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const end = new Date(maintenanceEndTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        // Time is up, auto-reload to check if we should be allowed in
        window.location.reload();
        return null;
      }

      return {
        hours: Math.floor((diff / (1000 * 60 * 60))),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (!remaining) {
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceEndTime]);

  useEffect(() => {
    const scriptId = 'lottie-web-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initLottie = () => {
      if (window.lottie && container.current) {
        // destroy previous instance if exists to avoid duplicates
        if (lottieInstance.current) {
          lottieInstance.current.destroy();
        }
        lottieInstance.current = window.lottie.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
      script.onload = initLottie;
      document.body.appendChild(script);
    } else {
      // If script is already loaded but lottie is available
      if (window.lottie) {
        initLottie();
      } else {
        script.addEventListener('load', initLottie);
      }
    }

    return () => {
      if (lottieInstance.current) {
        lottieInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md w-full border border-gray-100">
        <div className="flex justify-center mb-6">
          <div ref={container} className="w-48 h-48 sm:w-64 sm:h-64 mx-auto drop-shadow-md"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Under Maintenance
        </h1>
        <p className="text-gray-600 mb-6 text-lg">
          We are currently updating our system to serve you better. We will be back online shortly!
        </p>

        {timeLeft && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mb-3">
              Estimated Time Remaining
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center w-16">
                <span className="text-4xl font-black text-gray-900 tabular-nums tracking-tighter">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Hours</span>
              </div>
              <span className="text-3xl font-black text-gray-300 animate-pulse mt-1">:</span>
              <div className="flex flex-col items-center w-16">
                <span className="text-4xl font-black text-gray-900 tabular-nums tracking-tighter">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Mins</span>
              </div>
              <span className="text-3xl font-black text-gray-300 animate-pulse mt-1">:</span>
              <div className="flex flex-col items-center w-16">
                <span className="text-4xl font-black text-orange-600 tabular-nums tracking-tighter">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">Secs</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm font-medium text-gray-400">
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
