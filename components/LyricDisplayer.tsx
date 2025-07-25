
import React from 'react';
import { AspectRatio } from '../types';

interface LyricDisplayerProps {
  lyric: string;
  fontClass: string;
  aspectRatio: AspectRatio;
}

const LyricDisplayer: React.FC<LyricDisplayerProps> = ({ lyric, fontClass, aspectRatio }) => {
  const getTextSize = () => {
    if (aspectRatio === '16:9') {
      return 'text-2xl lg:text-4xl xl:text-5xl';
    } else {
      return 'text-lg lg:text-2xl';
    }
  };

  return (
    <div 
        className={`${aspectRatio === '16:9' ? 'min-h-20' : 'min-h-16'} flex items-center justify-center w-full px-4`}
        aria-live="polite" 
        aria-atomic="true"
    >
      {lyric && (
        <p 
          className={`${getTextSize()} font-bold text-white text-center tracking-wide leading-tight ${fontClass}`}
          style={{
            textShadow: '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(103, 232, 249, 0.6), 0 0 45px rgba(103, 232, 249, 0.3)'
          }}
        >
          {lyric.split(' ').map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block">
              {word.split('').map((char, charIndex) => (
                <span 
                    key={charIndex} 
                    className="inline-block animate-char-in"
                    style={{ animationDelay: `${wordIndex * 80 + charIndex * 20}ms`}}
                >
                  {char}
                </span>
              ))}
              &nbsp;
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
  @keyframes char-in {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.7) rotateX(90deg);
    }
    50% {
      opacity: 0.7;
      transform: translateY(10px) scale(0.9) rotateX(45deg);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1) rotateX(0deg);
    }
  }
  .animate-char-in {
    opacity: 0;
    animation: char-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
`;
document.head.appendChild(style);

export default LyricDisplayer;
