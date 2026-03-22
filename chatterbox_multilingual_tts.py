

import modal

R2_BUCKET_NAME = "resonance-app"
R2_ACCOUNT_ID = "d5077d6317198c3813faeeaba2dd8a32"
R2_MOUNT_PATH = "/r2"
r2_bucket = modal.CloudBucketMount(
    R2_BUCKET_NAME,
    bucket_endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    secret=modal.Secret.from_name("cloudflare-r2"),
    read_only=True,
)

# Supported language codes (ISO 639-1) for the 23-language model
SUPPORTED_LANGUAGE_IDS = frozenset({
    "ar", "da", "de", "el", "en", "es", "fi", "fr", "he", "hi", "it", "ja",
    "ko", "ms", "nl", "no", "pl", "pt", "ru", "sv", "sw", "tr", "zh",
})

image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "chatterbox-tts==0.1.6",
    "fastapi[standard]==0.124.4",
    "peft==0.18.0",
)
app = modal.App("chatterbox-multilingual-tts", image=image)

with image.imports():
    import io
    import os
    from pathlib import Path

    import torchaudio as ta
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from fastapi import (
        Depends,
        FastAPI,
        HTTPException,
        Security,
    )
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from fastapi.security import APIKeyHeader
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("CHATTERBOX_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class MultilingualTTSRequest(BaseModel):
        """Request model for multilingual text-to-speech generation."""

        prompt: str = Field(..., min_length=1, max_length=5000)
        voice_key: str = Field(..., min_length=1, max_length=300)
        language_id: str = Field(..., min_length=2, max_length=10)
        temperature: float = Field(default=0.8, ge=0.0, le=2.0)
        cfg_weight: float = Field(default=0.5, ge=0.0, le=1.0)
        exaggeration: float = Field(default=0.5, ge=0.0, le=1.0)


@app.cls(
    gpu="a10g",
    scaledown_window=60 * 5,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("chatterbox-api-key"),
        modal.Secret.from_name("cloudflare-r2"),
    ],
    volumes={R2_MOUNT_PATH: r2_bucket},
)
@modal.concurrent(max_inputs=10)
class ChatterboxMultilingual:
    @modal.enter()
    def load_model(self):
        self.model = ChatterboxMultilingualTTS.from_pretrained(device="cuda")

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="Chatterbox Multilingual TTS API",
            description="Text-to-speech in 23 languages with one voice (voice cloning)",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.get("/languages")
        def list_languages():
            """Return supported language codes (ISO 639-1)."""
            return {"language_ids": sorted(SUPPORTED_LANGUAGE_IDS)}

        @web_app.post("/generate", responses={200: {"content": {"audio/wav": {}}}})
        def generate_speech(request: MultilingualTTSRequest):
            lang = request.language_id.lower().strip()
            if lang not in SUPPORTED_LANGUAGE_IDS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported language_id '{request.language_id}'. Supported: {sorted(SUPPORTED_LANGUAGE_IDS)}",
                )
            voice_path = Path(R2_MOUNT_PATH) / request.voice_key
            if not voice_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice not found at '{request.voice_key}'",
                )

            try:
                audio_bytes = self.generate.local(
                    request.prompt,
                    str(voice_path),
                    lang,
                    request.temperature,
                    request.cfg_weight,
                    request.exaggeration,
                )
                return StreamingResponse(
                    io.BytesIO(audio_bytes),
                    media_type="audio/wav",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate audio: {e}",
                )

        return web_app

    @modal.method()
    def generate(
        self,
        prompt: str,
        audio_prompt_path: str,
        language_id: str,
        temperature: float = 0.8,
        cfg_weight: float = 0.5,
        exaggeration: float = 0.5,
    ):
        wav = self.model.generate(
            prompt,
            audio_prompt_path=audio_prompt_path,
            language_id=language_id,
            temperature=temperature,
            cfg_weight=cfg_weight,
            exaggeration=exaggeration,
        )

        buffer = io.BytesIO()
        ta.save(buffer, wav, self.model.sr, format="wav")
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Hello, this is the multilingual voice.",
    voice_key: str = "voices/system/default.wav",
    language_id: str = "en",
    output_path: str = "/tmp/chatterbox-multilingual-tts/output.wav",
    temperature: float = 0.8,
    cfg_weight: float = 0.5,
    exaggeration: float = 0.5,
):
    import pathlib

    chatterbox = ChatterboxMultilingual()
    audio_bytes = chatterbox.generate.remote(
        prompt=prompt,
        audio_prompt_path=f"{R2_MOUNT_PATH}/{voice_key}",
        language_id=language_id,
        temperature=temperature,
        cfg_weight=cfg_weight,
        exaggeration=exaggeration,
    )

    output_file = pathlib.Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(audio_bytes)
    print(f"Audio saved to {output_file}")
