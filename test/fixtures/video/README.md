# Test video fixtures

Short clips sourced from **[Wikimedia Commons](https://commons.wikimedia.org/)** (preferred open formats there are **Theora**/Ogg or **VP9**/WebM, not patent-avoiding **H.264** uploads). Sizes are kept small for repo tests.

**CLI alignment:** tests assume the product default of keeping video as-is (**stream copy**) when the matrix allows. **`--allow-video-reencode`** is for inputs where stream-copy-only video is not possible and re-encoding is required.

## Feasibility matrix vs fixtures

Stream-copy behavior for mixed audio+video is decided in [`planVideoStreamCopyFeasibility`](../../../src/domain/stream-copy-feasibility.ts) and surfaced through **`planMediaOutput`** / prelude in [`output-plan.ts`](../../../src/domain/output-plan.ts). For **one** identifiable video stream and nonempty **`format.format_name`** (structural gates; see module for full ordering):

| Path | Lone video codecs | Planned container | Typical planned audio |
|------|-------------------|-------------------|------------------------|
| **MP4 (copy-safe)** | **H.264**, **HEVC / H.265**, **AV1** | `mp4` | AAC |
| **Matroska (copy-safe)** | **theora** (e.g. Ogg-style probes) | `matroska` (`.mkv`) | AAC |
| **WebM (copy-safe)** | **VP9** | `webm` | Opus |

Success reason-code examples: `video-copy-h264-mp4-v1`, `video-copy-hevc-mp4-v1`, `video-copy-av1-mp4-v1`, `video-copy-theora-matroska-v1`, `video-copy-vp9-webm-v1`.

**`fallback-required`** (where **`inspect`** / **`clean`** still need **`--allow-video-reencode`** when policy denies fallback) includes illustrative cases such as **multiple video streams**, **missing `format_name`**, **VP8** (`video-fallback-vp8-matrix-explicit-v1`), codecs **outside** the matrix (e.g. **ProRes** → `video-fallback-non-h264-video`), and missing video codec metadata—not an exhaustive list; use the source file above for the authoritative gate sequence.

The **Fanfare MP4** (`fanfare…mp4`) remains a committed **H.264 + AAC** sample so tests can exercise the **MP4** copy-safe row without relying on Wikimedia-hosted MP4 (Commons discourages patent-encumbered uploads).

## Bundled files

| File | Role | License |
|------|------|---------|
| `water-slow-motion-wikimedia-cc-by-sa-2p8s.ogv` | ~2.8 s, **Theora + Vorbis** in Ogg (~74 KB). **Audio + video**; under the current matrix this probe is **`video-copy-safe`** with **planned Matroska** output, **AAC** for the processed audio track, and **video stream copy** at remux—so **default `inspect` / `clean` do not require `--allow-video-reencode`** for this fixture. | **CC BY-SA 4.0** — [File:Water_slow_motion_edited_0.ogv](https://commons.wikimedia.org/wiki/File:Water_slow_motion_edited_0.ogv) (Symode09). Direct download resolves via [Special:Redirect](https://commons.wikimedia.org/wiki/Special:Redirect/file/Water_slow_motion_edited_0.ogv). Derivatives must remain **share-alike** and credit the author. |
| `fanfare-wikimedia-cc0-h264-aac-4s.mp4` | ~4 s, **H.264 + AAC** in MP4 (~250 KB). **Transcoded derivative** from the Commons **CC0** “Fanfare for common film” clip (trim + scale/crf locally). Matches **video-copy-safe** modality for defaults (MP4 row). | **CC0** for the upstream work — [File:Fanfare_for_common_film.ogv](https://commons.wikimedia.org/wiki/File:Fanfare_for_common_film.ogv) (Tradimus). This MP4 is a format conversion; cite the original file when redistributing. |

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

- Many “free footage” uploads are **CC BY** **WebM VP9** (e.g. [Color Explosion short](https://commons.wikimedia.org/wiki/File:Color_Explosion_short_--FREE_FOOTAGE--.webm)). With a **lone VP9** video stream and valid probe metadata, the planner targets **copy-safe WebM + Opus** (not the same as **`fallback-required`** Theora-era behavior).
- Prefer **structured data license** on each file page before mirroring elsewhere.
