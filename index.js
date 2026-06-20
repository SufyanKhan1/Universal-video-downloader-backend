const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

// 1. Use Render's dynamic port, fallback to 3000 for local development
const port = process.env.PORT || 3000;

app.use(express.json());

// 2. CORS configuration: Allows local development and your future deployed frontend
const allowedOrigins = [
  "http://localhost:5173", // Default Vite port
  "http://localhost:3000", // Default Create-React-App port
  "https://your-react-app.vercel.app" // ⚠️ CHANGE THIS to your live Vercel URL once deployed
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  }
}));

// --- ROUTE 1: ytdl-core implementation ---
app.post("/downloadss", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    let videoInfo;
    try {
      videoInfo = await ytdl.getInfo(url);
      console.log(videoInfo?.videoDetails?.title, "xxxxx");
    } catch (error) {
      console.error("Error fetching video info:", error);
      return res
        .status(500)
        .json({ error: "Unable to retrieve video metadata" });
    }

    if (!videoInfo.videoDetails || !videoInfo.videoDetails.title) {
      return res
        .status(500)
        .json({ error: "Unable to retrieve video metadata" });
    }

    // Filter formats to include both video and audio
    const videoAndAudioFormats = ytdl.filterFormats(
      videoInfo.formats,
      "videoandaudio",
    );

    if (!videoAndAudioFormats || videoAndAudioFormats.length === 0) {
      return res
        .status(500)
        .json({ error: "No video and audio formats found" });
    }

    const videoFormat = videoAndAudioFormats[0]; // Choose the first format

    res.header(
      "Content-Disposition",
      `attachment; filename="${videoInfo.videoDetails.title}.${videoFormat.container}"`,
    );

    const videoStream = ytdl(url, { format: videoFormat });
    videoStream.on("error", (error) => {
      console.error("Error streaming video:", error);
      res.status(500).json({ error: "Error streaming video" });
    });

    videoStream.pipe(res);
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- ROUTE 2: yt-dlp Linux-compatible implementation ---
app.post("/download", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Changed from local yt-dlp.exe to global 'yt-dlp' execution for Render's Linux environment
  exec(`yt-dlp -j "${url}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("ERROR:", error);
      console.error("STDERR:", stderr);
      return res.status(500).json({ error: "Download failed" });
    }

    try {
      const data = JSON.parse(stdout);

      const formats = data.formats
        .filter((v) => v.ext === "mp4")
        .map((v) => ({
          quality: v.format_note || v.height + "p",
          url: v.url,
        }));

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        formats: formats,
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      res.status(500).json({ error: "Failed to parse video data" });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});