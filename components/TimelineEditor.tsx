
import React, { useState, useRef, useEffect } from 'react';
import { Lyric } from '../types';
import { PlayIcon, PauseIcon } from './icons/Icons';

interface TimelineEditorProps {
    lyrics: Lyric[];
    audioUrl: string;
    duration: number;
    onSave: (updatedLyrics: Lyric[]) => void;
    onCancel: () => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const TimelineEditor: React.FC<TimelineEditorProps> = ({ lyrics, audioUrl, duration, onSave, onCancel }) => {
    const [internalLyrics, setInternalLyrics] = useState<Lyric[]>(() => [...lyrics].sort((a,b) => a.startTime - b.startTime));
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

    const audioRef = useRef<HTMLAudioElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const activeListItemRef = useRef<HTMLLIElement>(null);
    const draggedItemIndex = useRef<number | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const handleTimeUpdate = () => {
            if (!audio) return;
            const time = audio.currentTime;
            setCurrentTime(time);

            let newActiveIndex = -1;
            for (let i = internalLyrics.length - 1; i >= 0; i--) {
                if (time >= internalLyrics[i].startTime) {
                    newActiveIndex = i;
                    break;
                }
            }
            setActiveLyricIndex(newActiveIndex);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [internalLyrics]);

    useEffect(() => {
        if(activeListItemRef.current) {
            activeListItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeLyricIndex]);

    const handlePlayPause = () => {
        if(audioRef.current) {
            if(isPlaying) audioRef.current.pause();
            else audioRef.current.play();
        }
    };
    
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (timelineRef.current && audioRef.current) {
            const timelineRect = timelineRef.current.getBoundingClientRect();
            const clickPosition = e.clientX - timelineRect.left;
            const percentage = clickPosition / timelineRect.width;
            audioRef.current.currentTime = duration * percentage;
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedItemIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (draggedItemIndex.current === null || !timelineRef.current) return;

        const timelineRect = timelineRef.current.getBoundingClientRect();
        const dropPosition = e.clientX - timelineRect.left;
        const percentage = Math.max(0, Math.min(1, dropPosition / timelineRect.width));
        const newStartTime = duration * percentage;
        
        const updatedLyrics = [...internalLyrics];
        updatedLyrics[draggedItemIndex.current].startTime = newStartTime;

        setInternalLyrics(updatedLyrics.sort((a,b) => a.startTime - b.startTime));
        draggedItemIndex.current = null;
    };
    
    const handleSave = () => {
        onSave(internalLyrics);
    }
    
    const timeMarkers = Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5);

    return (
        <div className="w-full max-w-7xl h-full flex flex-col bg-gray-800/50 rounded-lg shadow-2xl p-6 animate-fade-in max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-400">Adjust Timestamps</h2>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-600/50 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-500/80 rounded-lg hover:bg-cyan-500 transition-colors font-semibold">Save Changes</button>
                </div>
            </div>
            
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg">
                 <button onClick={handlePlayPause} className="p-3 bg-cyan-500/80 rounded-full hover:bg-cyan-500 transition-colors">
                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>
                <div className="text-2xl font-mono text-white w-28">{formatTime(currentTime)} / {formatTime(duration)}</div>
                <div ref={timelineRef} onClick={handleTimelineClick} onDragOver={handleDragOver} onDrop={handleDrop} className="relative w-full h-16 bg-gray-700 rounded-lg cursor-pointer flex items-center">
                    <div className="absolute top-0 left-0 h-full bg-cyan-400/30 rounded-lg" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                    <div className="absolute top-0 left-0 h-full w-0.5 bg-white/80" style={{ left: `${(currentTime / duration) * 100}%` }}></div>
                    {/* Time Markers */}
                    {timeMarkers.map(time => (
                        <div key={time} className="absolute h-full flex flex-col items-center" style={{ left: `${(time / duration) * 100}%` }}>
                            <div className="w-px h-2 bg-gray-400"></div>
                            <span className="text-xs text-gray-400 mt-1">{formatTime(time)}</span>
                        </div>
                    ))}
                     {/* Lyric Markers */}
                    {internalLyrics.map((lyric, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            title={`${formatTime(lyric.startTime)} - ${lyric.text}`}
                            className={`absolute z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 rounded cursor-grab active:cursor-grabbing transition-all ${activeLyricIndex === index ? 'bg-pink-400 border-2 border-white scale-125' : 'bg-pink-600 border-2 border-white/70'}`}
                            style={{ left: `${(lyric.startTime / duration) * 100}%`}}
                        ></div>
                    ))}
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-gray-900/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-4">Drag markers on the timeline above to adjust timing, or edit text below. The active lyric is highlighted.</p>
                <ul ref={listRef} className="space-y-2">
                    {internalLyrics.map((lyric, index) => (
                        <li 
                            key={index} 
                            ref={index === activeLyricIndex ? activeListItemRef : null}
                            className={`flex items-center gap-4 p-2 rounded-lg transition-colors duration-300 ${index === activeLyricIndex ? 'bg-cyan-900/50' : ''}`}
                        >
                            <span className="font-mono text-cyan-400 w-16 text-right">{formatTime(lyric.startTime)}</span>
                            <input
                                type="text"
                                value={lyric.text}
                                onChange={(e) => {
                                    const newLyrics = [...internalLyrics];
                                    newLyrics[index].text = e.target.value;
                                    setInternalLyrics(newLyrics);
                                }}
                                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                            />
                        </li>
                    ))}
                </ul>
            </div>
            
            <audio ref={audioRef} src={audioUrl} className="hidden" />
        </div>
    );
};

export default TimelineEditor;
