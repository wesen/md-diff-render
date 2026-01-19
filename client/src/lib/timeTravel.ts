/**
 * Time Travel Utility
 * Reconstructs document state at any point in commit history
 */

import { DHF, DHFSegment } from "@/types/dhf";

export interface TimeTravelState {
  commit: string;
  segments: DHFSegment[];
  isHistorical: boolean;
}

/**
 * Reconstruct document state at a specific commit
 * by filtering segments to only show changes up to that commit
 */
export function reconstructAtCommit(dhf: DHF, targetCommitId: string): TimeTravelState {
  const commitIndex = dhf.commits.findIndex(c => c.id === targetCommitId);
  
  if (commitIndex === -1) {
    // Invalid commit, return current state
    return {
      commit: targetCommitId,
      segments: dhf.content,
      isHistorical: false,
    };
  }

  // Get all commits up to and including the target
  const commitsUpToTarget = new Set(
    dhf.commits.slice(0, commitIndex + 1).map(c => c.id)
  );

  const reconstructedSegments: DHFSegment[] = [];

  for (const segment of dhf.content) {
    if (segment.type === "unchanged") {
      // Unchanged segments are always included
      reconstructedSegments.push(segment);
      continue;
    }

    // For segments with history, find the state at target commit
    if (segment.history && segment.history.length > 0) {
      // Find the last history entry up to target commit
      const relevantHistory = segment.history.filter(h => 
        commitsUpToTarget.has(h.commit)
      );

      if (relevantHistory.length === 0) {
        // This segment didn't exist at target commit
        continue;
      }

      const lastEntry = relevantHistory[relevantHistory.length - 1];

      if (lastEntry.action === "deleted") {
        // Line was deleted at or before target commit
        continue;
      }

      // Use the text from the last relevant history entry
      reconstructedSegments.push({
        type: lastEntry.action === "added" ? "added" : "modified",
        text: lastEntry.after || lastEntry.text || segment.text,
        change: {
          commit: lastEntry.commit,
          before: lastEntry.before,
          modifications: lastEntry.modifications,
        },
      });
      continue;
    }

    // For segments with single change, check if it's in the target range
    if (segment.change && commitsUpToTarget.has(segment.change.commit)) {
      if (segment.type === "deleted") {
        // Don't include deleted segments in historical view
        continue;
      }
      reconstructedSegments.push(segment);
    }
  }

  const isHistorical = commitIndex < dhf.commits.length - 1;

  return {
    commit: targetCommitId,
    segments: reconstructedSegments,
    isHistorical,
  };
}

/**
 * Get the current (latest) state
 */
export function getCurrentState(dhf: DHF): TimeTravelState {
  const latestCommit = dhf.commits[dhf.commits.length - 1];
  return {
    commit: latestCommit.id,
    segments: dhf.content,
    isHistorical: false,
  };
}
