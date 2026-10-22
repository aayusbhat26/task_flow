'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Send,
  Smile,
  Paperclip,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketProvider';
import { useUploadThing } from '@/lib/uploadthing';
import { useTheme } from 'next-themes';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SlashCommandMenu,
  getSlashCommands,
  type SlashCommandDefinition,
  type SlashCommandId,
} from './SlashCommandMenu';
import { PollComposer } from './PollComposer';
import { TaskComposer } from './TaskComposer';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username: string;
}

interface Message {
  id: string;
  content: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  attachments?: Array<{ url: string; name?: string; type?: string; size?: number; key?: string }>;
  replyTo?: {
    id: string;
    content: string | null;
    author: { name: string; username: string; };
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    user: { name: string; username: string; };
  }>;
  isOptimistic?: boolean;
  readByIds?: string[];
}

interface ChatInputProps {
  workspaceId: string;
  groupId?: string;
  channelId?: string;
  threadId?: string;
  currentUser: CurrentUser;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onOptimisticMessage?: (message: Message) => void;
  onMessageConfirmed?: (tempId: string, realMessage: Message) => void;
  onMessageFailed?: (tempId: string) => void;
  onExternalMessage?: (message: any) => void;
  onOpenBrief?: () => void;
  onOpenDsaRoom?: () => void;
  showReplyingTo?: boolean;
}

