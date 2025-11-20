import type { ParsedRepo } from "@/types/runloop";

const GITHUB_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/i;

export function parseGithubUrl(repoUrl: string): ParsedRepo | null {
  if (!repoUrl) return null;

  const trimmed = repoUrl.trim();

  if (trimmed.includes("/") && !trimmed.startsWith("http")) {
    const [owner, repo] = trimmed.split("/").filter(Boolean);
    if (owner && repo) {
      return { repoOwner: owner, repoName: repo.replace(/\.git$/, "") };
    }
  }

  const match = trimmed.match(GITHUB_PATTERN);
  if (!match) {
    return null;
  }

  return {
    repoOwner: match[1],
    repoName: match[2].replace(/\.git$/, ""),
  };
}
