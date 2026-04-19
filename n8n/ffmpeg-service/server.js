/**
 * PrintHub ffmpeg Combine Service
 * 
 * Deployed as a separate Railway service.
 * POST /combine — merges Runway video with ElevenLabs audio, uploads to R2.
 * GET /health — health check endpoint.
 * 
 * Environment variables required:
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BUCKET, R2_PUBLIC_URL
 *   COMBINE_SECRET (shared secret for request auth)
 */

const express = require("express");
const { exec } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "printhub-ffmpeg", time: new Date().toISOString() });
});

// Combine video + audio
app.post("/combine", async (req, res) => {
  // Verify shared secret
  const secret = req.headers["x-combine-secret"];
  if (secret !== process.env.COMBINE_SECRET) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const { videoUrl, audioUrl, outputKey } = req.body;
  if (!videoUrl || !audioUrl || !outputKey) {
    return res.status(400).json({ error: "videoUrl, audioUrl, and outputKey are required" });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "printhub-ffmpeg-"));
  const videoPath = path.join(tmpDir, "input.mp4");
  const audioPath = path.join(tmpDir, "audio.mp3");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    // Download video
    const videoRes = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(videoPath);
      videoRes.data.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });

    // Download audio
    const audioRes = await axios({ url: audioUrl, method: "GET", responseType: "stream" });
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(audioPath);
      audioRes.data.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });

    // Run ffmpeg
    await new Promise((resolve, reject) => {
      // -shortest ensures output ends when the shorter stream ends
      const cmd = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest -movflags +faststart "${outputPath}" -y`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("ffmpeg error:", stderr);
          reject(new Error(stderr || error.message));
        } else {
          resolve();
        }
      });
    });

    // Upload to R2
    const fileBuffer = fs.readFileSync(outputPath);
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_PUBLIC_BUCKET,
        Key: outputKey,
        Body: fileBuffer,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=86400",
      })
    );

    const outputUrl = `${process.env.R2_PUBLIC_URL}/${outputKey}`;
    res.json({ success: true, outputUrl });
  } catch (err) {
    console.error("[combine]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Combine failed" });
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {/* ignore cleanup errors */}
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PrintHub ffmpeg service listening on port ${PORT}`);
});
