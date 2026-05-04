# Test audio fixtures

Small files for manual UAT, CI, and pipeline smoke tests. Prefer these over ad-hoc `/tmp` samples.

**Automated:** `test/app/denoise-fixture-audio-integration.test.ts` uses `speech-hush-with-brown-noise-cc0.wav` for a `speech-light` dry-run and full run when `ffmpeg` / `ffprobe` are on `PATH` (skipped otherwise).

## Bundled files

| File | Description | License / origin |
|------|-------------|-------------------|
| `speech-hush-cc0.wav` | ~3 s mono speech (“Hush!” takes), 48 kHz 16-bit PCM | **CC0**. Sourced from BigSoundBank sound #1075 (“Hush, short man”). Downloaded as [OGG](https://bigsoundbank.com/UPLOAD/ogg/1075.ogg), transcoded/trimmed locally. [Catalog page](https://bigsoundbank.com/hush-short-man-s1075.html), [license summary](https://bigsoundbank.com/licenses.html). Author: Joseph Sardin — attribution optional under CC0. |
| `brown-noise-0p8s.wav` | ~0.8 s brown noise, 48 kHz mono PCM | **No third-party audio**: generated with FFmpeg `anoisesrc` in this repo (see commands below). Safe to treat as public-domain synthetic test signal. |
| `speech-hush-with-brown-noise-cc0.wav` | Same trim as `speech-hush-cc0.wav` mixed with scaled brown noise | **CC0 speech** + **synthetic noise** (see above). Useful when you want obvious wideband noise under speech without shipping large corpora. |

### Regenerating synthetic / mixed assets

From the repo root (requires `ffmpeg`):

```bash
ffmpeg -y -f lavfi -i "anoisesrc=color=brown:amplitude=0.15:sample_rate=48000:duration=0.8" \
  -ac 1 -c:a pcm_s16le test/fixtures/audio/brown-noise-0p8s.wav

ffmpeg -y -i test/fixtures/audio/speech-hush-cc0.wav -i test/fixtures/audio/brown-noise-0p8s.wav \
  -filter_complex "[1]apad=pad_dur=3[1p];[0][1p]amix=inputs=2:duration=first:weights=1 0.35" \
  -ac 1 -c:a pcm_s16le test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav
```

To refresh the BigSoundBank-derived speech clip (after downloading the CC0 OGG):

```bash
curl -sfL "https://bigsoundbank.com/UPLOAD/ogg/1075.ogg" -o /tmp/bigsoundbank-1075.ogg
ffmpeg -y -i /tmp/bigsoundbank-1075.ogg -t 3 -ar 48000 -ac 1 -c:a pcm_s16le test/fixtures/audio/speech-hush-cc0.wav
```

## Other reputable sources (not vendored here)

Use these when you need longer clips or controlled SNR; confirm license before redistributing in a product beyond test fixtures.

- **[NOIZEUS](https://ecs.utdallas.edu/loizou/speech/noizeus/)** (UT Dallas) — IEEE sentences + real noises (babble, street, train, …) at multiple SNRs. Academic / research distribution; read their terms before committing large extracts to a public repo.
- **Freesound** — many [**CC0**](https://freesound.org/search/?q=noise+f%3Atype%3Awav+f%3Aduration%3A%5B0+TO+10%5D+f%3Alicense%3A%22Creative+Commons+0%22) noise and speech clips; sizes vary; exporting a short WAV is fine if the license filter is CC0.

## Not used here (too large or ill-suited)

- BigSoundBank [white noise 5 min WAV](https://bigsoundbank.com/sound-1037-bruit-blanc.html) — CC0 but **~28 MB** as WAV; generate short noise locally instead.
