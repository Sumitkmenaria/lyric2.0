
import { Lyric, HindiFont, AspectRatio, VisualizationStyle } from "../types";

const FONT_MAP: Record<string, string> = {
  'font-mukta': '700 48px Mukta',
  'font-tiro': '400 48px "Tiro Devanagari Hindi"',
  'font-baloo': '700 52px "Baloo 2"',
}

const getFontClass = (font: HindiFont) => {
    if (font === 'Tiro') return 'font-tiro';
    if (font === 'Baloo') return 'font-baloo';
    return 'font-mukta';
}


const loadAsset = <T extends HTMLImageElement | HTMLAudioElement>(asset: T): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (asset instanceof HTMLImageElement) {
            asset.onload = () => resolve(asset);
        } else {
            asset.oncanplaythrough = () => resolve(asset);
        }
        asset.onerror = reject;
    });
};

interface ExportParams {
    audioUrl: string;
    imageUrl: string;
    lyrics: Lyric[];
    songName: string;
    creatorName: string;
    aspectRatio: AspectRatio;
    visualizationStyle: VisualizationStyle;
    imageColors: string[];
    hindiFont: HindiFont;
}


// --- Renderer Helper Functions ---

const drawBarsVisualizer = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, colors: string[], x: number, y: number, width: number, height: number) => {
    const bufferLength = dataArray.length;
    const barWidth = (width / bufferLength) * 1.5;
    let barX = x;
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const gradient = ctx.createLinearGradient(barX, y, barX, y - barHeight);
        colors.forEach((color, index) => gradient.addColorStop(index / (colors.length -1 || 1), color));
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, y - barHeight, barWidth, barHeight);
        barX += barWidth + 2;
    }
}

const drawLineVisualizer = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, colors: string[], x: number, y: number, width: number, height: number) => {
    ctx.save();
    ctx.lineWidth = 3;
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1 || 1), color));
    ctx.strokeStyle = gradient;
    ctx.shadowColor = colors[0] || 'rgba(103, 232, 249, 0.7)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    const bufferLength = dataArray.length;
    const sliceWidth = width / bufferLength;
    let currentX = x;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255.0;
        const barY = y - (v * height);
        if (i === 0) {
            ctx.moveTo(currentX, barY);
        } else {
            ctx.lineTo(currentX, barY);
        }
        currentX += sliceWidth;
    }
    ctx.stroke();
    ctx.restore();
}

const drawBackground = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.3;
    
    // Draw image centered and covering the canvas
    const imgAspectRatio = image.width / image.height;
    const canvasAspectRatio = width / height;
    let sx, sy, sWidth, sHeight;

    if (imgAspectRatio > canvasAspectRatio) {
        sHeight = image.height;
        sWidth = sHeight * canvasAspectRatio;
        sx = (image.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = image.width;
        sHeight = sWidth / canvasAspectRatio;
        sx = 0;
        sy = (image.height - sHeight) / 2;
    }
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, width, height);
    
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
}

const drawLyric = (ctx: CanvasRenderingContext2D, lyric: string, font: string, x: number, y: number) => {
    if (!lyric) return;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(103, 232, 249, 0.7)';
    ctx.shadowBlur = 20;
    ctx.fillText(lyric, x, y);
    ctx.shadowBlur = 0;
}


