import { expect, test } from "bun:test";

import { parseFfprobeJson } from "../../src/domain/media-probe";

test("parseFfprobeJson loads minimal audio fixture", async () => {
  // Arrange
  const raw = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
  ).text();

  // Act
  const result = parseFfprobeJson(raw);

  // Assert
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }

  expect(result.value.streams).toHaveLength(1);
  expect(result.value.streams[0]?.codec_type).toBe("audio");
  expect(result.value.streams[0]?.codec_name).toBe("aac");
  expect(result.value.streams[0]?.index).toBe(0);
  expect(result.value.format?.duration).toBe("12.345000");
  expect(result.value.streams[0]?.disposition?.default).toBe(1);
  expect(result.value.streams[0]?.channels).toBe(2);
  expect(result.value.streams[0]?.sample_rate).toBe("48000");
});

test("parseFfprobeJson loads video+audio fixture", async () => {
  // Arrange
  const raw = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-video-audio.json`,
  ).text();

  // Act
  const result = parseFfprobeJson(raw);

  // Assert
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }

  expect(result.value.streams).toHaveLength(2);
  expect(result.value.streams[0]?.codec_type).toBe("video");
  expect(result.value.streams[1]?.codec_type).toBe("audio");
});

test("parseFfprobeJson rejects invalid JSON without throwing", () => {
  // Act
  const result = parseFfprobeJson("not json");

  // Assert
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }

  expect(result.error.kind).toBe("invalid-json");
});

test("parseFfprobeJson rejects object missing streams array", () => {
  // Act
  const result = parseFfprobeJson("{}");

  // Assert
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }

  expect(result.error.kind).toBe("schema-mismatch");
});
