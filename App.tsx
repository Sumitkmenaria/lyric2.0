import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import VideoPreview from './components/VideoPreview';
import TimelineEditor from './components/TimelineEditor';
import Loader from './components/Loader';
import { transcribeAudio } from './services/geminiService';
import { exportVideo } from './services/videoExporter';
import { View, AppState, VideoSettings } from './types';

const initialState: AppState = {
  view: View.INPUT,
  audioFile: null,
  audioUrl: '',
  imageFile: null,
  imageUrl: '',
  lyrics: '',
  isLoading: false,
  isExporting: false,
  exportProgress: 0,
  exportStatus: '',
  videoSettings: {
    format: '16:9',
    font: 'Arial',
    visualizationStyle: 'vinyl'
  }
};

const STORAGE_KEY = 'lyric-video-app-state';

function App() {
  const [appState, setAppState] = useState<AppState>(initialState);

  // Save state to localStorage
  const saveState = useCallback((state: AppState) => {
    const stateToSave = {
      ...state,
      audioFile: null,
      imageFile: null,
      isLoading: false,
      isExporting: false,
      exportProgress: 0,
      exportStatus: ''
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, []);

  // Load state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setAppState(prev => ({
          ...prev,
          ...parsedState,
          audioFile: null,
          imageFile: null,
          isLoading: false,
          isExporting: false,
          exportProgress: 0,
          exportStatus: ''
        }));
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state whenever it changes (except for loading/exporting states)
  useEffect(() => {
    if (!appState.isLoading && !appState.isExporting) {
      saveState(appState);
    }
  }, [appState, saveState]);

  const handleFilesUploaded = useCallback((audioFile: File, imageFile: File) => {
    const audioUrl = URL.createObjectURL(audioFile);
    const imageUrl = URL.createObjectURL(imageFile);
    
    setAppState(prev => ({
      ...prev,
      audioFile,
      audioUrl,
      imageFile,
      imageUrl,
      view: View.INPUT
    }));
  }, []);

  const handleLyricsSubmitted = useCallback((lyrics: string) => {
    setAppState(prev => ({
      ...prev,
      lyrics,
      view: View.VIDEO_PREVIEW
    }));
  }, []);

  const handleTranscribeAudio = useCallback(async () => {
    if (!appState.audioFile) return;

    setAppState(prev => ({ ...prev, isLoading: true }));

    try {
      const transcribedLyrics = await transcribeAudio(appState.audioFile);
      setAppState(prev => ({
        ...prev,
        lyrics: transcribedLyrics,
        isLoading: false,
        view: View.VIDEO_PREVIEW
      }));
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setAppState(prev => ({ ...prev, isLoading: false }));
      alert('Error transcribing audio. Please try again.');
    }
  }, [appState.audioFile]);

  const handleBackToInput = useCallback(() => {
    setAppState(prev => ({ ...prev, view: View.INPUT }));
  }, []);

  const handleAdjustLyrics = useCallback(() => {
    setAppState(prev => ({ ...prev, view: View.TIMELINE_EDITOR }));
  }, []);

  const handleBackToPreview = useCallback(() => {
    setAppState(prev => ({ ...prev, view: View.VIDEO_PREVIEW }));
  }, []);

  const handleSettingsChange = useCallback((settings: VideoSettings) => {
    setAppState(prev => ({
      ...prev,
      videoSettings: { ...prev.videoSettings, ...settings }
    }));
  }, []);

  const handleExportVideo = useCallback(async () => {
    if (!appState.audioFile || !appState.imageFile || !appState.lyrics) return;

    setAppState(prev => ({
      ...prev,
      isExporting: true,
      exportProgress: 0,
      exportStatus: 'Initializing export...'
    }));

    try {
      await exportVideo(
        appState.audioFile,
        appState.imageFile,
        appState.lyrics,
        appState.videoSettings,
        (progress, status) => {
          setAppState(prev => ({
            ...prev,
            exportProgress: progress,
            exportStatus: status
          }));
        }
      );

      setAppState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 100,
        exportStatus: 'Export completed successfully!'
      }));

      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          exportProgress: 0,
          exportStatus: ''
        }));
      }, 3000);

    } catch (error) {
      console.error('Export error:', error);
      setAppState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 0,
        exportStatus: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));

      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          exportStatus: ''
        }));
      }, 5000);
    }
  }, [appState.audioFile, appState.imageFile, appState.lyrics, appState.videoSettings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {appState.isLoading && (
          <Loader message="Transcribing audio..." />
        )}

        {appState.isExporting && (
          <Loader 
            message={appState.exportStatus} 
            progress={appState.exportProgress}
          />
        )}

        {!appState.isLoading && !appState.isExporting && appState.view === View.INPUT && (
          <InputForm
            onFilesUploaded={handleFilesUploaded}
            onLyricsSubmitted={handleLyricsSubmitted}
            onTranscribeAudio={handleTranscribeAudio}
            audioFile={appState.audioFile}
            imageFile={appState.imageFile}
            lyrics={appState.lyrics}
            hasExistingFiles={!!appState.audioUrl && !!appState.imageUrl}
          />
        )}

        {!appState.isLoading && !appState.isExporting && appState.view === View.VIDEO_PREVIEW && appState.audioUrl && (
          <VideoPreview
            audioUrl={appState.audioUrl}
            imageUrl={appState.imageUrl}
            lyrics={appState.lyrics}
            videoSettings={appState.videoSettings}
            onBackToInput={handleBackToInput}
            onAdjustLyrics={handleAdjustLyrics}
            onExportVideo={handleExportVideo}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {!appState.isLoading && !appState.isExporting && appState.view === View.TIMELINE_EDITOR && appState.audioUrl && (
          <TimelineEditor
            audioUrl={appState.audioUrl}
            lyrics={appState.lyrics}
            onBackToPreview={handleBackToPreview}
            onLyricsChange={(newLyrics) => 
              setAppState(prev => ({ ...prev, lyrics: newLyrics }))
            }
          />
        )}
      </main>
    </div>
  );
}

export default App;