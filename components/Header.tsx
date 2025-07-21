
import React from 'react';
import { FilmIcon, MusicNoteIcon } from './icons/Icons';

interface HeaderProps {
    onNewProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewProject }) => {
  return (
    <header className="w-full max-w-7xl text-center mb-12 relative">
      <div className="flex items-center justify-center gap-6 mb-4">
        <MusicNoteIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-500 drop-shadow-lg">
          AI Lyric Video Generator
        </h1>
        <FilmIcon className="w-12 h-12 text-purple-400 animate-pulse" />
      </div>
      <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
        Bring your music to life. Upload audio, an image, and lyrics to create a beautiful video preview.
      </p>
      <button 
        onClick={onNewProject}
        className="absolute top-0 right-0 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-sm font-bold text-gray-200 rounded-xl hover:from-gray-600 hover:to-gray-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        title="Start a new project"
      >
        New Project
      </button>
    </header>
  );
};

export default Header;
