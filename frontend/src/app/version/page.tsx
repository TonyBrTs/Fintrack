import React from "react";
import { execSync } from "child_process";

interface CommitEntry {
  short_hash: string;
  hash: string;
  author: string;
  date: string;
  message: string;
}

function getVersionData(): {
  branch: string;
  buildTime: string;
  commits: CommitEntry[];
} {
  let commits: CommitEntry[] = [];
  let branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.RENDER_GIT_BRANCH ||
    "master";

  try {
    const gitLog = execSync(
      'git log -n 10 --pretty=format:"%h|%H|%an|%ad|%s" --date=iso',
      {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }
    );
    const lines = gitLog.trim().split("\n").filter(Boolean);
    commits = lines.map((line) => {
      const [short_hash, hash, author, date, ...rest] = line.split("|");
      return {
        short_hash: short_hash || "",
        hash: hash || "",
        author: author || "",
        date: date || "",
        message: rest.join("|") || "",
      };
    });

    const detectedBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (detectedBranch) {
      branch = detectedBranch;
    }
  } catch {
    const envSha =
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.RENDER_GIT_COMMIT ||
      process.env.GIT_COMMIT ||
      "10246a9";
    commits = [
      {
        short_hash: envSha.slice(0, 7),
        hash: envSha,
        author: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || "TonyBrTs",
        date: new Date().toISOString(),
        message:
          process.env.VERCEL_GIT_COMMIT_MESSAGE || "Fintrack Production Build",
      },
    ];
  }

  return {
    branch,
    buildTime: new Date().toISOString(),
    commits,
  };
}

export default function VersionPage() {
  const { branch, buildTime, commits } = getVersionData();
  const current = commits[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-mono">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Fintrack • Version Info
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Estado del despliegue y versiones de commit
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
            branch: {branch}
          </span>
        </div>

        {/* Current Commit Box */}
        {current && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase tracking-wider font-bold text-blue-400">
                Último Commit (HEAD)
              </span>
              <span>{current.date}</span>
            </div>

            <div className="text-sm sm:text-base font-bold text-white break-words">
              {current.message}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80">
              <span>
                Hash:{" "}
                <strong className="text-emerald-400">{current.short_hash}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="truncate max-w-xs text-slate-500">
                {current.hash}
              </span>
              <span className="text-slate-600">•</span>
              <span>Autor: {current.author}</span>
            </div>
          </div>
        )}

        {/* Recent Commits List */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Historial Reciente ({commits.length})
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/80">
            {commits.map((c, idx) => (
              <div
                key={c.hash || idx}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-bold shrink-0">
                    {c.short_hash}
                  </span>
                  <span className="text-slate-200 break-words">{c.message}</span>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900">
          <span>Build timestamp: {buildTime}</span>
          <a
            href="/api/version"
            className="text-blue-400 hover:underline"
          >
            Ver JSON (/api/version)
          </a>
        </div>
      </div>
    </div>
  );
}
