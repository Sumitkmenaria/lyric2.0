
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, MusicNoteIcon, TimelineIcon } from './icons/Icons';
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
  onAdjustLyrics: (lyrics: Lyric[]) => void;
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

const InputForm: React.FC<InputFormProps> = ({ onSubmit, onTranscribe, onAdjustLyrics, initialData }) => {
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
  
  // Update state when initialData changes but preserve files
  useEffect(() => {
    // Only update if we don't have files already
    if (!audio && initialData.audio) setAudio(initialData.audio);
    if (!image && initialData.image) setImage(initialData.image);
    
    // Always update text fields and settings
    setLyrics(initialData.lyrics);
    setSongName(initialData.songName);
    setCreatorName(initialData.creatorName);
    setAspectRatio(initialData.aspectRatio);
    setHindiFont(initialData.hindiFont);
    setVisualizationStyle(initialData.visualizationStyle);
    if(initialData.prestructuredLyrics && initialData.prestructuredLyrics.length > 0) {
        setPrestructuredLyrics(initialData.prestructuredLyrics);
    }
  }, [initialData]);

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
    try {
      await onTranscribe(audio);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during transcription.';
      setFormError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAdjustClick = () => {
    if (prestructuredLyrics && prestructuredLyrics.length > 0) {
      onAdjustLyrics(prestructuredLyrics);
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
    <div className="w-full max-w-5xl space-y-8 animate-fade-in">
      {formError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-6 py-4 rounded-xl text-center shadow-lg">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-8 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
            Upload Your Files
          </h3>
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

        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-8 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            Add Details & Style
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="songName" className="block text-sm font-medium text-gray-300 mb-2">Song Name</label>
            <input type="text" id="songName" value={songName} onChange={e => setSongName(e.target.value)} placeholder="e.g., 'Mera Safar'" className="w-full p-4 bg-gray-700/80 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg" required />
          </div>
          <div>
            <label htmlFor="creatorName" className="block text-sm font-medium text-gray-300 mb-2">Creator Name</label>
            <input type="text" id="creatorName" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="e.g., 'Aarav Kumar'" className="w-full p-4 bg-gray-700/80 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg" required />
          </div>
        </div>
      </div>

        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-8 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-400/20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            Provide Hindi Lyrics
          </h3>
        <div className="flex justify-center mb-4">
             <button 
                type="button" 
                onClick={handleTranscribe}
                disabled={!audio || isTranscribing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
                <MusicNoteIcon className="w-6 h-6"/>
                {isTranscribing ? 'Transcribing...' : 'Transcribe Lyrics From Audio'}
            </button>
        </div>
        <p className="text-center text-gray-400 mb-6 text-lg">Or paste your lyrics below (must be in Devanagari script)</p>
        <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => {
              setLyrics(e.target.value);
              setPrestructuredLyrics(null);
            }}
            placeholder="यहां अपने गीत के बोल पेस्ट करें, या ऑडियो से ट्रांसक्राइब करें..."
            className={`w-full h-56 p-6 bg-gray-700/80 border border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 text-xl ${fonts.find(f => f.key === hindiFont)?.className}`}
            required
        />
        
        {/* Lyric Adjustment Button */}
        {prestructuredLyrics && prestructuredLyrics.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button 
              type="button" 
              onClick={handleAdjustClick}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <TimelineIcon className="w-5 h-5"/>
              Adjust Lyric Timing
            </button>
          </div>
        )}
      </div>
      
        <div className="text-center pt-6">
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-16 py-5 text-xl font-black text-white bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-full shadow-2xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-purple-500/25"
        >
          Create Video Preview
        </button>
      </div>
      </form>
    </div>
  );
};

export default InputForm;
