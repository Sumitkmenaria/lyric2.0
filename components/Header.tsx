
import React from 'react';
import { FilmIcon, MusicNoteIcon } from './icons/Icons';

interface HeaderProps {
    onNewProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewProject }) => {
  return (
    <header className="w-full max-w-7xl text-center mb-8 relative">
      <div className="flex items-center justify-center gap-4 mb-2">
        <MusicNoteIcon className="w-10 h-10 text-cyan-400" />
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-500">
          AI Lyric Video Generator
        </h1>
        <FilmIcon className="w-10 h-10 text-purple-400" />
      </div>
      <p className="text-lg text-gray-400">
        Bring your music to life. Upload audio, an image, and lyrics to create a beautiful video preview.
      </p>
      <button 
        onClick={onNewProject}
        className="absolute top-0 right-0 px-4 py-2 bg-gray-700 text-sm font-semibold text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
        title="Start a new project"
      >
        New Project
      </button>
    </header>
  );
};

export default Header;
