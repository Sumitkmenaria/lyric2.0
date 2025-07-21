
import React from 'react';

interface LoaderProps {
  message?: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...', progress }) => {
  const hasProgress = typeof progress === 'number' && progress >= 0;

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl w-full max-w-lg z-50 border border-gray-700/50 shadow-2xl">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-purple-500 border-l-purple-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-transparent border-r-transparent border-b-pink-400 border-l-pink-400 rounded-full animate-spin animate-reverse" style={{ animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-xl text-gray-200 text-center font-semibold">{message}</p>
      {hasProgress && (
        <div className="w-full bg-gray-700/50 rounded-full h-3 mt-2 overflow-hidden">
            <div 
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 h-3 rounded-full transition-all duration-500 ease-out shadow-lg" 
                style={{ width: `${progress * 100}%` }}>
            </div>
        </div>
      )}
    </div>
  );
};

export default Loader;
