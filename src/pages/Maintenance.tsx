import React, { useEffect, useRef } from 'react';
import animationData from '../maintenance-animation.json';

// Define window type for typescript
declare global {
  interface Window {
    lottie: any;
  }
}

const Maintenance = () => {
  const container = useRef<HTMLDivElement>(null);
  const lottieInstance = useRef<any>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-6">
          <div ref={container} className="w-48 h-48 sm:w-64 sm:h-64 mx-auto drop-shadow-md"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Under Maintenance
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
          We are currently updating our system to serve you better. We will be back online shortly!
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
