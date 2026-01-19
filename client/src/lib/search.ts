/**
 * Search Utility
 * Search across all versions of the document
 */

import { DHF, DHFSegment } from "@/types/dhf";

export interface SearchResult {
  segmentIndex: number;
  segment: DHFSegment;
  matchText: string;
  commit?: string;
  commitMessage?: string;
  author?: string;
}

/**
 * Search for text across all segments and their history
 */
export function searchAcrossVersions(
  dhf: DHF,
  query: string
): SearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  dhf.content.forEach((segment, index) => {
    // Search in current segment text
    if (segment.text.toLowerCase().includes(lowerQuery)) {
      const commit = dhf.commits.find(c => c.id === segment.change?.commit);
      results.push({
        segmentIndex: index,
        segment,
        matchText: segment.text,
        commit: segment.change?.commit,
        commitMessage: commit?.message,
        author: commit?.author,
      });
    }

    // Search in history entries
    if (segment.history) {
      segment.history.forEach(entry => {
        const textToSearch = entry.after || entry.text || entry.before || "";
        if (textToSearch.toLowerCase().includes(lowerQuery)) {
          const commit = dhf.commits.find(c => c.id === entry.commit);
          results.push({
            segmentIndex: index,
            segment,
            matchText: textToSearch,
            commit: entry.commit,
            commitMessage: commit?.message || entry.message,
            author: commit?.author || entry.author,
          });
        }
      });
    }

    // Search in "before" text for modified segments
    if (segment.change?.before && segment.change.before.toLowerCase().includes(lowerQuery)) {
      const commit = dhf.commits.find(c => c.id === segment.change?.commit);
      results.push({
        segmentIndex: index,
        segment,
        matchText: segment.change.before,
        commit: segment.change.commit,
        commitMessage: commit?.message,
        author: commit?.author,
      });
    }
  });

  return results;
}

/**
 * Highlight search query in text
 */
export function highlightText(text: string, query: string): string {
  if (!query || query.trim().length === 0) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
