"use client";

import { ArrowUpRight, Plus } from "lucide-react";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username: string;
}

interface NotesWelcomeProps {
  currentUser: CurrentUser;
  onCreateNote: (noteData: Partial<any>) => void;
}

const templates = [
  {
    key: "blank",
    label: "Blank note",
    detail: "A clean page",
    data: { title: "Untitled", icon: "📝" },
  },
  {
    key: "meeting",
    label: "Meeting notes",
    detail: "Attendees, decisions, next steps",
    data: { title: "Meeting notes", icon: "🗒️" },
  },
  {
    key: "project",
    label: "Project plan",
    detail: "Scope, milestones, open questions",
    data: { title: "Project plan", icon: "🗂️" },
  },
  {
    key: "journal",
    label: "Daily journal",
    detail: "A short record of the day",
    data: { title: "Daily journal", icon: "📔" },
  },
];

export function NotesWelcome({ currentUser, onCreateNote }: NotesWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <p className="eyebrow mb-4">Notes · {currentUser.name || currentUser.username}</p>
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
          A place for the thinking
          <br />
          <em className="italic text-primary">between the tasks.</em>
        </h1>
        <p className="mt-5 max-w-[480px] text-sm leading-[1.8] text-muted-foreground">
          Write in markdown, keep it beside the work, and let autosave handle
          the rest. Start from a blank page or one of the outlines below.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onCreateNote(templates[0].data)}
            className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New note
          </button>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            Autosaved as you type
          </span>
        </div>

        <div className="mt-12 border-t border-border">
          <p className="eyebrow py-3">Start from</p>
          {templates.map((template) => (
            <button
              key={template.key}
              onClick={() => onCreateNote(template.data)}
              className="group flex w-full items-center justify-between gap-4 border-t border-border py-4 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center border border-border text-sm">
                  {template.data.icon}
                </span>
                <div>
                  <p className="text-[13px] font-medium">{template.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {template.detail}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
