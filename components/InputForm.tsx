
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, MusicNoteIcon, ClassicStyleIcon, VinylStyleIcon, WavesStyleIcon, BigTextStyleIcon } from './icons/Icons';
import { AspectRatio, HindiFont, Lyric, VisualizationStyle } from '../types';

interface InputFormProps {
  onSubmit: (data: { 
    audio: File; 
    image: File; 
    lyrics: string; 
    songName: string; 
    creatorName: string; 
    aspectRatio: AspectRatio; 
    hindiFont: HindiFont;
    visualizationStyle: VisualizationStyle;
    prestructuredLyrics: Lyric[] | null;
  }) => void;
  onTranscribe: (audioFile: File) => void;
  initialData: {
    audio: File | null;
    image: File | null;
    lyrics: string;
    songName: string;
    creatorName: string;
    aspectRatio: AspectRatio;
    hindiFont: HindiFont;
    visualizationStyle: VisualizationStyle;
    prestructuredLyrics: Lyric[] | null;
  };
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

const InputForm: React.FC<InputFormProps> = ({ onSubmit, onTranscribe, initialData }) => {
  const [audio, setAudio] = useState<File | null>(initialData.audio);
  const [image, setImage] = useState<File | null>(initialData.image);
  const [lyrics, setLyrics] = useState<string>(initialData.lyrics);
  const [songName, setSongName] = useState<string>(initialData.songName);
  const [creatorName, setCreatorName] = useState<string>(initialData.creatorName);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialData.aspectRatio);
  const [hindiFont, setHindiFont] = useState<HindiFont>(initialData.hindiFont);
  const [visualizationStyle, setVisualizationStyle] = useState<VisualizationStyle>(initialData.visualizationStyle);
  const [prestructuredLyrics, setPrestructuredLyrics] = useState<Lyric[] | null>(initialData.prestructuredLyrics);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setLyrics(initialData.lyrics);
    if(initialData.prestructuredLyrics) {
        setPrestructuredLyrics(initialData.prestructuredLyrics);
    }
  }, [initialData.lyrics, initialData.prestructuredLyrics]);

  const isFormValid = useMemo(() => {
    return audio && image && songName.trim().length > 0 && creatorName.trim().length > 0 && lyrics.trim().length > 0;
  }, [audio, image, lyrics, songName, creatorName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isFormValid) {
      onSubmit({ audio: audio!, image: image!, lyrics, songName, creatorName, aspectRatio, hindiFont, visualizationStyle, prestructuredLyrics });
    }
  };

  const handleTranscribe = async () => {
    if (!audio) {
      setFormError("Please upload an audio file first.");
      return;
    }
    setFormError(null);
    setIsTranscribing(true);
    setPrestructuredLyrics(null);
    try {
      await onTranscribe(audio);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during transcription.';
      setFormError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const FileInput = ({
    label,
    file,
    onFileChange,
    inputRef,
    accept,
  }: {
    label: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    accept: string;
  }) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors duration-300"
      >
        <UploadIcon className="w-8 h-8 mb-2" />
        <span className="text-sm font-semibold truncate px-2">{file ? file.name : `Click to upload`}</span>
        {file && <span className="text-xs mt-1 text-gray-500">{`${(file.size / 1024 / 1024).toFixed(2)} MB`}</span>}
      </button>
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
        accept={accept}
        className="hidden"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8 animate-fade-in">
      {formError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
          {formError}
        </div>
      )}
      
      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Step 1: Upload Your Files</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <FileInput
            label="Audio File (MP3, WAV)"
            file={audio}
            onFileChange={setAudio}
            inputRef={audioInputRef}
            accept="audio/mpeg,audio/wav,audio/ogg"
          />
          <FileInput
            label="Background Image (JPG, PNG)"
            file={image}
            onFileChange={setImage}
            inputRef={imageInputRef}
            accept="image/jpeg,image/png,image/webp"
          />
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">Step 2: Add Details & Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="songName" className="block text-sm font-medium text-gray-300 mb-2">Song Name</label>
            <input type="text" id="songName" value={songName} onChange={e => setSongName(e.target.value)} placeholder="e.g., 'Mera Safar'" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required />
          </div>
          <div>
            <label htmlFor="creatorName" className="block text-sm font-medium text-gray-300 mb-2">Creator Name</label>
            <input type="text" id="creatorName" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="e.g., 'Aarav Kumar'" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Video Format</label>
          <div className="flex gap-4">
            {(['16:9', '9:16'] as const).map(ratio => (
              <label key={ratio} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${aspectRatio === ratio ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                <input type="radio" name="aspectRatio" value={ratio} checked={aspectRatio === ratio} onChange={() => setAspectRatio(ratio)} className="sr-only" />
                <span>{ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}</span>
              </label>
            ))}
          </div>
        </div>
         <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Lyric Font Style</label>
          <div className="grid grid-cols-3 gap-4">
            {fonts.map(font => (
              <label key={font.key} className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${hindiFont === font.key ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                <input type="radio" name="hindiFont" value={font.key} checked={hindiFont === font.key} onChange={() => setHindiFont(font.key)} className="sr-only" />
                <span className={`${font.className} text-xl`}>{font.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Visualization Style</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visualizationStyles.map(style => (
              <label key={style.key} className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors flex flex-col items-center justify-center gap-2 h-24 ${visualizationStyle === style.key ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                <input type="radio" name="visualizationStyle" value={style.key} checked={visualizationStyle === style.key} onChange={() => setVisualizationStyle(style.key)} className="sr-only" />
                <style.icon className="w-8 h-8"/>
                <span>{style.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-pink-400 mb-4">Step 3: Provide Hindi Lyrics</h3>
        <div className="flex justify-center mb-4">
             <button 
                type="button" 
                onClick={handleTranscribe}
                disabled={!audio || isTranscribing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-600/80 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <MusicNoteIcon className="w-5 h-5"/>
                {isTranscribing ? 'Transcribing...' : 'Transcribe Lyrics From Audio'}
            </button>
        </div>
        <p className="text-center text-gray-400 mb-4">Or paste your lyrics below (must be in Devanagari script)</p>
        <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => {
              setLyrics(e.target.value);
              setPrestructuredLyrics(null);
            }}
            placeholder="यहां अपने गीत के बोल पेस्ट करें, या ऑडियो से ट्रांसक्राइब करें..."
            className={`w-full h-48 p-4 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-lg ${fonts.find(f => f.key === hindiFont)?.className}`}
            required
        />
      </div>
      
      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Create Video Preview
        </button>
      </div>
    </form>
  );
};

export default InputForm;
