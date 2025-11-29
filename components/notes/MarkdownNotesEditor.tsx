'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAutosaveIndicator } from '@/context/AutosaveIndicator';
import { useDebouncedCallback } from 'use-debounce';
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  Edit3,
  FileText,
  HelpCircle,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Note {
  id: string;
  title?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  isPublic: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  workspaceId?: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  workspace?: {
    id: string;
    name: string;
    color: string;
  } | null;
  content: string; // Changed from blocks to content for markdown
}

interface MarkdownNotesEditorProps {
  note: Note | null;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => Promise<void>;
  onNoteDelete: (noteId: string) => Promise<void>;
  isLoading?: boolean;
}

// Simple table insertion helper
const insertSimpleTable = () => {
  return `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
};
// Command Suggestions Modal Component
interface CommandSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandSuggestionsModal: React.FC<CommandSuggestionsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Markdown Help</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Advanced Features */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                🎆 Advanced Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
                    📋 Visual Table Editor
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Create tables with visual editor (Ctrl+T)</p>
                  <div className="bg-primary/10 p-2 rounded text-xs font-mono">
                    Interactive table creation with customizable size and alignment
                  </div>
                </div>

                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
                    ☑️ Interactive Todos
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Checkboxes you can click to toggle</p>
                  <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                    - [x] Completed task<br/>
                    - [ ] Pending task
                  </div>
                </div>

                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
                    🧮 Math Equations
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">LaTeX math support inline and block</p>
                  <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                    Inline: $E = mc^2$<br/>
                    Block: $$\sum_&#123;i=1&#125;^&#123;n&#125; x_i$$
                  </div>
                </div>

                <div className="bg-muted/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
                    ⚠️ Callouts
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Highlighted information blocks</p>
                  <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                    {'> [!NOTE] Title'}<br/>
                    {'> Content here'}
                  </div>
                </div>
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                ⌨️ Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-card-foreground text-sm sm:text-base">Formatting</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bold text</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+B</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Italic text</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+I</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Math equation</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+M</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Code block</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+Shift+C</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-card-foreground text-sm sm:text-base">Advanced</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Create Table</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+T</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Insert Todo</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+Shift+T</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Insert Callout</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+Shift+A</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Toggle Preview</span>
                      <kbd className="bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Ctrl+Shift+P</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Basic Markdown */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                📝 Basic Markdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Headings</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      # Heading 1<br/>
                      ## Heading 2<br/>
                      ### Heading 3
                    </div>
                  </div>

                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Text Formatting</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      **bold** or __bold__<br/>
                      *italic* or _italic_<br/>
                      ~~strikethrough~~<br/>
                      ==highlight==
                    </div>
                  </div>

                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Lists</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      - Bullet point<br/>
                      1. Numbered item<br/>
                      - [x] Completed task<br/>
                      - [ ] Todo item
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Links & Images</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      [Link text](https://url)<br/>
                      ![Alt text](image.jpg)
                    </div>
                  </div>

                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Code</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      `inline code`<br/><br/>
                      ```javascript<br/>
                      // code block<br/>
                      function hello() &#123; &#125;<br/>
                      ```
                    </div>
                  </div>

                  <div className="bg-muted/20 p-2 sm:p-3 rounded">
                    <div className="font-medium text-card-foreground mb-1 text-xs sm:text-sm">Other</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {'> Block quote'}<br/>
                      --- (horizontal rule)<br/>
                      [^1]: Footnote reference
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Examples */}
            <section>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4 flex items-center gap-2">
                🎁 Live Examples
              </h3>
              <div className="bg-muted/10 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2 text-sm sm:text-base">Try copying this example:</h4>
                <pre className="bg-muted/50 p-2 sm:p-3 rounded text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
{`# My Project Notes

## Tasks
- [x] Set up project structure
- [ ] Design user interface
- [ ] Implement core features

## Math Formula
The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$

> [!TIP] Pro Tip
> Use Ctrl+T to create tables with the visual editor!

## Code Example
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

This note has a footnote[^1].

[^1]: This is the footnote content.`}
                </pre>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end p-3 sm:p-4 border-t border-border flex-shrink-0">
          <Button onClick={onClose} size="sm" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Got it!</Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced markdown renderer with advanced features
const renderMarkdown = (
  content: string,
  isPreviewMode: boolean = false
): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  // Collect footnotes in the first pass
  const footnotes: { [key: string]: string } = {};
  lines.forEach(line => {
    const footnoteMatch = line.match(/^\[\^([^\]]+)\]:\s*(.+)/);
    if (footnoteMatch) {
      footnotes[footnoteMatch[1]] = footnoteMatch[2];
    }
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip footnote definitions (they're collected above)
    if (line.match(/^\[\^([^\]]+)\]:\s*(.+)/)) {
      continue;
    }

    // Interactive Todo/Checkbox items
    const todoMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.+)/);
    if (todoMatch) {
      const indent = todoMatch[1].length;
      const isChecked = todoMatch[2] === 'x';
      const text = todoMatch[3];

      elements.push(
        <div key={i} className={cn('flex items-center gap-2 my-1', indent > 0 && `ml-${Math.min(indent * 4, 16)}`)}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              const newChecked = e.target.checked;
              const newLine = `${todoMatch[1]}- [${newChecked ? 'x' : ' '}] ${text}`;
              const newContent = lines.map((l, idx) => idx === i ? newLine : l).join('\n');
              // Update content through the parent component
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('todoToggle', { detail: { newContent } });
                window.dispatchEvent(event);
              }
            }}
            className="rounded border-border"
          />
          <span className={cn('text-foreground', isChecked && 'line-through text-muted-foreground')}>
            {renderInlineMarkdown(text, footnotes)}
          </span>
        </div>
      );
      continue;
    }

    // Math Equations (Block level: $$...$$)
    if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
      const mathContent = line.slice(2, -2).trim();
      elements.push(
        <div key={i} className="my-4 p-4 bg-muted/30 border border-border rounded-lg text-center">
          <div className="font-mono text-sm text-muted-foreground mb-2">LaTeX Math Block:</div>
          <div className="text-lg font-mono bg-background p-3 rounded border text-foreground">
            {mathContent}
          </div>
        </div>
      );
      continue;
    }

    // Mermaid Diagrams
    if (line.startsWith('```mermaid')) {
      const diagramEnd = lines.findIndex((l, idx) => idx > i && l.startsWith('```'));
      if (diagramEnd !== -1) {
        const diagramContent = lines.slice(i + 1, diagramEnd).join('\n');
        elements.push(
          <div key={i} className="my-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Mermaid Diagram</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded border font-mono text-sm whitespace-pre-wrap text-foreground">
              {diagramContent}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              This diagram will be rendered when Mermaid.js is loaded
            </div>
          </div>
        );
        i = diagramEnd;
        continue;
      }
    }

    // Callouts/Admonitions
    const calloutMatch = line.match(/^>\s*\[(!)?(NOTE|INFO|TIP|WARNING|DANGER|CAUTION)\](.*)/);
    if (calloutMatch) {
      const type = calloutMatch[2].toLowerCase();
      const title = calloutMatch[3].trim() || type.charAt(0).toUpperCase() + type.slice(1);

      // Collect callout content
      const calloutLines = [title];
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('> ') || lines[j].trim() === '>')) {
        const contentLine = lines[j].startsWith('> ') ? lines[j].slice(2) : '';
        if (contentLine || lines[j].trim() === '>') {
          calloutLines.push(contentLine);
        }
        j++;
      }

      const calloutColors = {
        note: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
        info: 'border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200',
        tip: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 text-green-800 dark:text-green-200',
        warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
        danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 text-red-800 dark:text-red-200',
        caution: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 text-orange-800 dark:text-orange-200'
      };

      const colorClass = calloutColors[type as keyof typeof calloutColors] || calloutColors.note;

      elements.push(
        <div key={i} className={cn('my-4 p-4 border rounded-lg', colorClass)}>
          <div className="font-semibold mb-2 flex items-center gap-2">
            <span>{calloutMatch[1] ? '⚠️' : 'ℹ️'}</span>
            {calloutLines[0]}
          </div>
          {calloutLines.slice(1).map((line, idx) => (
            <div key={idx} className="text-sm leading-relaxed">
              {line ? renderInlineMarkdown(line, footnotes) : <br />}
            </div>
          ))}
        </div>
      );
      i = j - 1;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

      elements.push(
        <HeadingTag
          key={i}
          className={cn(
            'font-semibold text-foreground mt-6 mb-2',
            level === 1 && 'text-3xl mt-8 mb-4',
            level === 2 && 'text-2xl mt-6 mb-3',
            level === 3 && 'text-xl mt-4 mb-2',
            level === 4 && 'text-lg',
            level === 5 && 'text-base',
            level === 6 && 'text-sm'
          )}
        >
          {renderInlineMarkdown(text, footnotes)}
        </HeadingTag>
      );
      continue;
    }

    // Code blocks
    if (line.startsWith('```') && !line.startsWith('```mermaid')) {
      const codeBlockEnd = lines.findIndex((l, idx) => idx > i && l.startsWith('```'));
      if (codeBlockEnd !== -1) {
        const codeContent = lines.slice(i + 1, codeBlockEnd).join('\n');
        const language = line.slice(3).trim();

        elements.push(
          <div key={i} className="bg-muted/50 border rounded-lg my-4 overflow-hidden">
            {language && (
              <div className="bg-muted/80 px-3 py-1 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {language}
                </span>
              </div>
            )}
            <div className="p-4">
              <pre className="text-sm text-foreground overflow-x-auto font-mono leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          </div>
        );
        i = codeBlockEnd;
        continue;
      } else {
        // Handle incomplete code block - treat as regular text
        elements.push(
          <p key={i} className="my-2 text-foreground leading-relaxed">
            {renderInlineMarkdown(line, footnotes)}
          </p>
        );
        continue;
      }
    }

    // Block quotes (enhanced to exclude callouts)
    if (line.startsWith('> ') && !line.match(/^>\s*\[(!)?(NOTE|INFO|TIP|WARNING|DANGER|CAUTION)\]/)) {
      const quoteLines = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith('> ')) {
        quoteLines.push(lines[j].slice(2));
        j++;
      }

      elements.push(
        <blockquote key={i} className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r">
          {quoteLines.map((quoteLine, idx) => (
            <p key={idx} className="my-1">{renderInlineMarkdown(quoteLine, footnotes)}</p>
          ))}
        </blockquote>
      );
      i = j - 1;
      continue;
    }

    // Enhanced Tables with alignment support
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0].split('|').map(cell => cell.trim()).filter(Boolean);

        // Parse alignment from second row (e.g., |:--|--:|:--:|)
        let alignments: string[] = [];
        if (tableLines[1] && tableLines[1].includes('---')) {
          alignments = tableLines[1].split('|').map(cell => {
            const trimmed = cell.trim();
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
            if (trimmed.endsWith(':')) return 'right';
            if (trimmed.startsWith(':')) return 'left';
            return 'left';
          }).filter(Boolean);
        }

        const rows = tableLines.slice(2).map(row =>
          row.split('|').map(cell => cell.trim()).filter(Boolean)
        );

        elements.push(
          <div key={i} className="overflow-x-auto my-4 group relative border border-transparent hover:border-border rounded-lg transition-colors">
            <table className="min-w-full border border-border rounded-lg bg-card overflow-hidden">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className={cn(
                        'border-r border-border px-4 py-3 font-semibold text-card-foreground bg-muted/80 last:border-r-0',
                        alignments[idx] === 'center' && 'text-center',
                        alignments[idx] === 'right' && 'text-right',
                        alignments[idx] === 'left' && 'text-left'
                      )}
                    >
                      {renderInlineMarkdown(header, footnotes)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={cn('hover:bg-muted/20 transition-colors', rowIdx % 2 === 0 ? 'bg-muted/10' : 'bg-card')}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={cn(
                          'border-r border-border px-4 py-3 text-card-foreground last:border-r-0',
                          alignments[cellIdx] === 'center' && 'text-center',
                          alignments[cellIdx] === 'right' && 'text-right',
                          alignments[cellIdx] === 'left' && 'text-left'
                        )}
                      >
                        {renderInlineMarkdown(cell, footnotes)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j - 1;
        continue;
      }
    }

    // Lists (enhanced)
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)/);

    if (bulletMatch || numberedMatch) {
      const listLines = [];
      let j = i;
      const isBulleted = !!bulletMatch;

      while (j < lines.length) {
        const currentLine = lines[j];
        const currentBulletMatch = currentLine.match(/^(\s*)[-*+]\s+(.+)/);
        const currentNumberedMatch = currentLine.match(/^(\s*)\d+\.\s+(.+)/);

        if ((isBulleted && currentBulletMatch) || (!isBulleted && currentNumberedMatch)) {
          listLines.push({
            indent: (currentBulletMatch?.[1] || currentNumberedMatch?.[1] || '').length,
            content: currentBulletMatch?.[2] || currentNumberedMatch?.[2] || ''
          });
          j++;
        } else if (currentLine.trim() === '') {
          j++;
        } else {
          break;
        }
      }

      const ListTag = isBulleted ? 'ul' : 'ol';
      elements.push(
        <ListTag key={i} className={cn(
          'my-4 space-y-1',
          isBulleted ? 'list-disc list-inside' : 'list-decimal list-inside'
        )}>
          {listLines.map((item, idx) => (
            <li key={idx} className="text-foreground">
              {renderInlineMarkdown(item.content, footnotes)}
            </li>
          ))}
        </ListTag>
      );
      i = j - 1;
      continue;
    }

    // Horizontal rule
    if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      elements.push(<hr key={i} className="border-border my-6" />);
      continue;
    }

    // Regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={i} className="my-2 text-foreground leading-relaxed">
          {renderInlineMarkdown(line, footnotes)}
        </p>
      );
    } else {
      elements.push(<br key={i} />);
    }
  }

  // Add footnotes section if any exist
  const footnoteElements = Object.keys(footnotes).length > 0 ? (
    <div className="mt-8 pt-4 border-t border-border">
      <h4 className="text-sm font-semibold text-foreground mb-3">Footnotes</h4>
      <div className="space-y-2">
        {Object.entries(footnotes).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="text-primary font-mono">[^{key}]:</span>
            <span className="ml-2 text-foreground">{renderInlineMarkdown(value, footnotes)}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="prose prose-sm max-w-none">
      {elements}
      {footnoteElements}
    </div>
  );
};

