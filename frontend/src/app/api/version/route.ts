import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let commits: any[] = [];
    let branch = "master";

    try {
      const gitLog = execSync('git log -n 10 --pretty=format:"%h|%H|%an|%ad|%s" --date=iso', {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const lines = gitLog.trim().split("\n");
      commits = lines.map((line) => {
        const [short_hash, hash, author, date, ...rest] = line.split("|");
        return {
          short_hash,
          hash,
          author,
          date,
          message: rest.join("|"),
        };
      });

      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      // Fallback if git is not available in production runtime
      const envSha =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RENDER_GIT_COMMIT ||
        process.env.GIT_COMMIT ||
        "bafb218";
      commits = [
        {
          short_hash: envSha.slice(0, 7),
          hash: envSha,
          author: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || "TonyBrTs",
          date: new Date().toISOString(),
          message: process.env.VERCEL_GIT_COMMIT_MESSAGE || "Fintrack Deployment",
        },
      ];
    }

    return NextResponse.json({
      status: "ok",
      service: "fintrack-frontend",
      branch,
      current_commit: commits[0] || null,
      recent_commits: commits,
      server_time: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
