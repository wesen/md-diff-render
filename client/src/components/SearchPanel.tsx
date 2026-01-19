/**
 * SearchPanel Component
 * Cross-version search interface
 */

import { useState } from "react";
import { DHF } from "@/types/dhf";
import { searchAcrossVersions, SearchResult } from "@/lib/search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface SearchPanelProps {
  dhf: DHF;
  onResultClick: (commitId: string, segmentIndex: number) => void;
  onClose: () => void;
}

export default function SearchPanel({ dhf, onResultClick, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = () => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const searchResults = searchAcrossVersions(dhf, query);
    setResults(searchResults);
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Search Across Versions</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Search text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        {results.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {results.length === 0 && query.trim().length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results found for "{query}"
            </p>
          )}
          {results.map((result, index) => {
            const commit = dhf.commits.find(c => c.id === result.commit);
            return (
              <button
                key={index}
                onClick={() => result.commit && onResultClick(result.commit, result.segmentIndex)}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground">
                    {result.segment.type === "added" && "+"} 
                    {result.segment.type === "deleted" && "-"} 
                    {result.segment.type === "modified" && "~"}
                  </p>
                  <p className="text-sm line-clamp-2">
                    {result.matchText.substring(0, 100)}
                    {result.matchText.length > 100 && "..."}
                  </p>
                  {commit && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-medium">{commit.message}</p>
                      <p>
                        {commit.author} • {formatDate(commit.date)}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
