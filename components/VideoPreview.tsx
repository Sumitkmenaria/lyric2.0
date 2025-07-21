import React, { useState, useRef, useEffect, useMemo } from 'react';
import AudioVisualizer from './AudioVisualizer';
import LyricDisplayer from './LyricDisplayer';
import { BackIcon, PlayIcon, PauseIcon, ReplayIcon, ExportIcon, TimelineIcon, ClassicStyleIcon, VinylStyleIcon, WavesStyleIcon, BigTextStyleIcon } from './icons/Icons';
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
  onSettingsChange: (settings: { aspectRatio: AspectRatio; hindiFont: HindiFont; visualizationStyle: VisualizationStyle }) => void;
}

const fontMap: Record<HindiFont, string> = {
  Mukta: 'font-mukta',
  Tiro: 'font-tiro',
  Baloo: 'font-baloo',
}

const fonts: { key: HindiFont, name: string, className: string }[] = [
  { key: 'Mukta', name: 'Default', className: 'font-mukta' },
  { key: 'Tiro', name: 'Elegant', className: 'font-tiro' },
  { key: 'Baloo', name: 'Bold', className: 'font-baloo' },
];

const visualizationStyles: { key: VisualizationStyle, name: string, icon: React.FC<any> }[] = [
  { key: 'classic', name: 'Classic', icon: ClassicStyleIcon },
  { key: 'vinyl', name: 'Vinyl', icon: VinylStyleIcon },
  { key: 'waves', name: 'Waves', icon: WavesStyleIcon },
  { key: 'big_text', name: 'Big Text', icon: BigTextStyleIcon },
]

