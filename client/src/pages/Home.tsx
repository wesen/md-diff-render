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

import { useState, useEffect } from "react";
import { DHF } from "@/types/dhf";
import Header from "@/components/Header";
import DocumentView from "@/components/DocumentView";
import VersionTimeline from "@/components/VersionTimeline";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [dhfData, setDhfData] = useState<DHF | null>(null);
  const [showChanges, setShowChanges] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<string | undefined>();

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

      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <DocumentView
              segments={dhfData.content}
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
            onCommitClick={setSelectedCommit}
          />
        </aside>
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