export function ChatInput({ workspaceId, groupId, channelId, threadId, currentUser, replyingTo, onCancelReply, onOptimisticMessage, onMessageConfirmed, onMessageFailed, onExternalMessage, onOpenBrief, onOpenDsaRoom, showReplyingTo = true }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { socket } = useSocket();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const roomId = channelId || groupId || workspaceId;

  const [workspaceUsers, setWorkspaceUsers] = useState<CurrentUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandIndex, setCommandIndex] = useState(0);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollSeed, setPollSeed] = useState('');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskSeed, setTaskSeed] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const availableCommandIds = useMemo(() => {
    const ids: SlashCommandId[] = ['poll', 'task', 'help'];
    if (onOpenBrief) ids.push('brief');
    if (onOpenDsaRoom) ids.push('dsa');
    return ids;
  }, [onOpenBrief, onOpenDsaRoom]);

  const allCommands = useMemo(
    () => getSlashCommands(availableCommandIds),
    [availableCommandIds]
  );

  const filteredCommands = useMemo(() => {
    const query = commandQuery.toLowerCase();
    if (!query) return allCommands;
    return allCommands.filter(command =>
      command.label.slice(1).startsWith(query) || command.hint.toLowerCase().includes(query)
    );
  }, [allCommands, commandQuery]);

  useEffect(() => {
    setCommandIndex(0);
  }, [commandQuery]);

  const clearInput = () => {
    setMessage('');
    setShowCommands(false);
    setCommandQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const stopTyping = () => {
    if (socket) {
      socket.emit('typing-stop', { workspaceId: roomId, threadId });
    }
  };

  const executeCommand = (command: SlashCommandDefinition, argument = '') => {
    stopTyping();
    switch (command.id) {
      case 'poll':
        setPollSeed(argument);
        setPollOpen(true);
        clearInput();
        break;
      case 'task':
        setTaskSeed(argument);
        setTaskOpen(true);
        clearInput();
        break;
      case 'brief':
        if (onOpenBrief) onOpenBrief();
        clearInput();
        break;
      case 'dsa':
        if (onOpenDsaRoom) onOpenDsaRoom();
        clearInput();
        break;
      case 'help':
        setHelpOpen(true);
        clearInput();
        break;
    }
  };

  const runSlashCommand = (text: string) => {
    if (text === '/') {
      clearInput();
      return true;
    }

    const match = text.match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
    if (!match) return false;

    const id = match[1].toLowerCase() as SlashCommandId;
    const argument = (match[2] || '').trim();

    if (!availableCommandIds.includes(id)) {
      toast({
        title: `/${id} is not available here`,
        description: 'Try /poll or /task in this conversation.',
      });
      return true;
    }

    const command = allCommands.find(item => item.id === id);
    if (!command) {
      toast({
        title: 'Unknown command',
        description: 'Type / to see the available commands.',
      });
      return true;
    }

    executeCommand(command, argument);
    return true;
  };

  const handleExternalCreated = (created: any) => {
    onExternalMessage?.(created);
    if (socket) {
      socket.emit('message-created', {
        workspaceId: roomId,
        message: created,
      });
    }
    onCancelReply?.();
  };

  useEffect(() => {
    if (workspaceId) {
      fetch(`/api/workspace/users/${workspaceId}?_t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setWorkspaceUsers(data);
          }
        })
        .catch(console.error);
    }
  }, [workspaceId]);

  const filteredUsers = workspaceUsers.filter(u => 
    u.username.toLowerCase().includes(mentionQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  const { startUpload, isUploading } = useUploadThing("chatFileUpload", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        setAttachments(prev => [...prev, ...res]);
      }
    },
    onUploadError: (error: Error) => {
      console.error(error);
      alert("Error uploading file: " + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startUpload(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // reset input
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket && roomId) {
        socket.emit('typing-stop', { workspaceId: roomId, threadId });
      }
    };
  }, [socket, roomId, threadId]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    // Handle typing indicators
    if (socket && roomId) {
      socket.emit('typing-start', { workspaceId: roomId, threadId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', { workspaceId: roomId, threadId });
      }, 2000);
    }

    const commandMatch = val.match(/^\/([a-z]*)$/i);
    if (commandMatch) {
      setShowCommands(true);
      setCommandQuery(commandMatch[1]);
      setShowMentions(false);
    } else {
      setShowCommands(false);
      setCommandQuery('');
    }

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (username: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      // Find the actual start index of the match to preserve leading spaces
      const matchIndex = match.index === 0 ? 0 : match.index! + 1; // +1 if there was a leading space
      
      const newTextBefore = textBeforeCursor.slice(0, matchIndex) + `@${username} `;
      setMessage(newTextBefore + textAfterCursor);
      setShowMentions(false);
      setMentionQuery('');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = newTextBefore.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (isSending) return;
    if (trimmedMessage.startsWith('/') && runSlashCommand(trimmedMessage)) return;
    if ((!trimmedMessage && attachments.length === 0) || (!workspaceId && !groupId && !channelId)) return;

    const tempId = `temp-${Date.now()}`;
    const currentAttachments = [...attachments];
    const optimisticMessage: Message = {
      id: tempId,
      content: trimmedMessage || null,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        image: currentUser.image,
      },
      attachments: currentAttachments,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        author: { name: replyingTo.author.name, username: replyingTo.author.username }
      } : undefined,
      isOptimistic: true,
    };

    // Optimistic update
    onOptimisticMessage?.(optimisticMessage);
    setMessage(''); // Clear input immediately
    setAttachments([]); // Clear attachments
    const currentReplyId = replyingTo?.id;
    onCancelReply?.(); // Clear reply state

    // Stop typing indicator
    if (socket) {
      socket.emit('typing-stop', { workspaceId: roomId, threadId });
    }

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      setIsSending(true);

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: trimmedMessage,
          workspaceId,
          groupId,
          channelId,
          attachments: currentAttachments,
          replyToId: currentReplyId,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();

        // Confirm message
        onMessageConfirmed?.(tempId, newMessage);

        // Emit to socket for real-time updates (broadcast the created message)
        if (socket) {
          socket.emit('message-created', {
            workspaceId: roomId,
            message: { ...newMessage, tempId },
          });
        }
      } else {
        const error = await response.json().catch(() => null);
        onMessageFailed?.(tempId);
        setMessage(prev => prev || trimmedMessage);
        setAttachments(prev => prev.length ? prev : currentAttachments);
        toast({
          title: 'Message not sent',
          description: error?.error || 'Check your connection and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onMessageFailed?.(tempId);
      setMessage(prev => prev || trimmedMessage);
      setAttachments(prev => prev.length ? prev : currentAttachments);
      toast({
        title: 'Message not sent',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands && filteredCommands.length > 0) {
      const activeIndex = Math.min(commandIndex, filteredCommands.length - 1);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommandIndex((activeIndex + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandIndex((activeIndex - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        executeCommand(filteredCommands[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
        return;
      }
    }

    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex].username);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = (message.trim().length > 0 || attachments.length > 0) && !isUploading && !isSending;

  return (
    <div className="border-t border-border bg-background flex-shrink-0">
      {replyingTo && showReplyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
          <div className="flex flex-col text-sm truncate pr-4">
            <span className="font-semibold text-foreground">Replying to {replyingTo.author.name || replyingTo.author.username}</span>
            <span className="text-muted-foreground truncate">{replyingTo.content || 'Attachment'}</span>
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="px-4 py-3">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="relative group flex items-center bg-muted rounded p-1 pr-2">
                {file.url && file.type?.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded mr-2" />
                ) : (
                  <div className="w-10 h-10 bg-muted-foreground/20 rounded flex items-center justify-center mr-2">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end space-x-3">


          {/* Message input */}
          <div className="flex-1 relative">
            {showCommands && filteredCommands.length > 0 && (
              <SlashCommandMenu
                commands={filteredCommands}
                activeIndex={Math.min(commandIndex, filteredCommands.length - 1)}
                onSelect={executeCommand}
                onHover={setCommandIndex}
              />
            )}

            {/* Mention Dropdown */}
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-popover text-popover-foreground rounded-md border border-border shadow-md z-50">
                {filteredUsers.map((user, i) => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user.username)}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center space-x-2 text-sm hover:bg-accent hover:text-accent-foreground",
                      mentionIndex === i ? "bg-accent text-accent-foreground" : ""
                    )}
                  >
                    {user.image ? (
                      <img src={user.image} alt={user.username} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{user.name || user.username}</span>
                      <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className={cn(
                "min-h-[40px] max-h-[120px] resize-none rounded-sm border-border bg-card text-foreground placeholder-muted-foreground focus:border-foreground/40 focus:ring-1 focus:ring-ring",
                "pr-20 py-2 pl-3 text-sm" // Space for buttons
              )}
            />

            {/* Input actions */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 w-7 p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Smile className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="p-0 border-none bg-transparent shadow-none w-auto">
                  <Picker 
                    data={data} 
                    onEmojiSelect={(emoji: any) => {
                      const cursorPosition = textareaRef.current?.selectionStart || message.length;
                      const textBeforeCursor = message.slice(0, cursorPosition);
                      const textAfterCursor = message.slice(cursorPosition);
                      setMessage(textBeforeCursor + emoji.native + textAfterCursor);
                      // Set focus back to textarea
                      setTimeout(() => {
                        textareaRef.current?.focus();
                      }, 0);
                    }}
                    theme={resolvedTheme === "dark" ? "dark" : "light"}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={sendMessage}
            disabled={!canSend}
            size="sm"
            className={cn(
              "h-9 rounded-sm px-3 py-2 font-medium transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-secondary text-muted-foreground"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Character count or other info */}
        {message.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="hidden text-muted-foreground sm:block">
              <span>Press Enter to send • Shift+Enter for new line</span>
            </div>
            <span className={cn(
              "font-medium ml-auto",
              message.length > 1800 ? "text-red-500" : "text-gray-500"
            )}>
              {message.length}/2000
            </span>
          </div>
        )}
      </div>

      <PollComposer
        open={pollOpen}
        onOpenChange={setPollOpen}
        workspaceId={workspaceId}
        groupId={groupId}
        channelId={channelId}
        replyToId={replyingTo?.id}
        initialQuestion={pollSeed}
        onCreated={handleExternalCreated}
      />

      <TaskComposer
        open={taskOpen}
        onOpenChange={setTaskOpen}
        workspaceId={workspaceId}
        groupId={groupId}
        channelId={channelId}
        replyToId={replyingTo?.id}
        initialTitle={taskSeed}
        users={workspaceUsers}
        onCreated={handleExternalCreated}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat commands</DialogTitle>
            <DialogDescription>
              Type / in the message box to open this menu anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border border border-border">
            {allCommands.map(command => (
              <button
                key={command.id}
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  executeCommand(command);
                }}
                className="flex w-full items-center gap-3 bg-card px-3 py-2.5 text-left transition-colors hover:bg-secondary"
              >
                <command.Icon className="h-4 w-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium">{command.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{command.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
