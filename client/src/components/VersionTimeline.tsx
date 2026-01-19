/**
 * VersionTimeline Component
 * Displays commit history in a vertical timeline
 * 
 * Design: Minimal Swiss Style
 * - Clean vertical rhythm
 * - Precise spacing and alignment
 * - Subtle visual hierarchy
 */

import { DHFCommit } from "@/types/dhf";
import { formatDistanceToNow } from "date-fns";
import { GitCommit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VersionTimelineProps {
  commits: DHFCommit[];
  selectedCommit?: string;
  onCommitClick?: (commitId: string) => void;
}

export default function VersionTimeline({
  commits,
  selectedCommit,
  onCommitClick,
}: VersionTimelineProps) {
  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Version History
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

          {/* Commits */}
          <div className="space-y-3">
            {commits.map((commit, index) => {
              const isSelected = selectedCommit === commit.id;
              const isLatest = index === commits.length - 1;

              return (
                <button
                  key={commit.id}
                  onClick={() => onCommitClick?.(commit.id)}
                  className={`
                    relative w-full text-left p-3 rounded-md transition-all duration-200
                    ${
                      isSelected
                        ? "bg-accent shadow-sm"
                        : "hover:bg-muted/50"
                    }
                  `}
                >
                  {/* Timeline dot */}
                  <div
                    className={`
                    absolute left-[-8px] top-[18px] w-5 h-5 rounded-full border-2 bg-background
                    flex items-center justify-center
                    ${
                      isLatest
                        ? "border-primary"
                        : "border-border"
                    }
                  `}
                  >
                    <GitCommit
                      className={`w-3 h-3 ${
                        isLatest ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="ml-6 space-y-1">
                    {isLatest && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded">
                        Current
                      </span>
                    )}

                    <p className="text-sm font-medium line-clamp-2">
                      {commit.message}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{commit.id}</span>
                      <span>•</span>
                      <span>{commit.author}</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(commit.date)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
