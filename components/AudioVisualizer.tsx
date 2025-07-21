
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  colors?: string[];
  displayStyle?: 'bars' | 'line';
}

const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number, palette: string[]) => {
    ctx.clearRect(0, 0, width, height);
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        palette.forEach((color, index) => {
            gradient.addColorStop(index / (palette.length -1 || 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

const drawLine = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number, palette: string[]) => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 3;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    palette.forEach((color, index) => {
        gradient.addColorStop(index / (palette.length - 1 || 1), color);
    });
    ctx.strokeStyle = gradient;
    ctx.shadowColor = palette[0] || 'rgba(103, 232, 249, 0.7)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255.0;
        const y = height - (v * height);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying, colors, displayStyle = 'bars' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  
  const defaultColors = ['#67e8f9', '#a78bfa', '#f472b6'];
  const palette = colors && colors.length > 0 ? colors : defaultColors;

  useEffect(() => {
    const initializeAudioContext = () => {
      if (!audioRef.current) return;
      if (!audioContextRef.current) {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            
            if(!sourceRef.current) {
                const source = context.createMediaElementSource(audioRef.current);
                source.connect(analyser);
                source.connect(context.destination);
                sourceRef.current = source;
            } else {
                 sourceRef.current.connect(analyser);
                 sourceRef.current.connect(context.destination);
            }

            analyserRef.current = analyser;
            audioContextRef.current = context;
        } catch(e) {
            console.error("Failed to initialize AudioContext:", e)
        }
      }
    };
    
    if(isPlaying){
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            initializeAudioContext();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const { width, height } = canvas;
      
      if (displayStyle === 'line') {
          drawLine(ctx, dataArray, bufferLength, width, height, palette);
      } else {
          drawBars(ctx, dataArray, bufferLength, width, height, palette);
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying && analyserRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
    };
  }, [isPlaying, audioRef, palette, displayStyle]);

  return <canvas ref={canvasRef} width="600" height="100" className="opacity-80 w-full h-full"/>;
};

export default AudioVisualizer;
