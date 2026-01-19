/**
 * Document History Format (DHF) TypeScript definitions
 */

export interface DHFDocument {
  path: string;
  repo: string;
  branch: string;
  current_commit: string;
  generated_at: string;
}

export interface DHFView {
  since: string;
  until: string;
}

export interface DHFCommit {
  id: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface DHFModification {
  offset: number;
  old: string;
  new: string;
}

export interface DHFChange {
  commit: string;
  before?: string;
  modifications?: DHFModification[];
}

export interface DHFHistoryEntry {
  commit: string;
  author: string;
  date: string;
  message: string;
  action: 'added' | 'modified' | 'deleted';
  before?: string;
  after?: string;
  text?: string;
  modifications?: DHFModification[];
}

export interface DHFSegment {
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
  text: string;
  change?: DHFChange;
  history?: DHFHistoryEntry[];
}

export interface DHFAuthor {
  name: string;
  commits: number;
}

export interface DHFSummary {
  total_commits: number;
  authors: DHFAuthor[];
  lines_added: number;
  lines_deleted: number;
  lines_modified: number;
}

export interface DHF {
  document: DHFDocument;
  view: DHFView;
  commits: DHFCommit[];
  content: DHFSegment[];
  summary: DHFSummary;
}
