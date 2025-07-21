
import React from 'react';

interface LyricDisplayerProps {
  lyric: string;
  fontClass: string;
}

const LyricDisplayer: React.FC<LyricDisplayerProps> = ({ lyric, fontClass }) => {
  return (
    <div 
        className="h-24 flex items-center justify-center w-full"
        aria-live="polite" 
        aria-atomic="true"
    >
      {lyric && (
        <p 
          className={`text-4xl lg:text-5xl font-bold text-white text-center tracking-wide ${fontClass}`}
          style={{
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(103, 232, 249, 0.5)'
          }}
        >
          {lyric.split(' ').map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block">
              {word.split('').map((char, charIndex) => (
                <span 
                    key={charIndex} 
                    className="inline-block animate-char-in"
                    style={{ animationDelay: `${wordIndex * 100 + charIndex * 30}ms`}}
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
      transform: translateY(20px) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .animate-char-in {
    opacity: 0;
    animation: char-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
`;
document.head.appendChild(style);

export default LyricDisplayer;
