const path = require("path"); // Make sure this is at the very top of your fil
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
  "http://localhost:5173", // Match this to your exact Vite port
  "http://127.0.0.1:5173", // Add this too, just in case your browser uses the IP address
  "http://localhost:3001", // Match this if using Create React App
  "http://127.0.0.1:3000", // Add this backup as well
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
    },
  }),
);

// --- ROUTE 1: ytdl-core implementation ---
app.post("/download", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // 🛠️ FIX: Point directly to the downloaded Linux file inside the .bin folder
  const ytdlpLinuxPath = path.join(__dirname, ".bin", "yt-dlp");

  exec(`"${ytdlpLinuxPath}" -j "${url}"`, (error, stdout, stderr) => {
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
