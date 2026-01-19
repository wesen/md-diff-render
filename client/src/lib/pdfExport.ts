/**
 * PDF Export Utility
 * Export document with change annotations to PDF
 */

import { jsPDF } from "jspdf";
import { DHF, DHFSegment } from "@/types/dhf";

export interface PDFExportOptions {
  includeAnnotations: boolean;
  fontSize: number;
  marginSize: number;
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  includeAnnotations: true,
  fontSize: 9,
  marginSize: 2.5, // inches
};

/**
 * Export DHF document to PDF with margin annotations
 */
export async function exportToPDF(
  dhf: DHF,
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const pageWidth = 8.5;
  const pageHeight = 11;
  const marginLeft = opts.marginSize;
  const marginRight = 0.75;
  const marginTop = 1;
  const marginBottom = 1;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const annotationWidth = opts.marginSize - 0.5;

  let currentY = marginTop;
  const lineHeight = opts.fontSize / 72 * 1.5; // Convert pt to inches with 1.5 line spacing

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(dhf.document.path, marginLeft, currentY);
  currentY += lineHeight * 2;

  // Metadata
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${dhf.document.repo} / ${dhf.document.branch} • ${dhf.document.current_commit.substring(0, 7)}`, marginLeft, currentY);
  currentY += lineHeight;
  doc.text(`${dhf.summary.total_commits} commits • ${dhf.summary.lines_added} added • ${dhf.summary.lines_modified} modified • ${dhf.summary.lines_deleted} deleted`, marginLeft, currentY);
  currentY += lineHeight * 2;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(opts.fontSize);

  // Render segments
  for (const segment of dhf.content) {
    if (segment.type === "unchanged") {
      // Render unchanged text
      const lines = doc.splitTextToSize(segment.text, contentWidth);
      for (const line of lines) {
        if (currentY + lineHeight > pageHeight - marginBottom) {
          doc.addPage();
          currentY = marginTop;
        }
        doc.text(line, marginLeft, currentY);
        currentY += lineHeight;
      }
    } else if (segment.type === "added") {
      // Green background for added
      doc.setFillColor(220, 252, 231); // green-100
      const lines = doc.splitTextToSize(segment.text, contentWidth);
      const blockHeight = lines.length * lineHeight;
      
      if (currentY + blockHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = marginTop;
      }

      doc.rect(marginLeft, currentY - lineHeight * 0.2, contentWidth, blockHeight, "F");
      
      for (const line of lines) {
        doc.text(line, marginLeft, currentY);
        currentY += lineHeight;
      }

      // Annotation
      if (opts.includeAnnotations && segment.change) {
        const commit = dhf.commits.find(c => c.id === segment.change?.commit);
        if (commit) {
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          const annotationY = currentY - blockHeight;
          doc.text("+++", marginLeft - 0.3, annotationY);
          const annotationLines = doc.splitTextToSize(
            `${commit.author}\n${commit.message}`,
            annotationWidth
          );
          let annotY = annotationY;
          for (const line of annotationLines.slice(0, 3)) {
            doc.text(line, 0.5, annotY);
            annotY += lineHeight * 0.8;
          }
          doc.setFontSize(opts.fontSize);
          doc.setTextColor(0, 0, 0);
        }
      }
    } else if (segment.type === "modified") {
      // Yellow background for modified
      doc.setFillColor(254, 249, 195); // yellow-100
      const lines = doc.splitTextToSize(segment.text, contentWidth);
      const blockHeight = lines.length * lineHeight;
      
      if (currentY + blockHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = marginTop;
      }

      doc.rect(marginLeft, currentY - lineHeight * 0.2, contentWidth, blockHeight, "F");
      
      for (const line of lines) {
        doc.text(line, marginLeft, currentY);
        currentY += lineHeight;
      }

      // Annotation
      if (opts.includeAnnotations) {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        const annotationY = currentY - blockHeight;
        
        // Check for multi-commit history
        const hasHistory = segment.history && segment.history.length > 1;
        if (hasHistory) {
          doc.text("═══", marginLeft - 0.3, annotationY);
          let annotY = annotationY;
          // Show last 3 history entries
          for (const entry of segment.history!.slice(-3).reverse()) {
            const commit = dhf.commits.find(c => c.id === entry.commit);
            if (commit) {
              const modText = entry.modifications?.[0]
                ? `"${entry.modifications[0].old}" → "${entry.modifications[0].new}"`
                : "modified";
              const annotationLines = doc.splitTextToSize(
                `${modText}\n${commit.author}`,
                annotationWidth
              );
              for (const line of annotationLines.slice(0, 2)) {
                doc.text(line, 0.5, annotY);
                annotY += lineHeight * 0.8;
              }
              annotY += lineHeight * 0.3; // Space between entries
            }
          }
        } else if (segment.change) {
          doc.text("░░░", marginLeft - 0.3, annotationY);
          const commit = dhf.commits.find(c => c.id === segment.change?.commit);
          if (commit) {
            const modText = segment.change.modifications?.[0]
              ? `"${segment.change.modifications[0].old}" → "${segment.change.modifications[0].new}"`
              : "modified";
            const annotationLines = doc.splitTextToSize(
              `${modText}\n${commit.author}\n${commit.message}`,
              annotationWidth
            );
            let annotY = annotationY;
            for (const line of annotationLines.slice(0, 3)) {
              doc.text(line, 0.5, annotY);
              annotY += lineHeight * 0.8;
            }
          }
        }
        doc.setFontSize(opts.fontSize);
        doc.setTextColor(0, 0, 0);
      }
    } else if (segment.type === "deleted") {
      // Red strikethrough for deleted
      doc.setTextColor(220, 38, 38); // red-600
      const lines = doc.splitTextToSize(segment.text, contentWidth);
      const blockHeight = lines.length * lineHeight;
      
      if (currentY + blockHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = marginTop;
      }

      for (const line of lines) {
        doc.text(line, marginLeft, currentY);
        // Draw strikethrough line
        const textWidth = doc.getTextWidth(line);
        doc.setDrawColor(220, 38, 38);
        doc.line(marginLeft, currentY - lineHeight * 0.3, marginLeft + textWidth, currentY - lineHeight * 0.3);
        currentY += lineHeight;
      }
      doc.setTextColor(0, 0, 0);

      // Annotation
      if (opts.includeAnnotations && segment.change) {
        const commit = dhf.commits.find(c => c.id === segment.change?.commit);
        if (commit) {
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          const annotationY = currentY - blockHeight;
          doc.text("~~~", marginLeft - 0.3, annotationY);
          const annotationLines = doc.splitTextToSize(
            `deleted\n${commit.author}\n${commit.message}`,
            annotationWidth
          );
          let annotY = annotationY;
          for (const line of annotationLines.slice(0, 3)) {
            doc.text(line, 0.5, annotY);
            annotY += lineHeight * 0.8;
          }
          doc.setFontSize(opts.fontSize);
          doc.setTextColor(0, 0, 0);
        }
      }
    }

    currentY += lineHeight * 0.5; // Space between segments
  }

  // Save the PDF
  const filename = `${dhf.document.path.replace(/\//g, "_")}_history.pdf`;
  doc.save(filename);
}
