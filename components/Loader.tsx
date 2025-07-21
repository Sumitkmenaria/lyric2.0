
import React from 'react';

interface LoaderProps {
  message?: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...', progress }) => {
  const hasProgress = typeof progress === 'number' && progress >= 0;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-900/80 rounded-lg w-full max-w-md z-50">
      <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-purple-500 border-l-purple-500 rounded-full animate-spin"></div>
      <p className="text-lg text-gray-300 text-center">{message}</p>
      {hasProgress && (
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-linear" 
                style={{ width: `${progress * 100}%` }}>
            </div>
        </div>
      )}
    </div>
  );
};

export default Loader;