export const exportVideo = async (options: ExportParams, onProgress: (progress: number) => void): Promise<void> => {
    const { audioUrl, imageUrl, lyrics, songName, creatorName, aspectRatio, visualizationStyle, imageColors, hindiFont } = options;
    onProgress(0);
    
    const canvas = document.createElement('canvas');
    const FONT_SIZE_MAP = { '16:9': 48, '9:16': 42 };
    const FONT_SIZE = FONT_SIZE_MAP[aspectRatio];
    const VIDEO_WIDTH = aspectRatio === '16:9' ? 1920 : 1080;
    const VIDEO_HEIGHT = aspectRatio === '16:9' ? 1080 : 1920;

    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");

    const audioContext = new AudioContext();
    const [image, audio, vinylImage] = await Promise.all([
        loadAsset(Object.assign(new Image(), { src: imageUrl, crossOrigin: 'anonymous' })),
        loadAsset(Object.assign(new Audio(), { src: audioUrl, crossOrigin: 'anonymous' })),
        loadAsset(Object.assign(new Image(), { src: 'https://i.imgur.com/3Ea5iH7.png', crossOrigin: 'anonymous' })),
    ]);
    
    const fontClassName = getFontClass(hindiFont);
    const fontString = FONT_MAP[fontClassName].replace(/\d+px/, `${FONT_SIZE}px`);
    const bigFontString = fontString.replace(/\d+px/, `${FONT_SIZE * 2}px`);
    await Promise.all([
        document.fonts.load(fontString),
        document.fonts.load(bigFontString),
        document.fonts.load('700 24px Inter'),
        document.fonts.load('400 20px Inter'),
        document.fonts.load('900 144px Inter'),
    ]);


    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createMediaElementSource(audio);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    source.connect(destination);

    const videoStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songName.replace(/ /g, '_')}_lyric_video.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onProgress(1);
    };

    let animationFrameId: number;
    let lastProgress = -1;

    const renderFrame = () => {
        const progress = audio.currentTime / audio.duration;
        if(Math.floor(progress * 100) !== Math.floor(lastProgress * 100)) {
            onProgress(progress);
            lastProgress = progress;
        }

        drawBackground(ctx, image, VIDEO_WIDTH, VIDEO_HEIGHT);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const currentTime = audio.currentTime;
        let currentLyric = '';
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].startTime) {
                currentLyric = lyrics[i].text;
                break;
            }
        }
        
        // --- Style Specific Rendering ---
        switch(visualizationStyle) {
            case 'vinyl': {
                const containerHeight = VIDEO_HEIGHT * 0.25;
                const containerWidth = VIDEO_WIDTH * 0.7;
                const containerX = (VIDEO_WIDTH - containerWidth) / 2;
                const containerY = (VIDEO_HEIGHT - containerHeight) / 2;
                ctx.fillStyle = "rgba(0,0,0,0.4)";
                ctx.fillRect(containerX, containerY, containerWidth, containerHeight);

                const artSize = containerHeight * 0.9;
                const artX = containerX + 20;
                const artY = containerY + (containerHeight - artSize) / 2;
                ctx.drawImage(image, artX, artY, artSize, artSize);

                const vinylSize = artSize * 0.9;
                const vinylX = artX + artSize - (vinylSize*0.35);
                const vinylY = artY + (containerHeight - artSize) / 2;

                // Draw spinning vinyl
                ctx.save();
                const vinylCenterX = vinylX + vinylSize / 2;
                const vinylCenterY = vinylY + vinylSize / 2;
                ctx.translate(vinylCenterX, vinylCenterY);
                ctx.rotate(currentTime * 0.5); // 0.5 rad/sec rotation
                ctx.drawImage(vinylImage, -vinylSize/2, -vinylSize/2, vinylSize, vinylSize);
                ctx.restore();

                const vizX = vinylX + vinylSize/2 + 30;
                const vizY = containerY;
                const vizWidth = containerX + containerWidth - vizX - 20;
                const vizHeight = containerHeight;
                drawLineVisualizer(ctx, dataArray, imageColors, vizX, vizY + vizHeight / 2, vizWidth, vizHeight * 0.8);
                
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.font = `700 ${FONT_SIZE * 1.2}px Inter`;
                ctx.fillText(songName, VIDEO_WIDTH / 2, containerY + containerHeight + 80);
                ctx.font = `400 ${FONT_SIZE * 0.8}px Inter`;
                ctx.fillText(`by ${creatorName}`, VIDEO_WIDTH / 2, containerY + containerHeight + 140);
                break;
            }
            case 'waves': {
                 ctx.textAlign = 'center';
                 ctx.fillStyle = 'white';
                 ctx.font = `700 ${FONT_SIZE * 1.5}px Inter`;
                 ctx.fillText(songName, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.15);
                 ctx.font = `400 ${FONT_SIZE * 1.0}px Inter`;
                 ctx.fillText(`by ${creatorName}`, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.15 + 80);

                 const artSize = VIDEO_HEIGHT * 0.25;
                 const artX = (VIDEO_WIDTH - artSize) / 2;
                 const artY = (VIDEO_HEIGHT - artSize) / 2;
                 ctx.drawImage(image, artX, artY, artSize, artSize);
                 
                 const vizWidth = artSize * 1.5;
                 const vizHeight = artSize * 0.5;
                 drawLineVisualizer(ctx, dataArray, imageColors, artX - vizWidth - 40, artY + vizHeight, vizWidth, vizHeight);
                 
                 ctx.save();
                 ctx.translate(VIDEO_WIDTH, 0);
                 ctx.scale(-1, 1);
                 drawLineVisualizer(ctx, dataArray, imageColors, artX - vizWidth - 40, artY + vizHeight, vizWidth, vizHeight);
                 ctx.restore();

                 drawLyric(ctx, currentLyric, fontString, VIDEO_WIDTH/2, VIDEO_HEIGHT * 0.85);
                break;
            }
            case 'big_text': {
                 ctx.textAlign = 'center';
                 ctx.fillStyle = 'rgba(255,255,255,0.8)';
                 ctx.font = `700 ${FONT_SIZE}px Inter`;
                 ctx.fillText(`by ${creatorName}`, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.2);

                 ctx.font = `900 ${FONT_SIZE * 3}px Inter`;
                 ctx.strokeStyle = 'white';
                 ctx.fillStyle = 'transparent';
                 ctx.lineWidth = 2;
                 ctx.shadowColor = imageColors[0] || 'white';
                 ctx.shadowBlur = 30;
                 ctx.strokeText(songName.toUpperCase(), VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.45);
                 ctx.shadowBlur = 0;

                 drawLyric(ctx, currentLyric, fontString, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.6);

                 const vizY = VIDEO_HEIGHT * 0.95;
                 const vizHeight = VIDEO_HEIGHT * 0.15;
                 drawBarsVisualizer(ctx, dataArray, imageColors, 0, vizY, VIDEO_WIDTH, vizHeight);
                break;
            }
            case 'classic':
            default: {
                const vizHeight = VIDEO_HEIGHT * 0.1;
                const vizY = VIDEO_HEIGHT * 0.85;
                const vizWidth = VIDEO_WIDTH * 0.4;
                drawBarsVisualizer(ctx, dataArray, imageColors, (VIDEO_WIDTH - vizWidth) / 2, vizY, vizWidth, vizHeight);
                
                drawLyric(ctx, currentLyric, fontString, VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.7);
                
                ctx.textAlign = 'left';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = `700 ${FONT_SIZE * 0.5}px Inter`;
                ctx.fillText(songName, 40, VIDEO_HEIGHT - 60);
                ctx.font = `400 ${FONT_SIZE * 0.4}px Inter`;
                ctx.fillText(`by ${creatorName}`, 40, VIDEO_HEIGHT - 30);
                break;
            }
        }

        animationFrameId = requestAnimationFrame(renderFrame);
    };

    audio.onended = () => {
        recorder.stop();
        cancelAnimationFrame(animationFrameId);
        audioContext.close();
    };
    
    await audio.play();
    recorder.start();
    renderFrame();
};
