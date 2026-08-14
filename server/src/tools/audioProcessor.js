const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

function normalizeAudio(inputPath) {
  const outputPath = path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}-clean.wav`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioFilters([
        "highpass=f=100",
        "lowpass=f=8000",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
      ])
      .format("wav")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
}

module.exports = { normalizeAudio };