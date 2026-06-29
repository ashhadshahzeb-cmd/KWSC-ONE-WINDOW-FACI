import React from 'react';
import { Hammer } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
            <Hammer className="w-12 h-12" />
          </div>
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
