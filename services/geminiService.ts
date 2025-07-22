
import { GoogleGenAI, Type } from "@google/genai";
import { Lyric } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
};


const lyricSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "A single, meaningful line of the song lyrics, suitable for display. This MUST be in Devanagari script.",
      },
      startTime: {
        type: Type.NUMBER,
        description: "The time in seconds when this lyric line should start appearing, precisely synchronized with the vocals in the audio."
      }
    },
    required: ["text", "startTime"],
  },
};

export const structureLyrics = async (rawLyrics: string): Promise<Lyric[]> => {
  try {
    const prompt = `
      You are an expert in music and video production. Your task is to parse Hindi song lyrics and assign timestamps for a lyric video.
      Analyze the following Hindi song lyrics. If the input is in Romanized script (Hinglish), you MUST transliterate it to Devanagari script.
      Then, convert the Devanagari lyrics into a JSON array of objects.
      Each object must represent a single lyric line and contain two keys:
      1.  "text": A string containing the clean lyric line in Devanagari script.
      2.  "startTime": A number representing the estimated start time in seconds for the line to appear in a video.

      Guidelines for timing:
      - Assume a standard song pace.
      - Add a 3-second buffer at the beginning for a musical intro before the first lyric appears.
      - Distribute the start times logically throughout the song, considering verses, choruses, and bridges.
      - Do not include any annotations like '[Chorus]', '(Verse 1)', etc. in the final 'text' value.
      - The final output MUST be only the JSON array of objects.

      Lyrics to process:
      ---
      ${rawLyrics}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lyricSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedLyrics = JSON.parse(jsonText);

    if (!Array.isArray(parsedLyrics) || (parsedLyrics.length > 0 && !parsedLyrics.every(item => typeof item === 'object' && 'text' in item && 'startTime' in item))) {
        throw new Error("AI returned data in an unexpected format.");
    }

    // Sort by start time just in case the AI provides them out of order
    return parsedLyrics.sort((a, b) => a.startTime - b.startTime);

  } catch (error) {
    console.error("Error processing lyrics with Gemini API:", error);
    throw new Error("The AI failed to understand the lyrics. Please check the format and try again.");
  }
};

export const extractLyricsFromAudio = async (audioFile: File): Promise<Lyric[]> => {
  try {
    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      throw new Error('Please upload a valid audio file (MP3, WAV, or OGG).');
    }
    
    // Check file size (limit to 20MB for better processing)
    if (audioFile.size > 20 * 1024 * 1024) {
      throw new Error('Audio file is too large. Please use a file smaller than 20MB.');
    }

    const audioPart = await fileToGenerativePart(audioFile);

    const prompt = `
      You are an expert in music transcription. Your task is to transcribe Hindi song lyrics from an audio file and assign precise timestamps for a lyric video.
      Listen to the audio and provide the lyrics in a JSON array of objects.
      Each object must represent a single lyric line and contain two keys:
      1. "text": A string containing the clean lyric line in Devanagari script.
      2. "startTime": A number representing the exact start time in seconds for when the vocal line begins in the audio.

      Guidelines for transcription and timing:
      - The "startTime" must be accurate to the vocal performance.
      - The "text" MUST be in the Devanagari script.
      - Do not include any annotations like '[Chorus]', '(Verse 1)', etc. in the final 'text' value.
      - Break down lyrics into lines that are short and easy to read on screen.
      - If the audio contains instrumental sections, skip them and only transcribe vocal parts.
      - Ensure each lyric line is meaningful and complete.
      - The final output MUST be only the JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [audioPart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: lyricSchema,
      },
    });

    const jsonText = response.text.trim();
     if (!jsonText) {
        throw new Error("Could not transcribe the audio. The file might be silent, instrumental only, or in an unsupported format.");
    }

    let parsedLyrics;
    try {
      parsedLyrics = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error("Failed to parse the transcription results. Please try again with a clearer audio file.");
    }

    if (!Array.isArray(parsedLyrics) || (parsedLyrics.length > 0 && !parsedLyrics.every(item => typeof item === 'object' && 'text' in item && 'startTime' in item))) {
        throw new Error("Transcription failed to produce valid results. Please ensure the audio contains clear Hindi vocals.");
    }
    
    if (parsedLyrics.length === 0) {
        throw new Error("No lyrics were detected in the audio. Please ensure the file contains Hindi vocals.");
    }

    return parsedLyrics.sort((a, b) => a.startTime - b.startTime);

  } catch (error) {
    console.error("Error extracting lyrics with Gemini API:", error);
     if (error instanceof Error) {
        throw error;
    }
    throw new Error("Transcription service is currently unavailable. Please try again later.");
  }
};