const VideoPreview: React.FC<VideoPreviewProps> = (props) => {
  const {
    audioUrl, imageUrl, lyrics, songName, creatorName, aspectRatio,
    visualizationStyle, imageColors, hindiFont, onBack, onExport, onAdjust, onSettingsChange
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleSettingsChange = (key: string, value: any) => {
    const newSettings = {
      aspectRatio,
      hindiFont,
      visualizationStyle,
      [key]: value
    };
    onSettingsChange(newSettings);
  };

  const aspectRatioClass = useMemo(() => {
    if (aspectRatio === '16:9') {
      return 'aspect-video w-full max-w-5xl';
    } else {
      return 'aspect-[9/16] w-full max-w-sm';
    }
  }, [aspectRatio]);
  
  const fontClass = useMemo(() => fontMap[hindiFont] || 'font-mukta', [hindiFont]);
  const currentLyric = currentLyricIndex > -1 ? lyrics[currentLyricIndex]?.text : '';

  const getLyricPosition = () => {
    const baseClasses = "absolute z-30 w-full px-4 flex items-center justify-center";
    
    switch(visualizationStyle) {
      case 'vinyl':
        return `${baseClasses} bottom-16`;
      case 'waves':
        return `${baseClasses} bottom-8`;
      case 'big_text':
        return `${baseClasses} ${aspectRatio === '16:9' ? 'bottom-32' : 'bottom-24'}`;
      case 'classic':
      default:
        return `${baseClasses} ${aspectRatio === '16:9' ? 'bottom-24' : 'bottom-32'}`;
    }
  };

  const renderContent = () => {
    switch(visualizationStyle) {
      case 'vinyl':
        return (
          <div className="w-full h-full flex flex-col justify-center items-center z-20 p-4">
            <div className={`w-full ${aspectRatio === '16:9' ? 'max-w-4xl h-32' : 'max-w-xs h-24'} bg-black/50 backdrop-blur-sm flex items-center p-3 rounded-xl shadow-lg`}>
              <div className={`relative ${aspectRatio === '16:9' ? 'w-28 h-28' : 'w-20 h-20'} flex-shrink-0`}>
                <img src={imageUrl} alt="Album Art" className="w-full h-full object-cover rounded-lg shadow-md" />
                <div className={`absolute top-1/2 ${aspectRatio === '16:9' ? '-right-10 w-24 h-24' : '-right-8 w-20 h-20'} transform -translate-y-1/2 bg-cover bg-center rounded-full flex items-center justify-center animate-spin-slow`} 
                     style={{backgroundImage: `url('https://i.imgur.com/3Ea5iH7.png')`, animationPlayState: isPlaying ? 'running' : 'paused'}}>
                  <div className={`${aspectRatio === '16:9' ? 'w-6 h-6' : 'w-5 h-5'} rounded-full border-2 flex items-center justify-center bg-gray-700 border-gray-600`}>
                     <div className={`${aspectRatio === '16:9' ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-black rounded-full`}></div>
                  </div>
                </div>
              </div>
              <div className={`w-full h-full flex items-center justify-center ${aspectRatio === '16:9' ? 'pl-12' : 'pl-8'} pr-3`}>
                 <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
            </div>
            <div className="mt-6 text-center space-y-2">
              <h2 className={`${aspectRatio === '16:9' ? 'text-3xl lg:text-4xl' : 'text-xl'} font-bold`}>{songName}</h2>
              <p className={`${aspectRatio === '16:9' ? 'text-lg lg:text-xl' : 'text-sm'} text-white/70`}>by {creatorName}</p>
            </div>
          </div>
        );
      case 'waves':
        return (
          <div className="w-full h-full flex flex-col justify-between items-center z-20 p-6">
            <div className="text-center space-y-2">
              <h2 className={`${aspectRatio === '16:9' ? 'text-3xl lg:text-5xl' : 'text-2xl'} font-bold`}>{songName}</h2>
              <p className={`${aspectRatio === '16:9' ? 'text-lg lg:text-2xl' : 'text-sm'} text-white/70`}>by {creatorName}</p>
            </div>
            <div className="w-full flex items-center justify-center gap-6">
              <div className={`${aspectRatio === '16:9' ? 'w-1/4 h-20' : 'w-1/3 h-12'}`}>
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
              <img src={imageUrl} alt="Album Art" className={`${aspectRatio === '16:9' ? 'w-40 h-40 lg:w-48 lg:h-48' : 'w-24 h-24'} object-cover rounded-2xl shadow-2xl`} />
              <div className={`${aspectRatio === '16:9' ? 'w-1/4 h-20' : 'w-1/3 h-12'} scale-x-[-1]`}>
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} displayStyle="line" />
              </div>
            </div>
          </div>
        );
      case 'big_text':
         return (
          <div className="w-full h-full flex flex-col justify-between items-center z-20 p-6 text-center">
              <div>
                <p className={`${aspectRatio === '16:9' ? 'text-lg lg:text-2xl' : 'text-sm'} text-white/80 font-semibold tracking-wider`}>by {creatorName}</p>
              </div>
              <div className="flex flex-col items-center">
                <h1 className={`${aspectRatio === '16:9' ? 'text-4xl lg:text-7xl xl:text-8xl' : 'text-3xl'} font-black uppercase mb-4`} 
                    style={{ WebkitTextStroke: '2px white', color: 'transparent', textShadow: `0 0 15px ${imageColors[0] || 'white'}` }}>
                  {songName}
                </h1>
              </div>
              <div className={`w-full ${aspectRatio === '16:9' ? 'h-12' : 'h-8'}`}>
                  <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} />
              </div>
          </div>
        );
      case 'classic':
      default:
        return (
          <>
            <div className={`absolute ${aspectRatio === '16:9' ? 'bottom-4 left-4' : 'bottom-2 left-2'} text-left z-20 text-white/70`}>
                <p className={`font-bold ${aspectRatio === '16:9' ? 'text-lg lg:text-xl' : 'text-sm'}`}>{songName}</p>
                <p className={`${aspectRatio === '16:9' ? 'text-sm lg:text-base' : 'text-xs'}`}>by {creatorName}</p>
            </div>
            <div className={`w-full flex-grow flex flex-col justify-end items-center z-20 p-6 space-y-6`}>
              <div className={`w-full ${aspectRatio === '16:9' ? 'h-16' : 'h-12'}`}>
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} colors={imageColors} />
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-start justify-center gap-8 max-h-[90vh] p-4">
      {/* Video Preview */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`${aspectRatioClass} relative flex flex-col justify-between items-center bg-black rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-fade-in border border-gray-700/50`}>
            <img src={imageUrl} alt="background" className="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/20 to-black/80 z-10"></div>
            
            {/* Top Controls */}
            <div className="w-full p-4 flex justify-between items-center z-20">
                <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg text-sm">
                    <BackIcon className="w-4 h-4" />
                    <span className="font-bold">Back</span>
                </button>
                <button 
                    onClick={onExport} 
                    disabled={!isStarted}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 backdrop-blur-sm rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 text-sm">
                    <ExportIcon className="w-4 h-4" />
                    <span className="font-bold">Export</span>
                </button>
            </div>

            {renderContent()}

            {/* Lyrics positioned based on style */}
            <div className={getLyricPosition()}>
              <LyricDisplayer lyric={currentLyric} fontClass={fontClass} aspectRatio={aspectRatio} key={currentLyricIndex} />
            </div>

            {/* Bottom Controls */}
            <div className="w-full p-4 flex justify-center items-center gap-4 z-20">
                 <button onClick={handleAdjustClick} disabled={!duration} className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 disabled:opacity-50 shadow-lg">
                    <TimelineIcon className="w-5 h-5"/>
                </button>
                <button onClick={handlePlayPause} className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110">
                  {isFinished ? <ReplayIcon className="w-6 h-6"/> : isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
            </div>
            
            <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous"/>
        </div>
        <div className="text-center mt-4 text-gray-400 text-sm">
            <p>Use the timeline button to adjust lyric timestamps, or settings to customize appearance.</p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-full lg:w-80 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl animate-fade-in">
          <h3 className="text-xl font-bold text-cyan-400 mb-6">Live Preview Settings</h3>
          
          {/* Video Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Video Format</label>
            <div className="grid grid-cols-2 gap-3">
              {(['16:9', '9:16'] as const).map(ratio => (
                <label key={ratio} className={`p-3 border-2 rounded-xl cursor-pointer text-center transition-all duration-300 text-sm ${aspectRatio === ratio ? 'border-cyan-400 bg-cyan-900/50 shadow-lg' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}`}>
                  <input 
                    type="radio" 
                    name="aspectRatio" 
                    value={ratio} 
                    checked={aspectRatio === ratio} 
                    onChange={() => handleSettingsChange('aspectRatio', ratio)} 
                    className="sr-only" 
                  />
                  <span className="font-semibold">{ratio === '16:9' ? 'Landscape' : 'Portrait'}</span>
                  <div className="text-xs text-gray-400 mt-1">{ratio}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Lyric Font</label>
            <div className="space-y-2">
              {fonts.map(font => (
                <label key={font.key} className={`block p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 ${hindiFont === font.key ? 'border-cyan-400 bg-cyan-900/50 shadow-lg' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}`}>
                  <input 
                    type="radio" 
                    name="hindiFont" 
                    value={font.key} 
                    checked={hindiFont === font.key} 
                    onChange={() => handleSettingsChange('hindiFont', font.key)} 
                    className="sr-only" 
                  />
                  <span className={`${font.className} text-lg font-semibold`}>{font.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visualization Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Visualization Style</label>
            <div className="grid grid-cols-2 gap-3">
              {visualizationStyles.map(style => (
                <label key={style.key} className={`p-3 border-2 rounded-xl cursor-pointer text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 h-20 ${visualizationStyle === style.key ? 'border-cyan-400 bg-cyan-900/50 shadow-lg' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'}`}>
                  <input 
                    type="radio" 
                    name="visualizationStyle" 
                    value={style.key} 
                    checked={visualizationStyle === style.key} 
                    onChange={() => handleSettingsChange('visualizationStyle', style.key)} 
                    className="sr-only" 
                  />
                  <style.icon className="w-6 h-6"/>
                  <span className="font-semibold text-xs">{style.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
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