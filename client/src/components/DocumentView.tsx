/**
 * DocumentView Component
 * Renders markdown content with inline change indicators
 * 
 * Design: Minimal Swiss Style
 * - Clean typography with Inter font
 * - Functional spacing and grid alignment
 * - Subtle color coding for change types
 */

import { DHFSegment, DHFCommit } from "@/types/dhf";
import { Streamdown } from "streamdown";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface DocumentViewProps {
  segments: DHFSegment[];
  commits: DHFCommit[];
  showChanges: boolean;
}

export default function DocumentView({
  segments,
  commits,
  showChanges,
}: DocumentViewProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  // Create commit lookup map
  const commitMap = new Map(commits.map((c) => [c.id, c]));

  const getCommitInfo = (commitId: string) => {
    return commitMap.get(commitId);
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const renderSegment = (segment: DHFSegment, index: number) => {
    const isHovered = hoveredSegment === index;
    const commit = segment.change
      ? getCommitInfo(segment.change.commit)
      : null;

    // For unchanged segments, render without highlighting
    if (segment.type === "unchanged" || !showChanges) {
      return (
        <div key={index} className="my-2">
          <Streamdown>{segment.text}</Streamdown>
        </div>
      );
    }

    // For deleted segments, show with strikethrough
    if (segment.type === "deleted") {
      return (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <div
              className="change-deleted my-2 rounded-sm transition-all duration-200"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                boxShadow: isHovered ? "0 0 0 2px oklch(0.6 0.15 25)" : "none",
              }}
            >
              <Streamdown>{segment.text}</Streamdown>
            </div>
          </TooltipTrigger>
          {commit && (
            <TooltipContent side="left" className="max-w-sm">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Deleted</p>
                <p className="text-xs text-muted-foreground">
                  by {commit.author} {formatDate(commit.date)}
                </p>
                <p className="text-xs italic">"{commit.message}"</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      );
    }

    // For added segments
    if (segment.type === "added") {
      return (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <div
              className="change-added my-2 rounded-sm transition-all duration-200"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                boxShadow: isHovered
                  ? "0 0 0 2px oklch(0.6 0.15 145)"
                  : "none",
              }}
            >
              <Streamdown>{segment.text}</Streamdown>
            </div>
          </TooltipTrigger>
          {commit && (
            <TooltipContent side="left" className="max-w-sm">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Added</p>
                <p className="text-xs text-muted-foreground">
                  by {commit.author} {formatDate(commit.date)}
                </p>
                <p className="text-xs italic">"{commit.message}"</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      );
    }

    // For modified segments
    if (segment.type === "modified") {
      const modifications = segment.change?.modifications || [];
      const modText =
        modifications.length > 0
          ? modifications
              .map((m) => `"${m.old}" → "${m.new}"`)
              .join(", ")
          : "Modified";

      return (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <div
              className="change-modified my-2 rounded-sm transition-all duration-200"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                boxShadow: isHovered ? "0 0 0 2px oklch(0.65 0.15 85)" : "none",
              }}
            >
              <Streamdown>{segment.text}</Streamdown>
            </div>
          </TooltipTrigger>
          {commit && (
            <TooltipContent side="left" className="max-w-sm">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Modified</p>
                <p className="text-xs">{modText}</p>
                <p className="text-xs text-muted-foreground">
                  by {commit.author} {formatDate(commit.date)}
                </p>
                <p className="text-xs italic">"{commit.message}"</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      );
    }

    return null;
  };

  return (
    <div className="prose prose-sm max-w-none">
      {segments.map((segment, index) => renderSegment(segment, index))}
    </div>
  );
}
