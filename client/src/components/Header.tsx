/**
 * Header Component
 * Document metadata and controls
 * 
 * Design: Minimal Swiss Style
 * - Clean horizontal layout
 * - Functional information hierarchy
 */

import { DHFDocument, DHFSummary } from "@/types/dhf";
import { FileText, GitBranch, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  document: DHFDocument;
  summary: DHFSummary;
  showChanges: boolean;
  onToggleChanges: (show: boolean) => void;
}

export default function Header({
  document,
  summary,
  showChanges,
  onToggleChanges,
}: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="px-6 py-4">
        {/* Document title */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold">{document.path}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {document.repo} / {document.branch}
                </span>
                <span>•</span>
                <span className="font-mono">{document.current_commit}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-changes"
                checked={showChanges}
                onCheckedChange={onToggleChanges}
              />
              <Label
                htmlFor="show-changes"
                className="text-sm cursor-pointer flex items-center gap-1.5"
              >
                {showChanges ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Changes
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Changes
                  </>
                )}
              </Label>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {summary.total_commits > 0 && (
          <div className="flex items-center gap-6 text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded">
            <span>
              <strong className="text-foreground">{summary.total_commits}</strong>{" "}
              commits
            </span>
            <span>•</span>
            <span>
              <strong className="text-green-600">{summary.lines_added}</strong>{" "}
              added
            </span>
            <span>•</span>
            <span>
              <strong className="text-yellow-600">{summary.lines_modified}</strong>{" "}
              modified
            </span>
            <span>•</span>
            <span>
              <strong className="text-red-600">{summary.lines_deleted}</strong>{" "}
              deleted
            </span>
            <span>•</span>
            <span>
              {summary.authors.length} contributor{summary.authors.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
