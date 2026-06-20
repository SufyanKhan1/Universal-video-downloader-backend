const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3000;
const { exec } = require("child_process");

app.use(express.json());
// app.use(cors());

const allowedOrigins = [
  "http://localhost:5173", // default Vite port
  "http://localhost:3000", // default Create-React-App port
  "https://your-react-app.vercel.app" // CHANGE THIS later to your live Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));


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

const ytdlpPath = path.join(__dirname, "yt-dlp.exe");

app.post("/download", (req, res) => {
  const { url } = req.body;

  exec(`"${ytdlpPath}" -j "${url}"`, (error, stdout, stderr) => {
    if (error) {
      console.log("ERROR:", error);
      console.log("STDERR:", stderr);
      return res.status(500).json({ error: "Download failed" });
    }

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
  });
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
