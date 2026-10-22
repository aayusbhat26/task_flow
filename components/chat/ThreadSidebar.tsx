'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Copy, Pencil, Trash2, Check } from 'lucide-react';
import { cn, getRandomColor } from '@/lib/utils';
import { useSocket } from '@/context/SocketProvider';
import { useToast } from '@/hooks/use-toast';
import { ChatInput } from './ChatInput';
import { ChatImage } from './ChatImage';
import { PollMessage } from './PollMessage';
import { TaskMessage } from './TaskMessage';
import type { ChatPoll } from '@/lib/chat-rich';

interface ThreadSidebarProps {
  parentMessage: any;
  workspaceId: string;
  groupId?: string;
  channelId?: string;
  currentUser: any;
  onClose: () => void;
}

export function ThreadSidebar({
  parentMessage,
  workspaceId,
  groupId,
  channelId,
  currentUser,
  onClose
}: ThreadSidebarProps) {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [parentPoll, setParentPoll] = useState<ChatPoll | null>(parentMessage.poll || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const roomId = channelId || groupId || workspaceId;

  useEffect(() => {
    setParentPoll(parentMessage.poll || null);
  }, [parentMessage.id, parentMessage.poll]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReplies = async () => {
      try {
        setIsLoading(true);
        const url = new URL('/api/chat/messages', window.location.origin);
        if (channelId) {
          url.searchParams.append('channelId', channelId);
          url.searchParams.append('workspaceId', workspaceId);
        } else if (groupId) url.searchParams.append('groupId', groupId);
        else url.searchParams.append('workspaceId', workspaceId);
        url.searchParams.append('threadId', parentMessage.id);

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setReplies(data);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch replies:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplies();
    return () => controller.abort();
  }, [parentMessage.id, workspaceId, groupId, channelId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (message.replyToId !== parentMessage.id) return;
      setReplies(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        if (message.tempId) {
          const hasTemp = prev.some(m => m.id === message.tempId);
          if (hasTemp) return prev.map(m => m.id === message.tempId ? message : m);
        }
        return [...prev, message];
      });
    };

    const handleReactionUpdated = (data: { messageId: string; emoji: string; user: any; status: string }) => {
      if (data.user.id === currentUser.id) return;
      setReplies(prev => prev.map(reply => {
        if (reply.id !== data.messageId) return reply;
        const currentReactions = reply.reactions || [];
        const hasReacted = currentReactions.some((r: any) => r.emoji === data.emoji && r.user.username === data.user.username);
        if (data.status === 'added' && !hasReacted) {
          return { ...reply, reactions: [...currentReactions, { id: `temp-${Date.now()}`, emoji: data.emoji, user: data.user }] };
        }
        if (data.status === 'removed' && hasReacted) {
          return { ...reply, reactions: currentReactions.filter((r: any) => !(r.emoji === data.emoji && r.user.username === data.user.username)) };
        }
        return reply;
      }));
    };

    const handleMessageEdited = (message: any) => {
      setReplies(prev => prev.map(reply => reply.id === message.id ? { ...reply, ...message } : reply));
    };

    const handleMessageDeleted = (messageId: string) => {
      setReplies(prev => prev.map(reply => reply.id === messageId
        ? { ...reply, isDeleted: true, content: 'This message was deleted.', reactions: [] }
        : reply));
    };

    const handlePollUpdated = (data: { messageId: string; counts: Record<string, number>; totalVotes: number; isClosed: boolean }) => {
      if (data.messageId === parentMessage.id) {
        setParentPoll(prev => prev ? {
          ...prev,
          options: prev.options.map(option => ({
            ...option,
            voteCount: data.counts[option.id] ?? option.voteCount,
          })),
          totalVotes: data.totalVotes,
          isClosed: data.isClosed,
        } : prev);
      }
      setReplies(prev => prev.map(reply => {
        if (reply.id !== data.messageId || !reply.poll) return reply;
        return {
          ...reply,
          poll: {
            ...reply.poll,
            options: reply.poll.options.map((option: any) => ({
              ...option,
              voteCount: data.counts[option.id] ?? option.voteCount,
            })),
            totalVotes: data.totalVotes,
            isClosed: data.isClosed,
          },
        };
      }));
    };

    const handleUserTyping = (data: { userId: string; username: string; isTyping: boolean; threadId?: string }) => {
      if (data.threadId !== parentMessage.id || data.userId === currentUser.id) return;

      const existingTimeout = typingTimeoutsRef.current.get(data.userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.some(u => u.userId === data.userId) ? prev : [...prev, { userId: data.userId, username: data.username }];
        }
        return prev.filter(u => u.userId !== data.userId);
      });

      if (data.isTyping) {
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
          typingTimeoutsRef.current.delete(data.userId);
        }, 4000);
        typingTimeoutsRef.current.set(data.userId, timeout);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('user-typing', handleUserTyping);
    socket.on('poll-updated', handlePollUpdated);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('user-typing', handleUserTyping);
      socket.off('poll-updated', handlePollUpdated);
    };
  }, [socket, parentMessage.id, currentUser.id]);

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [replies]);

  const handleOptimisticReply = (message: any) => {
    setReplies(prev => [...prev, message]);
  };

  const handleReplyConfirmed = (tempId: string, realMessage: any) => {
    setReplies(prev => {
      if (prev.some(m => m.id === realMessage.id)) {
        return prev.filter(m => m.id !== tempId);
      }
      return prev.map(m => m.id === tempId ? realMessage : m);
    });
  };

  const handleReplyFailed = (tempId: string) => {
    setReplies(prev => prev.filter(m => m.id !== tempId));
  };

  const handleExternalMessage = (message: any) => {
    if (message.replyToId !== parentMessage.id) return;
    setReplies(prev => prev.some(item => item.id === message.id) ? prev : [...prev, message]);
  };

  const handlePollVote = async (messageId: string, pollId: string, optionId: string) => {
    const reply = replies.find(item => item.id === messageId);
    const previousPoll: ChatPoll | null = reply?.poll || (messageId === parentMessage.id ? parentPoll : null);
    if (!previousPoll || previousPoll.isClosed) return;

    let totalVotes = previousPoll.totalVotes;
    const options = previousPoll.options.map(option => {
      let voteCount = option.voteCount;
      let myVote = option.myVote;

      if (previousPoll.allowMultiple) {
        if (option.id === optionId) {
          voteCount += myVote ? -1 : 1;
          totalVotes += myVote ? -1 : 1;
          myVote = !myVote;
        }
      } else if (option.id === optionId) {
        voteCount += myVote ? -1 : 1;
        totalVotes += myVote ? -1 : 1;
        myVote = !myVote;
      } else if (myVote) {
        voteCount -= 1;
        totalVotes -= 1;
        myVote = false;
      }

      return { ...option, voteCount: Math.max(0, voteCount), myVote };
    });

    const optimisticPoll: ChatPoll = {
      ...previousPoll,
      options,
      totalVotes: Math.max(0, totalVotes),
    };

    const applyPoll = (poll: ChatPoll) => {
      if (messageId === parentMessage.id) {
        setParentPoll(poll);
      } else {
        setReplies(prev => prev.map(item => item.id === messageId ? { ...item, poll } : item));
      }
    };

    applyPoll(optimisticPoll);

    try {
      const response = await fetch(`/api/chat/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.poll) {
        throw new Error(data?.error || 'Vote failed');
      }

      applyPoll(data.poll);
      const counts: Record<string, number> = {};
      for (const option of data.poll.options) {
        counts[option.id] = option.voteCount;
      }
      socket?.emit('poll-updated', {
        workspaceId: roomId,
        messageId,
        counts,
        totalVotes: data.poll.totalVotes,
        isClosed: data.poll.isClosed,
      });
    } catch (error) {
      applyPoll(previousPoll);
      toast({
        title: 'Could not save your vote',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const toggleReaction = async (replyId: string, emoji: string) => {
    const reply = replies.find(m => m.id === replyId);
    if (!reply) return;

    const currentReactions = reply.reactions || [];
    const hasReacted = currentReactions.some((r: any) => r.emoji === emoji && r.user.username === currentUser.username);
    const status = hasReacted ? 'removed' : 'added';

    socket?.emit('reaction-updated', {
      workspaceId: roomId,
      messageId: replyId,
      emoji,
      user: currentUser,
      status,
    });

    setReplies(prev => prev.map(m => {
      if (m.id !== replyId) return m;
      const reactions = m.reactions || [];
      if (hasReacted) {
        return { ...m, reactions: reactions.filter((r: any) => !(r.emoji === emoji && r.user.username === currentUser.username)) };
      }
      return {
        ...m,
        reactions: [...reactions, { id: `temp-${Date.now()}`, emoji, user: { name: currentUser.name, username: currentUser.username } }],
      };
    }));

    try {
      await fetch('/api/chat/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: replyId, emoji }),
      });
    } catch (error) {
      console.error('Failed to update reaction', error);
    }
  };

  const copyReply = async (content?: string | null) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Message copied' });
    } catch {
      toast({ title: 'Could not copy message', variant: 'destructive' });
    }
  };

  const saveEdit = async (replyId: string) => {
    const content = editContent.trim();
    if (!content) return;

    let editedReply: any = null;
    setReplies(prev => prev.map(reply => {
      if (reply.id !== replyId) return reply;
      editedReply = { ...reply, content, isEdited: true };
      return editedReply;
    }));
    setEditingId(null);

    if (editedReply) {
      socket?.emit('message-edited', { workspaceId: roomId, message: editedReply });
    }

    try {
      await fetch(`/api/chat/messages/${replyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error('Failed to edit reply', error);
    }
  };

  const deleteReply = async (replyId: string) => {
    setReplies(prev => prev.map(reply => reply.id === replyId
      ? { ...reply, isDeleted: true, content: 'This message was deleted.', reactions: [] }
      : reply));
    socket?.emit('message-deleted', { workspaceId: roomId, messageId: replyId });

    try {
      await fetch(`/api/chat/messages/${replyId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete reply', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-semibold px-1 rounded mx-0.5 text-primary bg-primary/10">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background" data-testid="thread-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Thread</h3>
          <p className="text-[11px] text-muted-foreground">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close thread">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Parent Message */}
          <div className="mb-5 border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={parentMessage.author?.image || undefined} />
                <AvatarFallback className={cn("text-white font-semibold", getRandomColor(parentMessage.author?.id))}>
                  {parentMessage.author?.name?.charAt(0) || parentMessage.author?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold">{parentMessage.author?.name || parentMessage.author?.username}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(parentMessage.createdAt)}</span>
                </div>
                {!parentMessage.isDeleted && parentMessage.type === 'POLL' && parentPoll ? (
                  <div className="mt-2">
                    <PollMessage poll={parentPoll} onVote={(pollId, optionId) => handlePollVote(parentMessage.id, pollId, optionId)} />
                  </div>
                ) : !parentMessage.isDeleted && parentMessage.type === 'TASK' && parentMessage.task ? (
                  <div className="mt-2">
                    <TaskMessage task={parentMessage.task} workspaceId={workspaceId} />
                  </div>
                ) : (
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {renderMessageContent(parentMessage.content)}
                  </div>
                )}
                {parentMessage.attachments?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {parentMessage.attachments.map((file: any, idx: number) => {
                      const isImage = (file.mimeType || file.type || '').startsWith('image/');
                      if (isImage) {
                        return (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-fit max-w-full rounded border border-border">
                            <ChatImage src={file.url} alt={file.name || 'attachment'} />
                          </a>
                        );
                      }
                      return (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                          📎 {file.name || 'Attachment'}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Replies */}
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map(index => (
                <div key={index} className="flex animate-pulse items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-24 rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No replies yet. Start the thread below.</p>
          ) : (
            <div className="space-y-5">
              {replies.map(reply => {
                const isOwnReply = reply.author?.id === currentUser.id;
                const isRichReply = !reply.isDeleted && (reply.type === 'POLL' || reply.type === 'TASK');
                const reactionGroups = Array.from(new Set((reply.reactions || []).map((r: any) => r.emoji))) as string[];

                return (
                  <div key={reply.id} data-thread-reply-id={reply.id} className={cn("group/reply flex items-start gap-3", reply.isOptimistic && "opacity-70")}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={reply.author?.image || undefined} />
                      <AvatarFallback className={cn("text-white font-semibold", getRandomColor(reply.author?.id))}>
                        {reply.author?.name?.charAt(0) || reply.author?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold">{reply.author?.name || reply.author?.username}</span>
                        {isOwnReply && <span className="text-[10px] text-primary">you</span>}
                        <span className="text-xs text-muted-foreground">{formatTime(reply.createdAt)}</span>
                      </div>

                      {!reply.isDeleted && reply.type === 'POLL' && reply.poll && (
                        <div className="mt-1">
                          <PollMessage poll={reply.poll} onVote={(pollId, optionId) => handlePollVote(reply.id, pollId, optionId)} />
                        </div>
                      )}
                      {!reply.isDeleted && reply.type === 'TASK' && reply.task && (
                        <div className="mt-1">
                          <TaskMessage task={reply.task} workspaceId={workspaceId} />
                        </div>
                      )}

                      {!isRichReply && (editingId === reply.id ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editContent}
                            onChange={(event) => setEditContent(event.target.value)}
                            rows={3}
                            className="w-full resize-none rounded border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                saveEdit(reply.id);
                              } else if (event.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                          />
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingId(null)} className="rounded bg-muted/50 p-1 text-muted-foreground hover:bg-muted" aria-label="Cancel edit"><X className="h-4 w-4" /></button>
                            <button onClick={() => saveEdit(reply.id)} className="rounded bg-primary/80 p-1 text-primary-foreground hover:bg-primary" aria-label="Save edit"><Check className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
                          {renderMessageContent(reply.content)}
                          {reply.isEdited && !reply.isDeleted && <span className="ml-2 text-[10px] text-muted-foreground">(edited)</span>}
                        </div>
                      ))}

                      {reply.attachments?.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {reply.attachments.map((file: any, idx: number) => {
                            const isImage = (file.mimeType || file.type || '').startsWith('image/');
                            if (isImage) {
                              return (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-fit max-w-full rounded border border-border">
                                  <ChatImage src={file.url} alt={file.name || 'attachment'} />
                                </a>
                              );
                            }
                            return (
                              <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                📎 {file.name || 'Attachment'}
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {reactionGroups.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {reactionGroups.map(emoji => {
                            const reactions = (reply.reactions || []).filter((r: any) => r.emoji === emoji);
                            const hasReacted = reactions.some((r: any) => r.user.username === currentUser.username);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(reply.id, emoji)}
                                className={cn(
                                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                                  hasReacted ? "border-primary/30 bg-primary/20 text-primary" : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                <span>{emoji}</span>
                                <span>{reactions.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {!reply.isDeleted && !reply.isOptimistic && (
                        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover/reply:opacity-100 focus-within:opacity-100">
                          <button onClick={() => toggleReaction(reply.id, '👍')} className="rounded p-1 text-sm hover:bg-muted" title="React with 👍" aria-label="React with thumbs up">👍</button>
                          <button onClick={() => toggleReaction(reply.id, '❤️')} className="rounded p-1 text-sm hover:bg-muted" title="React with ❤️" aria-label="React with heart">❤️</button>
                          <button onClick={() => toggleReaction(reply.id, '😂')} className="rounded p-1 text-sm hover:bg-muted" title="React with 😂" aria-label="React with laugh">😂</button>
                          {reply.content && (
                            <button onClick={() => copyReply(reply.content)} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Copy text" aria-label="Copy message text"><Copy className="h-3.5 w-3.5" /></button>
                          )}
                          {isOwnReply && !isRichReply && (
                            <button onClick={() => { setEditingId(reply.id); setEditContent(reply.content || ''); }} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Edit reply" aria-label="Edit reply"><Pencil className="h-3.5 w-3.5" /></button>
                          )}
                          {isOwnReply && (
                            <button onClick={() => deleteReply(reply.id)} className="rounded p-1 text-red-500 hover:bg-muted" title="Delete reply" aria-label="Delete reply"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {typingUsers.length > 0 && (
        <div className="flex items-center gap-1 border-t border-border px-4 py-1.5 text-[11px] italic text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="ml-1">
            {typingUsers.length === 1 ? `${typingUsers[0].username} is typing...` : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="mt-auto">
        <ChatInput
          workspaceId={workspaceId}
          groupId={groupId}
          channelId={channelId}
          threadId={parentMessage.id}
          currentUser={currentUser}
          replyingTo={parentMessage}
          showReplyingTo={false}
          onOptimisticMessage={handleOptimisticReply}
          onMessageConfirmed={handleReplyConfirmed}
          onMessageFailed={handleReplyFailed}
          onExternalMessage={handleExternalMessage}
        />
      </div>
    </div>
  );
}
