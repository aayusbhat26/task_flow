'use client';

import { BarChart3, Brain, ClipboardList, HelpCircle, ListTodo, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SlashCommandId = 'poll' | 'task' | 'brief' | 'dsa' | 'help';

export interface SlashCommandDefinition {
  id: SlashCommandId;
  label: string;
  hint: string;
  Icon: LucideIcon;
}

const ALL_COMMANDS: SlashCommandDefinition[] = [
  { id: 'poll', label: '/poll', hint: 'Create a live poll', Icon: BarChart3 },
  { id: 'task', label: '/task', hint: 'Turn a message into a task', Icon: ListTodo },
  { id: 'brief', label: '/brief', hint: 'Open the channel brief', Icon: ClipboardList },
  { id: 'dsa', label: '/dsa', hint: 'Start a DSA co-working room', Icon: Brain },
  { id: 'help', label: '/help', hint: 'See available commands', Icon: HelpCircle },
];

export function getSlashCommands(available: SlashCommandId[]) {
  return ALL_COMMANDS.filter(command => available.includes(command.id));
}

interface SlashCommandMenuProps {
  commands: SlashCommandDefinition[];
  activeIndex: number;
  onSelect: (command: SlashCommandDefinition) => void;
  onHover: (index: number) => void;
}

export function SlashCommandMenu({ commands, activeIndex, onSelect, onHover }: SlashCommandMenuProps) {
  if (commands.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg" data-testid="slash-command-menu">
      <div className="border-b border-border px-3 py-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Commands</p>
      </div>
      <div className="p-1">
        {commands.map((command, index) => (
          <button
            key={command.id}
            type="button"
            data-command={command.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(command)}
            onMouseEnter={() => onHover(index)}
            className={cn(
              'flex w-full items-center gap-3 px-2.5 py-2 text-left transition-colors',
              activeIndex === index ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60'
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-background">
              <command.Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-foreground">{command.label}</span>
              <span className="block truncate text-[10px]">{command.hint}</span>
            </span>
            {activeIndex === index && (
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">Enter</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
