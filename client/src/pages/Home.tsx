/**
 * Home Page - Markdown Git History Viewer
 * 
 * Design Philosophy: Minimal Swiss Style
 * - Functional grid layout with document on left, timeline on right
 * - Clean typography with Inter font family
 * - Precise spacing following 8px grid system
 * - Subtle borders and minimal color palette
 * - Focus on content readability and change visualization
 */

import { useState, useEffect, useMemo } from "react";
import { DHF } from "@/types/dhf";
import Header from "@/components/Header";
import DocumentView from "@/components/DocumentView";
import VersionTimeline from "@/components/VersionTimeline";
import SearchPanel from "@/components/SearchPanel";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import { reconstructAtCommit, getCurrentState } from "@/lib/timeTravel";
import { exportToPDF } from "@/lib/pdfExport";

export default function Home() {
  const [dhfData, setDhfData] = useState<DHF | null>(null);
  const [showChanges, setShowChanges] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);

  // Time-travel: reconstruct document at selected commit
  const timeTravelState = useMemo(() => {
    if (!dhfData || !selectedCommit) return null;
    return reconstructAtCommit(dhfData, selectedCommit);
  }, [dhfData, selectedCommit]);

  const handleCommitSelect = (commitId: string) => {
    setSelectedCommit(commitId);
    const commit = dhfData?.commits.find(c => c.id === commitId);
    if (commit) {
      const isLatest = commitId === dhfData?.commits[dhfData.commits.length - 1]?.id;
      if (isLatest) {
        toast.success("Viewing current version");
      } else {
        toast.info(`Time-traveled to: ${commit.message}`);
      }
    }
  };

  const handleSearchResultClick = (commitId: string, segmentIndex: number) => {
    handleCommitSelect(commitId);
    // Scroll to segment (future enhancement)
    toast.success("Jumped to search result");
  };

  const handleExportPDF = async () => {
    if (!dhfData) return;
    try {
      toast.info("Generating PDF...");
      await exportToPDF(dhfData);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Load sample data or allow file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Try parsing as JSON (YAML converted to JSON)
        let data: DHF;
        try {
          data = JSON.parse(content);
        } catch {
          // If not JSON, try to parse as YAML (would need yaml parser)
          toast.error("Please upload a JSON file (YAML support coming soon)");
          return;
        }

        setDhfData(data);
        setSelectedCommit(data.commits[data.commits.length - 1]?.id);
        toast.success("Document loaded successfully");
      } catch (error) {
        toast.error("Failed to parse file");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // Load sample data on mount
  useEffect(() => {
    // Load from sample.json file
    fetch('/sample.json')
      .then(res => res.json())
      .then(data => {
        setDhfData(data);
        setSelectedCommit(data.commits[data.commits.length - 1]?.id);
      })
      .catch(err => {
        console.error('Failed to load sample data:', err);
        // Fallback to embedded sample
        loadFallbackSample();
      });
  }, []);

  const loadFallbackSample = () => {
    const sampleData: DHF = {
      document: {
        path: "README.md",
        repo: "acme/project",
        branch: "main",
        current_commit: "a1b2c3d",
        generated_at: new Date().toISOString(),
      },
      view: {
        since: "2025-01-10T00:00:00Z",
        until: "now",
      },
      commits: [
        {
          id: "n2o3p4q",
          author: "alice",
          email: "alice@acme.co",
          date: "2025-01-12T09:15:00Z",
          message: "Stronger marketing copy",
        },
        {
          id: "h7i8j9k",
          author: "alice",
          email: "alice@acme.co",
          date: "2025-01-15T11:30:00Z",
          message: "Add config docs",
        },
        {
          id: "k9l0m1n",
          author: "carol",
          email: "carol@acme.co",
          date: "2025-01-18T16:45:00Z",
          message: "Ready for v1.0!",
        },
        {
          id: "d4e5f6g",
          author: "bob",
          email: "bob@acme.co",
          date: "2025-01-18T17:00:00Z",
          message: "Add diff feature per team request",
        },
        {
          id: "a1b2c3d",
          author: "alice",
          email: "alice@acme.co",
          date: "2025-01-19T12:00:00Z",
          message: "Add collaboration feature",
        },
      ],
      content: [
        {
          type: "unchanged",
          text: "# Project Overview\n",
        },
        {
          type: "modified",
          text: "This is a powerful markdown editor that tracks changes over time.",
          change: {
            commit: "n2o3p4q",
            before: "This is a simple markdown editor that tracks changes.",
            modifications: [
              {
                offset: 10,
                old: "simple",
                new: "powerful",
              },
              {
                offset: 56,
                old: "",
                new: " over time",
              },
            ],
          },
        },
        {
          type: "unchanged",
          text: "\nIt was designed for teams who care about document history.\n\n## Features\n",
        },
        {
          type: "added",
          text: "- Real-time collaboration",
          change: {
            commit: "a1b2c3d",
          },
        },
        {
          type: "unchanged",
          text: "\n- Git integration\n",
        },
        {
          type: "added",
          text: "- Diff visualization",
          change: {
            commit: "d4e5f6g",
          },
        },
        {
          type: "unchanged",
          text: "\n- Export options\n\n## Installation\n\nTo get started, install the package:\n\n```bash\nnpm install markdown-tracker\n```\n\nThen initialize your project:\n\n```bash\nnpx markdown-tracker init\n```\n\nThis will create a `.tracker` folder in your repository.\n",
        },
        {
          type: "added",
          text: "\n## Configuration\n\nYou can customize behavior by creating a `tracker.config.js` file in your project root. Available options include:\n\n- `ignorePatterns` - files to skip\n- `branch` - default branch to track\n- `remote` - git remote name",
          change: {
            commit: "h7i8j9k",
          },
        },
        {
          type: "unchanged",
          text: "\n\n## Contributing\n\nWe welcome contributions! Please read our contributing guide before submitting PRs.\n",
        },
        {
          type: "deleted",
          text: "\nNote: This project is still in alpha.",
          change: {
            commit: "k9l0m1n",
          },
        },
      ],
      summary: {
        total_commits: 5,
        authors: [
          { name: "alice", commits: 3 },
          { name: "bob", commits: 1 },
          { name: "carol", commits: 1 },
        ],
        lines_added: 14,
        lines_deleted: 2,
        lines_modified: 1,
      },
    };

    setDhfData(sampleData);
    setSelectedCommit(sampleData.commits[sampleData.commits.length - 1]?.id);
  };

  if (!dhfData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Markdown Git History Viewer
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload a DHF (Document History Format) file to visualize markdown
              changes over time
            </p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button asChild size="lg">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload DHF File
              </label>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        document={dhfData.document}
        summary={dhfData.summary}
        showChanges={showChanges}
        onToggleChanges={setShowChanges}
      />
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <Button
          variant={showSearch ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {timeTravelState?.isHistorical && (
              <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm font-medium">
                  📅 Viewing historical version at commit {timeTravelState.commit.substring(0, 7)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleCommitSelect(dhfData.commits[dhfData.commits.length - 1].id)}
                >
                  Return to current version
                </Button>
              </div>
            )}
            <DocumentView
              segments={timeTravelState?.segments || dhfData.content}
              commits={dhfData.commits}
              showChanges={showChanges}
            />
          </div>
        </main>

        {/* Sidebar with version timeline */}
        <aside className="w-80 border-l bg-sidebar overflow-hidden flex flex-col">
          <VersionTimeline
            commits={dhfData.commits}
            selectedCommit={selectedCommit}
            onCommitClick={handleCommitSelect}
          />
        </aside>

        {/* Search panel */}
        {showSearch && (
          <aside className="w-96 overflow-hidden flex flex-col">
            <SearchPanel
              dhf={dhfData}
              onResultClick={handleSearchResultClick}
              onClose={() => setShowSearch(false)}
            />
          </aside>
        )}
      </div>

      {/* Upload new file button */}
      <div className="fixed bottom-6 right-6">
        <input
          type="file"
          id="file-upload-fab"
          accept=".json,.yaml,.yml"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button asChild size="lg" className="shadow-lg">
          <label htmlFor="file-upload-fab" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Load File
          </label>
        </Button>
      </div>
    </div>
  );
}
