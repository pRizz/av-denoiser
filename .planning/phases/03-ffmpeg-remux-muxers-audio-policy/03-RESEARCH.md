# Phase 03 — Research notes (MUX / audio)

## RESEARCH COMPLETE

**Scope:** FFmpeg output muxer selection for **WebM** and **Matroska** when remuxing **stream-copied video** with **re-encoded processed audio**.

### Findings

1. **`-f` before output** — For file outputs, placing **`-f webm`** or **`-f matroska`** immediately before the output filename selects the muxer explicitly; this matches operator expectations in **MULTI-06** and avoids reliance on extension alone in dry-run logs.
2. **WebM audio** — **Opus** via **`libopus`** is the policy choice in **03-CONTEXT**; explicit **`-b:a`** improves determinism across FFmpeg builds.
3. **Matroska audio** — **AAC** in MKV is widely muxed by FFmpeg; matches existing **`inspect-summary`** copy-safe line for Theora/Matroska.
4. **MP4** — Extension **`.mp4`** with **`-c:v`** / **`-c:a`** is usually sufficient; **03-CONTEXT** defers **`-f mp4`** unless evidence requires it.

### Out of scope (deferred)

- Bit-exact mux conformance tests (broader **Phase 04** / **verifyCleanOutput**).
- **libx265** fallback (**Phase 05**).
