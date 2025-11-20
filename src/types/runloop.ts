export interface ParsedRepo {
  repoOwner: string;
  repoName: string;
}

export interface RunloopSessionStatus {
  status: string;
  last_seen_at?: string;
}
