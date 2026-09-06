import base64
import os
from typing import Optional

import httpx

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Distinct voices for Host (Alex) and Expert (Dr. Taylor)
VOICE_HOST = "pNInz6obpgDQGcFmaJgB"      # Adam
VOICE_EXPERT = "EXAVITQu4vr4xnSDxMaL"    # Bella


def _pick_voice(speaker: str) -> str:
    s = speaker.lower()
    if "host" in s or "alex" in s:
        return VOICE_HOST
    return VOICE_EXPERT


async def synthesize_line(text: str, speaker: str) -> Optional[bytes]:
    if not ELEVENLABS_API_KEY or not text.strip():
        return None

    voice_id = _pick_voice(speaker)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        if response.status_code == 200:
            return response.content
        return None


def audio_to_base64(audio_bytes: bytes) -> str:
    return base64.b64encode(audio_bytes).decode("utf-8")
