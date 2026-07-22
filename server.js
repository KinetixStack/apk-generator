const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  const zipPath = req.file.path;
  const fileName = req.file.originalname;

  const owner = KinetixStack; // your GitHub username/org
  const repo = apk-generator;   // your repo name
  const releaseId = 358109204; // ID of a release you created in GitHub

  try {
    // Upload ZIP as release asset
    const uploadResponse = await fetch(
      `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${fileName}`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/zip"
        },
        body: fs.createReadStream(zipPath)
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const assetData = await uploadResponse.json();
    const zipUrl = assetData.browser_download_url;

    // Trigger workflow with ZIP URL
    const workflowResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build.yml/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { zip_url: zipUrl }
        })
      }
    );

    if (!workflowResponse.ok) {
      throw new Error(`Workflow trigger failed: ${workflowResponse.statusText}`);
    }

    res.json({
      message: "Build triggered via GitHub Actions",
      zipUrl,
      workflow: "build.yml"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const path = require("path");
const fs = require("fs");

function findKeystore(workspace) {
  const files = fs.readdirSync(workspace);
  return files.find(f => f.endsWith(".keystore") || f.endsWith(".jks"));
}

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
