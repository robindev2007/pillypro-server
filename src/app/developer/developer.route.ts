import { cache } from "@/middleware/cache.middleware";
import express from "express";

const router = express.Router();

router.get("/", cache("5m"), async (req, res) => {
  const developers = [
    {
      username: "robindev2007",
      role: "Backend Engineer",
      subtitle: "System Architect",
    },
    {
      username: "parvejmahmud01",
      role: "Frontend Flutter Engineer",
    },
    {
      username: "MIRNOMAN",
      role: "Nothing done Just to show",
    },
  ];

  try {
    const profiles = await Promise.all(
      developers.map(async (dev) => {
        // We use the Official API URL, not the browser internal URL
        const response = await fetch(
          `https://api.github.com/users/${dev.username}`,
          {
            method: "GET",
            headers: {
              // Using a standard browser User-Agent string like the one you provided
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (response.ok) {
          const githubData = (await response.json()) as any;
          return { ...githubData, role: dev.role, subtitle: dev.subtitle };
        }
        return null;
      })
    );

    const validProfiles = profiles.filter((p) => p !== null);
    res.send(generateHTML(validProfiles));
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).send("Server Error");
  }
});
export const DeveloperRoutes = router;

function generateHTML(profiles: any[]) {
  const cards = profiles
    .map(
      (user) => `
    <div class="card">
      <div class="card-header">
        <div class="status-indicator"></div>
        <span class="role-tag">${user.role}</span>
      </div>
      
      <div class="avatar-container">
        <img src="${user.avatar_url}" alt="${user.login}">
      </div>

      <div class="content">
        <h2>${user.name || user.login}</h2>
        ${user.subtitle ? `<p class="subtitle">${user.subtitle}</p>` : ""}
        <p class="username">@${user.login}</p>
        <p class="bio">${
          user.bio || "Building the future of the web, one commit at a time."
        }</p>
      </div>

      <div class="footer">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">${user.public_repos}</span>
            <span class="stat-label">Repos</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${user.followers}</span>
            <span class="stat-label">Followers</span>
          </div>
        </div>
        <a href="${
          user.html_url
        }" target="_blank" class="github-btn">View GitHub Profile</a>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Developer Directory</title>
      <style>
        :root {
          --bg: #010409; --card-bg: #0d1117; --border: #30363d;
          --text-primary: #f0f6fc; --text-secondary: #8b949e;
          --accent: #58a6ff; --success: #238636;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0px rgba(35, 134, 54, 0.4); } 100% { box-shadow: 0 0 0 8px rgba(35, 134, 54, 0); } }
        body { background-color: var(--bg); color: var(--text-primary); font-family: -apple-system, system-ui, sans-serif; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; }
        .container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; width: 100%; max-width: 1200px; }
        .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; animation: fadeIn 0.4s ease forwards; transition: 0.2s; }
        .card:hover { border-color: var(--text-secondary); transform: translateY(-4px); }
        .card-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .status-indicator { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s infinite; }
        .role-tag { font-size: 10px; font-weight: 700; padding: 2px 8px; border: 1px solid var(--border); border-radius: 20px; color: var(--text-secondary); text-transform: uppercase; }
        .avatar-container { text-align: center; }
        .avatar-container img { width: 90px; height: 90px; border-radius: 50%; border: 1px solid var(--border); padding: 4px; }
        .content { padding: 20px; text-align: center; }
        h2 { margin: 0; font-size: 1.4rem; }
        .subtitle { color: var(--text-secondary); margin: 4px 0; font-size: 0.85rem; }
        .username { color: var(--accent); font-family: monospace; font-size: 0.85rem; margin-top: 8px; }
        .bio { font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px; line-height: 1.4; height: 2.8em; overflow: hidden; }
        .footer { padding: 20px; border-top: 1px solid var(--border); background: rgba(255,255,255,0.01); border-radius: 0 0 12px 12px; }
        .stats-row { display: flex; justify-content: space-around; margin-bottom: 15px; }
        .stat-value { display: block; font-size: 1.1rem; font-weight: 600; color: var(--accent); }
        .stat-label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
        .github-btn { display: block; text-align: center; background-color: #21262d; color: var(--text-primary); text-decoration: none; padding: 10px; border-radius: 6px; border: 1px solid var(--border); font-weight: 600; font-size: 0.85rem; transition: 0.2s; }
        .github-btn:hover { background-color: #30363d; border-color: var(--text-secondary); }
      </style>
    </head>
    <body>
      <h1 style="font-weight: 300;">Engineering Team</h1>
      <div class="container">${cards}</div>
    </body>
    </html>
  `;
}
