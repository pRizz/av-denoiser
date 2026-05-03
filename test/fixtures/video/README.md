# Test video fixtures

Short clips sourced from **[Wikimedia Commons](https://commons.wikimedia.org/)** (preferred open formats there are **Theora**/Ogg or **VP9**/WebM, not patent-avoiding **H.264** uploads). Sizes are kept small for repo tests.

## Why two files?

[`stream-copy-feasibility.ts`](../../../src/domain/stream-copy-feasibility.ts) treats lone **H.264**, **HEVC / H.265**, and **AV1** video as **video-copy-safe** for the default **MP4** plan. **Theora**/**VP9**/**ProRes**/**other** codecs still land in **`fallback-required`** unless the user passes **`--allow-video-fallback`**. **H.264+AAC** (`fanfare…mp4`) is a small committed derivative for the copy-safe path without hunting for Wikimedia-hosted MP4 (Commons discourages H.264/MP4 uploads).

## Bundled files

| File | Role | License |
|------|------|---------|
| `water-slow-motion-wikimedia-cc-by-sa-2p8s.ogv` | ~2.8 s, **Theora + Vorbis** in Ogg (~74 KB). **Audio + video**; use for **inspect / clean with `--allow-video-fallback`** (Theora is outside the MP4 copy allowlist). | **CC BY-SA 4.0** — [File:Water_slow_motion_edited_0.ogv](https://commons.wikimedia.org/wiki/File:Water_slow_motion_edited_0.ogv) (Symode09). Direct download resolves via [Special:Redirect](https://commons.wikimedia.org/wiki/Special:Redirect/file/Water_slow_motion_edited_0.ogv). Derivatives must remain **share-alike** and credit the author. |
| `fanfare-wikimedia-cc0-h264-aac-4s.mp4` | ~4 s, **H.264 + AAC** in MP4 (~250 KB). **Transcoded derivative** from the Commons **CC0** “Fanfare for common film” clip (trim + scale/crf locally). Matches **video-copy-safe** modality for defaults. | **CC0** for the upstream work — [File:Fanfare_for_common_film.ogv](https://commons.wikimedia.org/wiki/File:Fanfare_for_common_film.ogv) (Tradimus). This MP4 is a format conversion; cite the original file when redistributing. |

## Refresh upstream OGV from Commons

Stable redirect URL pattern (omit tracking query params):

```bash
curl -sfL \
  -o water-slow-motion-wikimedia-cc-by-sa-2p8s.ogv \
  "https://upload.wikimedia.org/wikipedia/commons/4/4f/Water_slow_motion_edited_0.ogv"
```

## Recreate H.264 derivative (Fanfare CC0)

```bash
curl -sfL -o /tmp/fanfare-commons-cc0-full.ogv \
  "https://upload.wikimedia.org/wikipedia/commons/9/9f/Fanfare_for_common_film.ogv"

ffmpeg -y -i /tmp/fanfare-commons-cc0-full.ogv \
  -t 4 \
  -vf "scale=320:-2" \
  -c:v libx264 -crf 28 -pix_fmt yuv420p \
  -c:a aac -b:a 64k \
  fanfare-wikimedia-cc0-h264-aac-4s.mp4
```

## Other Wikimedia picks (not vendored)

- Many “free footage” uploads are **CC BY** **WebM VP9** (e.g. [Color Explosion short](https://commons.wikimedia.org/wiki/File:Color_Explosion_short_--FREE_FOOTAGE--.webm)) — same **`fallback-required`** story as Theora unless you transcode or allow fallback.
- Prefer **structured data license** on each file page before mirroring elsewhere.
