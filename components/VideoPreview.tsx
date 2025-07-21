
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AudioVisualizer from './AudioVisualizer';
import LyricDisplayer from './LyricDisplayer';
import { BackIcon, PlayIcon, PauseIcon, ReplayIcon, ExportIcon, TimelineIcon } from './icons/Icons';
import { Lyric, AspectRatio, HindiFont, VisualizationStyle } from '../types';

interface VideoPreviewProps {
  audioUrl: string;
  imageUrl: string;
  lyrics: Lyric[];
  songName: string;
  creatorName: string;
  aspectRatio: AspectRatio;
  visualizationStyle: VisualizationStyle;
  imageColors: string[];
  hindiFont: HindiFont;
  onBack: () => void;
  onExport: () => void;
  onAdjust: (duration: number) => void;
}

const fontMap: Record<HindiFont, string> = {
  Mukta: 'font-mukta',
  Tiro: 'font-tiro',
  Baloo: 'font-baloo',
}

const VideoPreview: React.FC<VideoPreviewProps> = (props) => {
  const {
    audioUrl, imageUrl, lyrics, songName, creatorName, aspectRatio,
    visualizationStyle, imageColors, hindiFont, onBack, onExport, onAdjust
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => {
        setIsPlaying(true);
        if(!isStarted) setIsStarted(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setIsFinished(true);
      setCurrentLyricIndex(lyrics.length); // Hide lyrics when finished
    };
    const handleTimeUpdate = () => {
      if (!audio || !lyrics.length) return;
      const currentTime = audio.currentTime;
      let newLyricIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].startTime) {
          newLyricIndex = i;
          break;
        }
      }
      if (newLyricIndex !== currentLyricIndex) {
        setCurrentLyricIndex(newLyricIndex);
      }
    };
    
    const handleLoadedMetadata = () => {
        if(audioRef.current) setDuration(audioRef.current.duration);
    }

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    audio.play().catch(e => console.error("Autoplay was prevented:", e));

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [lyrics, currentLyricIndex]);
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if(isFinished) {
          handleRestart();
        } else {
          audioRef.current.play();
        }
      }
    }
  };

  const handleRestart = () => {
    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsFinished(false);
      setCurrentLyricIndex(-1);
    }
  }

  const handleAdjustClick = () => {
    if (duration > 0) {
      audioRef.current?.pause();
      onAdjust(duration);
    }
  }

  const aspectRatioClass = useMemo(() => {
    if (aspectRatio === '16:9') {
      return 'aspect-video max-w-6xl';
    } else {
      return 'aspect-[9/16] max-w-md';
    }
  }, [aspectRatio]);
  const fontClass = useMemo(() => fontMap[hindiFont] || 'font-mukta', [hindiFont]);
  const currentLyric = currentLyricIndex > -1 ? lyrics[currentLyricIndex]?.text : '';

  const renderContent = () => {
    switch(visualizationStyle) {
      case 'vinyl':
        return (
          <div className="w-full h-full flex flex-col justify-center items-center z-20 p-4">
            <div className="w-full max-w-3xl h-40 bg-black/40 backdrop-blur-sm flex items-center p-4 rounded-xl shadow-lg">
              <div className="relative w-36 h-36 flex-shrink-0">
                <img src={imageUrl} alt="Album Art" className="w-full h-full object-cover rounded-lg shadow-md" />
                <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 w-32 h-32 bg-cover bg-center rounded-full flex items-center justify-center animate-spin-slow" style={{backgroundImage: `url('https://i.imgur.com/3Ea5iH7.png')`, animationPlayState: isPlaying ? 'running' : 'paused'}}>
                  <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-gray-700 border-gray-600">
                     <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="w-full h-full flex items-center justify-center pl-16 pr-4">
                 <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
            </div>
            <div className="mt-8 text-center space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold">{songName}</h2>
              <p className="text-xl lg:text-2xl text-white/70">by {creatorName}</p>
              <LyricDisplayer lyric={currentLyric} fontClass={fontClass} key={currentLyricIndex} />
            </div>
          </div>
        );
      case 'waves':
        return (
          <div className="w-full h-full flex flex-col justify-between items-center z-20 p-8">
            <div className="text-center space-y-2">
              <h2 className="text-4xl lg:text-6xl font-bold">{songName}</h2>
              <p className="text-xl lg:text-3xl text-white/70">by {creatorName}</p>
            </div>
            <div className="w-full flex items-center justify-center gap-8">
              <div className="w-1/4 h-24">
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
              <img src={imageUrl} alt="Album Art" className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-2xl shadow-2xl" />
              <div className="w-1/4 h-24 scale-x-[-1]">
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
            </div>
             <LyricDisplayer lyric={currentLyric} fontClass={fontClass} key={currentLyricIndex} />
          </div>
        );
      case 'big_text':
         return (
          <div className="w-full h-full flex flex-col justify-between items-center z-20 p-8 text-center">
              <div>
                <p className="text-xl lg:text-3xl text-white/80 font-semibold tracking-wider">by {creatorName}</p>
              </div>
              <div className="flex flex-col items-center">
                <h1 className="text-5xl lg:text-8xl xl:text-9xl font-black uppercase mb-4" style={{ WebkitTextStroke: '2px white', color: 'transparent', textShadow: `0 0 15px ${imageColors[0] || 'white'}` }}>{songName}</h1>
                <LyricDisplayer lyric={currentLyric} fontClass={fontClass} key={currentLyricIndex} />
              </div>
              <div className="w-full h-16">
                  <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} />
              </div>
          </div>
        );
      case 'classic':
      default:
        return (
          <>
            <div className="absolute bottom-6 left-6 text-left z-20 text-white/70">
                <p className="font-bold text-xl lg:text-2xl">{songName}</p>
                <p className="text-base lg:text-lg">by {creatorName}</p>
            </div>
            <div className="w-full flex-grow flex flex-col justify-end items-center z-20 p-8 space-y-8">
              <LyricDisplayer lyric={currentLyric} fontClass={fontClass} key={currentLyricIndex}/>
              <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} />
            </div>
          </>
        )
    }
  }


  return (
    <div className="w-full h-full flex flex-col items-center justify-center max-h-[85vh]">
        <div className={`w-full h-full ${aspectRatioClass} relative flex flex-col justify-between items-center bg-black rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-fade-in border border-gray-700/50`}>
            <img src={imageUrl} alt="background" className="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/20 to-black/80 z-10"></div>
            
            <div className="w-full p-6 flex justify-between items-center z-20">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg">
                    <BackIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">Back to Editor</span>
                </button>
                 <button 
                    onClick={onExport} 
                    disabled={!isStarted}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 backdrop-blur-sm rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105">
                    <ExportIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">Export Video</span>
                </button>
            </div>

            {renderContent()}

            <div className="w-full p-6 flex justify-center items-center gap-6 z-20">
                 <button onClick={handleAdjustClick} disabled={!duration} className="absolute left-8 p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 disabled:opacity-50 shadow-lg">
                    <TimelineIcon className="w-6 h-6"/>
                </button>
                <button onClick={handlePlayPause} className="p-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110">
                {isFinished ? <ReplayIcon className="w-8 h-8"/> : isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                </button>
            </div>
            
            <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous"/>
        </div>
        <div className="text-center mt-4 text-gray-400 text-sm">
            <p>Click the <TimelineIcon className="w-4 h-4 inline-block align-middle"/> icon to adjust lyric timestamps.</p>
        </div>
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 10s linear infinite;
  }
`;
document.head.appendChild(style);


export default VideoPreview;
