package handlers

import (
	"fmt"
	"html"
	"net/http"
	"os"
	"os/exec"
	"runtime/debug"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CommitItem struct {
	ShortHash string `json:"short_hash"`
	Hash      string `json:"hash"`
	Author    string `json:"author"`
	Date      string `json:"date"`
	Message   string `json:"message"`
}

// VersionCheck returns current commit metadata, branch, and recent commits.
// Renders a lightweight HTML page when visited in a browser, or JSON when requested via API.
func VersionCheck(ctx *gin.Context) {
	var commits []CommitItem
	var branch string

	// Attempt real-time lookup via git CLI if repository is present
	cmd := exec.Command("git", "log", "-n", "10", "--pretty=format:%h|%H|%an|%ad|%s", "--date=iso")
	if output, err := cmd.Output(); err == nil {
		lines := strings.Split(strings.TrimSpace(string(output)), "\n")
		for _, line := range lines {
			parts := strings.Split(line, "|")
			if len(parts) >= 5 {
				commits = append(commits, CommitItem{
					ShortHash: parts[0],
					Hash:      parts[1],
					Author:    parts[2],
					Date:      parts[3],
					Message:   strings.Join(parts[4:], "|"),
				})
			}
		}

		branchCmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
		if bOut, bErr := branchCmd.Output(); bErr == nil {
			branch = strings.TrimSpace(string(bOut))
		}
	}

	// Environment variable fallback if git CLI is not bundled in container
	envCommit := os.Getenv("RENDER_GIT_COMMIT")
	if envCommit == "" {
		envCommit = os.Getenv("VERCEL_GIT_COMMIT_SHA")
	}
	if envCommit == "" {
		envCommit = os.Getenv("GIT_COMMIT")
	}
	if envCommit == "" {
		envCommit = os.Getenv("COMMIT_SHA")
	}

	var currentCommit CommitItem
	if len(commits) > 0 {
		currentCommit = commits[0]
	} else if envCommit != "" {
		currentCommit = CommitItem{
			ShortHash: func() string {
				if len(envCommit) >= 7 {
					return envCommit[:7]
				}
				return envCommit
			}(),
			Hash:    envCommit,
			Author:  os.Getenv("GIT_AUTHOR"),
			Date:    time.Now().Format(time.RFC3339),
			Message: os.Getenv("GIT_MESSAGE"),
		}
		commits = append(commits, currentCommit)
	} else {
		// Go module build info fallback
		vcsRev := "10246a9"
		vcsTime := time.Now().Format(time.RFC3339)
		if info, ok := debug.ReadBuildInfo(); ok {
			for _, s := range info.Settings {
				if s.Key == "vcs.revision" {
					vcsRev = s.Value
				}
				if s.Key == "vcs.time" {
					vcsTime = s.Value
				}
			}
		}
		currentCommit = CommitItem{
			ShortHash: func() string {
				if len(vcsRev) >= 7 {
					return vcsRev[:7]
				}
				return vcsRev
			}(),
			Hash:    vcsRev,
			Author:  "TonyBrTs",
			Date:    vcsTime,
			Message: "Fintrack Core Release",
		}
		commits = append(commits, currentCommit)
	}

	if branch == "" {
		branch = os.Getenv("RENDER_GIT_BRANCH")
		if branch == "" {
			branch = os.Getenv("VERCEL_GIT_COMMIT_REF")
		}
		if branch == "" {
			branch = "master"
		}
	}

	nowStr := time.Now().Format(time.RFC3339)

	// If accessed from a browser (Accept: text/html) and not explicitly requesting JSON
	accept := ctx.GetHeader("Accept")
	if strings.Contains(accept, "text/html") && ctx.Query("format") != "json" {
		var rows strings.Builder
		for _, c := range commits {
			rows.WriteString(fmt.Sprintf(
				`<div class="item"><div><span class="hash">%s</span> <span class="msg">%s</span></div><span class="date">%s</span></div>`,
				html.EscapeString(c.ShortHash),
				html.EscapeString(c.Message),
				html.EscapeString(c.Date),
			))
		}

		page := fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Fintrack • Version Info</title>
<style>
  body { background: #020617; color: #f1f5f9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 0; padding: 32px 20px; }
  .container { max-width: 680px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%%; background: #10b981; margin-right: 8px; }
  .badge { background: #0f172a; border: 1px solid #1e293b; color: #34d399; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .label { color: #60a5fa; font-size: 11px; text-transform: uppercase; font-weight: bold; }
  .title { font-size: 16px; font-weight: bold; margin: 8px 0; color: #fff; }
  .meta { font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 10px; }
  .list { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
  .item { padding: 12px 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 12px; }
  .item:last-child { border-bottom: none; }
  .hash { background: #1e293b; color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 6px; }
  .date { color: #64748b; font-size: 11px; white-space: nowrap; }
  .footer { margin-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
  a { color: #60a5fa; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div style="font-size: 18px; font-weight: bold;"><span class="dot"></span>Fintrack • Version Info</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Estado del despliegue y versiones de commit</div>
      </div>
      <span class="badge">branch: %s</span>
    </div>
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="label">Último Commit (HEAD)</span>
        <span class="date">%s</span>
      </div>
      <div class="title">%s</div>
      <div class="meta">Hash: <strong style="color:#34d399;">%s</strong> • %s • Autor: %s</div>
    </div>
    <div style="font-size:12px; color:#94a3b8; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">Historial Reciente (%d)</div>
    <div class="list">%s</div>
    <div class="footer">
      <span>Server time: %s</span>
      <a href="?format=json">Ver JSON (?format=json)</a>
    </div>
  </div>
</body>
</html>`,
			html.EscapeString(branch),
			html.EscapeString(currentCommit.Date),
			html.EscapeString(currentCommit.Message),
			html.EscapeString(currentCommit.ShortHash),
			html.EscapeString(currentCommit.Hash),
			html.EscapeString(currentCommit.Author),
			len(commits),
			rows.String(),
			html.EscapeString(nowStr),
		)

		ctx.Data(http.StatusOK, "text/html; charset=utf-8", []byte(page))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status":         "ok",
		"service":        "fintrack-backend",
		"branch":         branch,
		"current_commit": currentCommit,
		"recent_commits": commits,
		"server_time":    nowStr,
	})
}