// Inline markdown renderer with footnotes support
const renderInlineMarkdown = (text: string, footnotes: { [key: string]: string } = {}): React.ReactNode => {
  const parts = [];
  let currentIndex = 0;
  let iterations = 0;
  const maxIterations = text.length * 2; // Safety limit to prevent infinite loops

  while (currentIndex < text.length && iterations < maxIterations) {
    iterations++;

    // Inline Math equations $...$
    const inlineMathMatch = text.slice(currentIndex).match(/^\$([^$]+)\$/);
    if (inlineMathMatch) {
      parts.push(
        <span key={currentIndex} className="inline-flex items-center px-2 py-1 bg-muted/50 border border-border rounded text-sm font-mono text-foreground">
          <span className="text-primary mr-1">Σ</span>
          {inlineMathMatch[1]}
        </span>
      );
      currentIndex += inlineMathMatch[0].length;
      continue;
    }

    // Footnote references [^id]
    const footnoteRefMatch = text.slice(currentIndex).match(/^\[\^([^\]]+)\]/);
    if (footnoteRefMatch) {
      const footnoteId = footnoteRefMatch[1];
      const footnoteText = footnotes[footnoteId];

      parts.push(
        <span
          key={currentIndex}
          className="inline-flex items-center text-primary hover:text-primary/80 cursor-help transition-colors"
          title={footnoteText ? `${footnoteText}` : `Footnote: ${footnoteId}`}
        >
          <sup className="text-xs font-medium border border-primary/30 rounded px-1 ml-0.5 bg-primary/10">
            {footnoteId}
          </sup>
        </span>
      );
      currentIndex += footnoteRefMatch[0].length;
      continue;
    }

    // Bold text **text** or __text__
    const boldMatch = text.slice(currentIndex).match(/^(\*\*|__)([^*_]+?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={currentIndex} className="font-bold text-foreground">
          {boldMatch[2]}
        </strong>
      );
      currentIndex += boldMatch[0].length;
      continue;
    }

    // Italic text *text* or _text_
    const italicMatch = text.slice(currentIndex).match(/^(\*|_)([^*_]+?)\1/);
    if (italicMatch) {
      parts.push(
        <em key={currentIndex} className="italic text-foreground">
          {italicMatch[2]}
        </em>
      );
      currentIndex += italicMatch[0].length;
      continue;
    }

    // Inline code `code`
    const codeMatch = text.slice(currentIndex).match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={currentIndex} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
          {codeMatch[1]}
        </code>
      );
      currentIndex += codeMatch[0].length;
      continue;
    }

    // Links [text](url)
    const linkMatch = text.slice(currentIndex).match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={currentIndex}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
      currentIndex += linkMatch[0].length;
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = text.slice(currentIndex).match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      parts.push(
        <del key={currentIndex} className="line-through text-muted-foreground">
          {strikeMatch[1]}
        </del>
      );
      currentIndex += strikeMatch[0].length;
      continue;
    }

    // Highlight ==text==
    const highlightMatch = text.slice(currentIndex).match(/^==([^=]+)==/);
    if (highlightMatch) {
      parts.push(
        <mark key={currentIndex} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-foreground">
          {highlightMatch[1]}
        </mark>
      );
      currentIndex += highlightMatch[0].length;
      continue;
    }

    // Regular text
    let textContent = '';
    let textIterations = 0;
    const maxTextIterations = text.length - currentIndex;

    while (currentIndex < text.length && textIterations < maxTextIterations) {
      const char = text[currentIndex];
      if (char === '*' || char === '_' || char === '`' || char === '[' || char === '~' || char === '$' || char === '=') {
        break;
      }
      textContent += char;
      currentIndex++;
      textIterations++;
    }

    if (textContent) {
      parts.push(textContent);
    }

    // Safety check - if we're not making progress, break
    if (textIterations === 0 && currentIndex < text.length) {
      // Skip the current character to avoid infinite loop
      parts.push(text[currentIndex]);
      currentIndex++;
    }
  }

  return parts.length > 0 ? parts : text;
};

