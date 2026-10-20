package handlers

import (
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
// Designed as an operational diagnostic endpoint similar to /health.
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
		vcsRev := "bafb218"
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

	ctx.JSON(http.StatusOK, gin.H{
		"status":         "ok",
		"service":        "fintrack-backend",
		"branch":         branch,
		"current_commit": currentCommit,
		"recent_commits": commits,
		"server_time":    time.Now().Format(time.RFC3339),
	})
}
