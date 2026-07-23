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
import express from "express";
import fetch from "node-fetch";

const app = express();

// Existing /upload route here...

// 1. Get latest workflow run status
app.get("/status", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.github.com/repos/KinetixStack/apk-generator/actions/runs",
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json"
        }
      }
    );
    const data = await response.json();

    // Find the most recent run of your workflow
    const run = data.workflow_runs.find(r => r.name === "Build APK and AAB");

    if (!run) {
      return res.json({ status: "not_found" });
    }

    res.json({
      id: run.id,
      status: run.status,       // queued, in_progress, completed
      conclusion: run.conclusion // success, failure, cancelled
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// 2. Get artifacts for the latest run
app.get("/artifacts", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.github.com/repos/KinetixStack/apk-generator/actions/artifacts",
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json"
        }
      }
    );
    const data = await response.json();

    // Return artifact names + download URLs
    const artifacts = data.artifacts.map(a => ({
      id: a.id,
      name: a.name,
      url: a.archive_download_url
    }));

    res.json({ artifacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch artifacts" });
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