// Visual Table Editor Component
interface VisualTableEditorProps {
  isOpen: boolean;
  onSave: (markdown: string) => void;
  onCancel: () => void;
}

const VisualTableEditor: React.FC<VisualTableEditorProps> = ({ isOpen, onSave, onCancel }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [headerAlignments, setHeaderAlignments] = useState<('left' | 'center' | 'right')[]>([]);

  // Initialize table data when modal opens
  useEffect(() => {
    if (isOpen) {
      const newData = Array(rows).fill(null).map((_, rowIndex) =>
        Array(cols).fill(null).map((_, colIndex) =>
          rowIndex === 0 ? `Header ${colIndex + 1}` : ''
        )
      );
      setTableData(newData);
      setHeaderAlignments(Array(cols).fill('left'));
    }
  }, [isOpen, rows, cols]);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const updateAlignment = (colIndex: number, alignment: 'left' | 'center' | 'right') => {
    const newAlignments = [...headerAlignments];
    newAlignments[colIndex] = alignment;
    setHeaderAlignments(newAlignments);
  };

  const generateMarkdown = () => {
    if (tableData.length === 0) return '';

    const [headerRow, ...dataRows] = tableData;

    // Generate header row
    const headerMarkdown = '| ' + headerRow.join(' | ') + ' |';

    // Generate alignment row
    const alignmentMarkdown = '| ' + headerAlignments.map(align => {
      switch (align) {
        case 'center': return ':---:';
        case 'right': return '---:';
        default: return '---';
      }
    }).join(' | ') + ' |';

    // Generate data rows
    const dataMarkdown = dataRows.map(row =>
      '| ' + row.join(' | ') + ' |'
    ).join('\n');

    return [headerMarkdown, alignmentMarkdown, dataMarkdown].join('\n');
  };

  const handleSave = () => {
    const markdown = generateMarkdown();
    onSave(markdown);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col mx-2 sm:mx-0">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9M3 14h6m-6 4h6" />
            </svg>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Visual Table Editor</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-card-foreground">Rows:</label>
              <Input
                type="number"
                min="2"
                max="20"
                value={rows}
                onChange={(e) => setRows(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-16 h-8 text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-card-foreground">Columns:</label>
              <Input
                type="number"
                min="2"
                max="10"
                value={cols}
                onChange={(e) => setCols(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="border border-border rounded-lg overflow-hidden bg-background">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {tableData[0]?.map((cell, colIndex) => (
                    <th key={colIndex} className="border-r border-border p-2 min-w-[120px] last:border-r-0">
                      <div className="space-y-2">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(0, colIndex, e.target.value)}
                          className="font-semibold bg-background border-border text-card-foreground"
                          placeholder={`Header ${colIndex + 1}`}
                        />
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={headerAlignments[colIndex] === 'left' ? 'default' : 'outline'}
                            onClick={() => updateAlignment(colIndex, 'left')}
                            className="text-xs px-2 py-1 h-6"
                            title="Align Left"
                          >
                            L
                          </Button>
                          <Button
                            size="sm"
                            variant={headerAlignments[colIndex] === 'center' ? 'default' : 'outline'}
                            onClick={() => updateAlignment(colIndex, 'center')}
                            className="text-xs px-2 py-1 h-6"
                            title="Align Center"
                          >
                            C
                          </Button>
                          <Button
                            size="sm"
                            variant={headerAlignments[colIndex] === 'right' ? 'default' : 'outline'}
                            onClick={() => updateAlignment(colIndex, 'right')}
                            className="text-xs px-2 py-1 h-6"
                            title="Align Right"
                          >
                            R
                          </Button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card">
                {tableData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex + 1} className="border-b border-border last:border-b-0">
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border-r border-border p-2 last:border-r-0">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                          placeholder={`Data ${rowIndex + 1}-${colIndex + 1}`}
                          className="bg-background border-border text-card-foreground"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-3 sm:p-4 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={onCancel} className="text-xs sm:text-sm px-3 sm:px-4">
            Cancel
          </Button>
          <Button onClick={handleSave} className="text-xs sm:text-sm px-3 sm:px-4">
            Insert Table
          </Button>
        </div>
      </div>
    </div>
  );
};

export function MarkdownNotesEditor({
  note,
  onNoteUpdate,
  onNoteDelete,
  isLoading = false,
}: MarkdownNotesEditorProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { toast } = useToast();
  const { onSetStatus, status } = useAutosaveIndicator();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const [showTableEditor, setShowTableEditor] = useState(false);

  // Debug logging for table editor state (reduced)
  // useEffect removed as table editor functionality has been removed

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from note with draft recovery
  useEffect(() => {
    if (note) {
      // Check for draft in localStorage
      const cacheKey = `note-draft-${note.id}`;
      const cachedDraft = localStorage.getItem(cacheKey);

      if (cachedDraft) {
        try {
          const draft = JSON.parse(cachedDraft);
          const draftAge = Date.now() - draft.timestamp;

          // Use draft if it's less than 30 minutes old
          if (draftAge < 30 * 60 * 1000) {
            // Clean up any duplicate headers and rows in draft content
            setContent(draft.content || note.content || '');
            setTitle(draft.title || note.title || 'Untitled');
            setIcon(note.icon || '📝');

            // Show toast about recovered draft
            toast({
              title: 'Draft recovered',
              description: 'We found unsaved changes and restored them.',
            });

            // Mark as unsaved since we have a draft
            onSetStatus('unsaved');
            return;
          } else {
            // Remove old draft
            localStorage.removeItem(cacheKey);
          }
        } catch (error) {
          // Invalid draft, remove it
          localStorage.removeItem(cacheKey);
        }
      }

      // Use note content if no valid draft - also clean up duplicates
      setContent(note.content || '');
      setTitle(note.title || 'Untitled');
      setIcon(note.icon || '📝');

      // Set original values for comparison
      originalContent.current = note.content || '';
      originalTitle.current = note.title || 'Untitled';

      // Mark as saved since we're loading fresh content
      onSetStatus('saved');
    } else {
      setContent('');
      setTitle('Untitled');
      setIcon('📝');
    }
  }, [note?.id]);

  // Handle real-time updates from other users
  useEffect(() => {
    if (note?.id && (note.content !== undefined || note.title !== undefined)) {
      // If content matches what we have, do nothing
      if (note.content === content && note.title === title) return;

      // Check if we have unsaved changes
      const hasUnsavedChanges = content !== originalContent.current || title !== originalTitle.current;

      if (!hasUnsavedChanges) {
        // Safe to update since we are in sync with the last known server state
        if (note.content !== undefined && note.content !== content) {
          setContent(note.content);
          originalContent.current = note.content;
        }
        if (note.title !== undefined && note.title !== title) {
          setTitle(note.title);
          originalTitle.current = note.title;
        }
        if (note.icon !== undefined && note.icon !== icon) {
          setIcon(note.icon);
        }
      } else {
        // We have local changes. Check if the incoming update is actually new/different from what we started with.
        // This avoids conflict warnings for our own updates that are just echoing back.
        const isExternalContentUpdate = note.content !== undefined && note.content !== originalContent.current;
        const isExternalTitleUpdate = note.title !== undefined && note.title !== originalTitle.current;

        if (isExternalContentUpdate || isExternalTitleUpdate) {
           toast({
               title: "Update Available",
               description: "Another user updated this note. Save your changes to sync.",
           });
        }
      }
    }
  }, [note?.content, note?.title, note?.icon]);

  // Handle todo toggle events from markdown rendering
  useEffect(() => {
    const handleTodoToggle = (event: CustomEvent) => {
      const { newContent } = event.detail;
      setContent(newContent);
    };

    window.addEventListener('todoToggle', handleTodoToggle as EventListener);
    return () => {
      window.removeEventListener('todoToggle', handleTodoToggle as EventListener);
    };
  }, []);

  // Auto-save with debounce - completely stable version
  const debouncedSave = useDebouncedCallback(async () => {
    const currentNoteId = note?.id;
    const currentTitle = titleRef.current;
    const currentContent = contentRef.current;

    if (!currentNoteId) return;

    try {
      onSetStatus('pending');

      // Save to localStorage for instant recovery
      const cacheKey = `note-draft-${currentNoteId}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        title: currentTitle,
        content: currentContent,
        timestamp: Date.now()
      }));

      await onNoteUpdate(currentNoteId, {
        title: currentTitle,
        content: currentContent
      });

      // Update original values to match saved content
      originalContent.current = currentContent;
      originalTitle.current = currentTitle;

      // Clear localStorage cache after successful save
      localStorage.removeItem(cacheKey);
      onSetStatus('saved');
    } catch (error) {
      onSetStatus('unsaved');
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  }, 1000, { leading: false, trailing: true });

  // Track original content to properly detect changes
  const originalContent = useRef<string>('');
  const originalTitle = useRef<string>('');

  // Refs for stable access to current values in debounced functions
  const contentRef = useRef<string>('');
  const titleRef = useRef<string>('');

  // Keep refs updated with current state
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Update original values when note changes
  useEffect(() => {
    if (note) {
      originalContent.current = note.content || '';
      originalTitle.current = note.title || 'Untitled';
    }
  }, [note?.id]);

  // Store debouncedSave in ref to avoid dependency issues
  const debouncedSaveRef = useRef(debouncedSave);

  // Update ref when debouncedSave changes
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave;
  }, [debouncedSave]);

  // Mark as unsaved when content changes and trigger auto-save
  useEffect(() => {
    if (!note?.id) {
      return;
    }

    const hasContentChanged = content !== originalContent.current;
    const hasTitleChanged = title !== originalTitle.current;

    if (hasContentChanged || hasTitleChanged) {
      onSetStatus('unsaved');
      debouncedSaveRef.current();
    } else {
      // Content matches original, mark as saved
      onSetStatus('saved');
    }
  }, [content, title, note?.id]);

  const handleContentChange = useCallback((newContent: string) => {
    // Instant UI update for responsive feel
    setContent(newContent);

    // Save to localStorage immediately for recovery
    if (note?.id) {
      const cacheKey = `note-draft-${note.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        title,
        content: newContent,
        timestamp: Date.now()
      }));
    }

    // Don't change status here - let the useEffect handle it based on actual changes
  }, [note?.id, title]);



  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Bold shortcut: Ctrl+B (Windows/Linux) or Cmd+B (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);

      let newContent: string;
      let newCursorPos: number;

      if (selectedText) {
        // If text is selected, wrap it with **
        const beforeText = content.slice(0, start);
        const afterText = content.slice(end);
        newContent = beforeText + '**' + selectedText + '**' + afterText;
        newCursorPos = end + 4; // Move cursor after the closing **
      } else {
        // If no text is selected, insert ** ** and place cursor between
        const beforeText = content.slice(0, start);
        const afterText = content.slice(start);
        newContent = beforeText + '****' + afterText;
        newCursorPos = start + 2; // Place cursor between the **
      }

      setContent(newContent);

      // Set cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Italic shortcut: Ctrl+I (Windows/Linux) or Cmd+I (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);

      let newContent: string;
      let newCursorPos: number;

      if (selectedText) {
        const beforeText = content.slice(0, start);
        const afterText = content.slice(end);
        newContent = beforeText + '*' + selectedText + '*' + afterText;
        newCursorPos = end + 2;
      } else {
        const beforeText = content.slice(0, start);
        const afterText = content.slice(start);
        newContent = beforeText + '**' + afterText;
        newCursorPos = start + 1;
      }

      setContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Mode toggle shortcut: Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      setIsPreviewMode(!isPreviewMode);
    }

    // Code block shortcut: Ctrl+Shift+C (Windows/Linux) or Cmd+Shift+C (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);

      let newContent: string;
      let newCursorPos: number;

      if (selectedText) {
        // If text is selected, wrap it in a code block
        const beforeText = content.slice(0, start);
        const afterText = content.slice(end);
        newContent = beforeText + '```\n' + selectedText + '\n```' + afterText;
        newCursorPos = end + 8; // Move cursor after the closing ```
      } else {
        // If no text is selected, insert code block template
        const beforeText = content.slice(0, start);
        const afterText = content.slice(start);
        const codeBlockTemplate = '```\n// Your code here\n```';
        newContent = beforeText + codeBlockTemplate + afterText;
        newCursorPos = start + 4; // Place cursor after the opening ``` and newline
      }

      setContent(newContent);

      // Set cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Math equation shortcut: Ctrl+M (Windows/Linux) or Cmd+M (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);

      let newContent: string;
      let newCursorPos: number;

      if (selectedText) {
        const beforeText = content.slice(0, start);
        const afterText = content.slice(end);
        newContent = beforeText + '$' + selectedText + '$' + afterText;
        newCursorPos = end + 2;
      } else {
        const beforeText = content.slice(0, start);
        const afterText = content.slice(start);
        const mathTemplate = '$E = mc^2$';
        newContent = beforeText + mathTemplate + afterText;
        newCursorPos = start + 1; // Place cursor after $
      }

      setContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Table shortcut: Ctrl+T (Windows/Linux) or Cmd+T (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      setShowTableEditor(true);
    }

    // Todo shortcut: Ctrl+Shift+T (Windows/Linux) or Cmd+Shift+T (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const beforeText = content.slice(0, start);
      const afterText = content.slice(start);

      const todoTemplate = '- [ ] Task to complete';
      const newContent = beforeText + todoTemplate + afterText;

      setContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 6, start + 21); // Select "Task to complete"
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Callout shortcut: Ctrl+Shift+A (Windows/Linux) or Cmd+Shift+A (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const beforeText = content.slice(0, start);
      const afterText = content.slice(start);

      const calloutTemplate = '> [!NOTE] Important Information\n> This is a callout block for highlighting important content.';
      const newContent = beforeText + calloutTemplate + afterText;

      setContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 9, start + 30); // Select "Important Information"
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Help modal shortcut: Ctrl+/ (Windows/Linux) or Cmd+/ (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      setShowCommandsModal(true);
    }
  }, [content, isPreviewMode]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // Let the useEffect handle status changes based on actual content differences
  }, []);

  const toggleMode = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode]);

  const handleTableSave = useCallback((markdown: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const beforeText = content.slice(0, start);
      const afterText = content.slice(start);

      const needsNewlineBefore = beforeText && !beforeText.endsWith('\n\n');
      const needsNewlineAfter = afterText && !afterText.startsWith('\n\n');

      const prefix = needsNewlineBefore ? (beforeText.endsWith('\n') ? '\n' : '\n\n') : '';
      const suffix = needsNewlineAfter ? (afterText.startsWith('\n') ? '\n' : '\n\n') : '';

      const newContent = beforeText + prefix + markdown + suffix + afterText;

      setContent(newContent);
      setShowTableEditor(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = start + prefix.length + markdown.length + suffix.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [content]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);



  // Global keyboard handler for preview mode
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle in preview mode
      if (isPreviewMode && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsPreviewMode(false);
        // Focus the textarea after switching to edit mode
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isPreviewMode]);

  // Loading skeleton component for instant perceived performance
  const LoadingSkeleton = () => (
    <div className="flex-1 flex flex-col bg-background overflow-hidden animate-pulse">
      <div className="flex-1 p-8 bg-background overflow-hidden">
        <div className="w-full h-full flex flex-col px-4">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded flex-1 max-w-lg"></div>
            <div className="w-20 h-8 bg-muted rounded"></div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-full"></div>
            <div className="h-6 bg-muted rounded w-5/6"></div>
            <div className="h-20 bg-muted rounded w-full"></div>
            <div className="h-6 bg-muted rounded w-2/3"></div>
            <div className="h-6 bg-muted rounded w-4/5"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ALL CONDITIONAL RETURNS AFTER ALL HOOKS

  // Show loading skeleton when loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show message when no note is selected
  if (!note && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Select a note to start editing
          </h3>
          <p className="text-muted-foreground">
            Choose a note from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Command Suggestions Modal */}
      <CommandSuggestionsModal
        isOpen={showCommandsModal}
        onClose={() => setShowCommandsModal(false)}
      />

      {/* Visual Table Editor Modal */}
      <VisualTableEditor
        isOpen={showTableEditor}
        onSave={handleTableSave}
        onCancel={() => setShowTableEditor(false)}
      />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-3 sm:p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-full flex items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button className="text-xl sm:text-2xl hover:bg-accent rounded p-1 transition-colors">
              {icon}
            </button>

            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                  }
                }}
                className="text-base sm:text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent text-foreground focus:outline-none focus:ring-0 focus:border-none"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-base sm:text-lg font-semibold cursor-pointer hover:bg-accent/50 rounded px-2 py-1 transition-colors text-foreground truncate"
              >
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Help/Commands Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommandsModal(true)}
              className="hidden sm:flex items-center gap-2 text-xs px-2 py-1"
              title="Markdown Commands & Help (Ctrl+/)"
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Help</span>
            </Button>

            {/* Mobile Help Button - icon only */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommandsModal(true)}
              className="sm:hidden p-1.5"
              title="Markdown Commands & Help (Ctrl+/)"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            {/* Table Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableEditor(true)}
              className="hidden sm:flex items-center gap-2 text-xs px-2 py-1"
              title="Create Table (Ctrl+T)"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9M3 14h6m-6 4h6" />
              </svg>
              <span className="hidden md:inline">Table</span>
            </Button>

            {/* Mobile Table Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableEditor(true)}
              className="sm:hidden p-1.5"
              title="Create Table (Ctrl+T)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9M3 14h6m-6 4h6" />
              </svg>
            </Button>



            {/* Mode Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1"
              title={`${isPreviewMode ? 'Edit' : 'Preview'} (Ctrl+Shift+P)`}
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              )}
            </Button>

            <Badge variant={status === 'saved' ? 'secondary' : status === 'pending' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0.5">
              {status === 'saved' ? 'Saved' : status === 'pending' ? 'Saving...' : 'Unsaved'}
            </Badge>



            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1.5">
                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onNoteUpdate(note!.id, { isPublic: !note?.isPublic })}>
                  {note?.isPublic ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {note?.isPublic ? 'Make Private' : 'Make Public'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                      try {
                        await onNoteDelete(note!.id);
                      } catch (error) {
                        // Error handled by parent component
                      }
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full scrollbar-minimal">
          <div className="w-full min-w-0 overflow-x-auto p-3 sm:p-6 pb-20 sm:pb-32">
            {isPreviewMode ? (
              /* Preview Mode */
              <div className="min-h-[400px] prose prose-slate max-w-none overflow-x-auto">
                {content ? (
                  renderMarkdown(content, true)
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No content to preview</p>
                    <p className="text-xs sm:text-sm">Start writing to see your content rendered</p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`# Start writing your note in Markdown...

🚀 **Click the Help button for advanced markdown features & shortcuts!**

## Quick Start:
• **Bold text** (Ctrl+B) and *italic text* (Ctrl+I)
• Create tables visually with the Table button (Ctrl+T)
• Add interactive todos: - [ ] Task to complete
• Insert math equations: $E = mc^2$ (Ctrl+M)
• Use callouts: > [!NOTE] Important info

💡 **Pro tip:** Press Ctrl+/ to open the help modal anytime!

Start typing to create amazing content! ✨`}
                  className="min-h-[400px] resize-none border-none shadow-none p-0 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-0 font-mono overflow-x-auto whitespace-nowrap"
                  style={{ height: 'auto' }}
                />

                {/* Simple Help Tip */}
                <div className="text-xs text-muted-foreground text-center opacity-60 pt-4 mt-8">
                  <p className="px-2">💡 Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-semibold">Ctrl+/</kbd> or tap the Help button for commands and shortcuts</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
