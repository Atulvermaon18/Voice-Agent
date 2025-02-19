import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Create a new API route for speech synthesis
export async function POST(req) {
  const { text } = await req.json();
  const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
  // Rachel voice ID - you can change this to other voices from Eleven Labs
  const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Speech synthesis failed');
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Eleven Labs API error:', error);
    return new Response(JSON.stringify({ 
      error: "Voice synthesis failed. Please try again." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 