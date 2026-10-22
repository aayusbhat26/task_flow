'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Hash,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Menu,
  ChevronRight,
  ArrowLeft,
  Info,
  Link2,
  ExternalLink,
  ClipboardList,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketProvider';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatSearch } from './ChatSearch';
import { ThreadSidebar } from './ThreadSidebar';
import { ChannelBrief } from './ChannelBrief';
import { DsaRoomPanel } from './DsaRoomPanel';
import { DsaRoomBanner } from './DsaRoomBanner';
import type { ChatPoll, ChatTaskCard } from '@/lib/chat-rich';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  image?: string | null;
  color: string;
  _count: {
    subscribers: number;
  };
  subscribers: Array<{
    user: {
      id: string;
      name: string;
      username: string;
      image?: string | null;
    };
  }>;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username: string;
  plan?: string;
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
  isEdited?: boolean;
  isDeleted?: boolean;
  isOptimistic?: boolean;
  readByIds?: string[];
  replyToId?: string | null;
  type?: 'TEXT' | 'POLL' | 'TASK' | 'SYSTEM';
  poll?: ChatPoll | null;
  task?: ChatTaskCard | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
  _count?: { replies: number };
  replies?: Array<{
    id: string;
    createdAt?: string;
    author: {
      id: string;
      name: string;
      username: string;
      image?: string | null;
    };
  }>;
}

interface ChatAreaProps {
  workspace: Workspace;
  currentUser: CurrentUser;
  groupId?: string;
  channelId?: string;
  channelName?: string;
  onOpenMobileMenu?: () => void;
}

const colorMap = {
  BLUE: 'bg-blue-500',
  GREEN: 'bg-green-500',
  YELLOW: 'bg-yellow-500',
  RED: 'bg-red-500',
  PURPLE: 'bg-purple-500',
  PINK: 'bg-pink-500',
  INDIGO: 'bg-indigo-500',
  GRAY: 'bg-gray-500',
};

export function ChatArea({ workspace, currentUser, groupId, channelId, channelName, onOpenMobileMenu }: ChatAreaProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [dsaOpen, setDsaOpen] = useState(false);
  const [dsaRoom, setDsaRoom] = useState<any | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);

  const messagesRef = useRef<Message[]>([]);
  const activeThreadRef = useRef<Message | null>(null);
  const countedReplyIds = useRef<Set<string>>(new Set());
  const replyParentMap = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const openThreadPanel = useCallback((message: Message) => {
    setActiveThread(message);
    setBriefOpen(false);
    setDsaOpen(false);
  }, []);

  const openBriefPanel = useCallback(() => {
    setBriefOpen(true);
    setDsaOpen(false);
    setActiveThread(null);
  }, []);

  const openDsaPanel = useCallback(() => {
    setDsaOpen(true);
    setBriefOpen(false);
    setActiveThread(null);
  }, []);

  const refreshDsaRoom = useCallback(async () => {
    if (!channelId) {
      setDsaRoom(null);
      return;
    }
    try {
      const response = await fetch(
        `/api/dsa/rooms?channelId=${encodeURIComponent(channelId)}&workspaceId=${encodeURIComponent(workspace.id)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDsaRoom(data.active || null);
      }
    } catch {
      // The room banner is supplementary; keep chat usable if it fails.
    }
  }, [channelId, workspace.id]);

  useEffect(() => {
    refreshDsaRoom();
  }, [refreshDsaRoom]);

  useEffect(() => {
    if (!socket) return;
    const handleDsaRoomChanged = (data: { channelId: string }) => {
      if (data.channelId === channelId) refreshDsaRoom();
    };
    socket.on('dsa-room-changed', handleDsaRoomChanged);
    return () => {
      socket.off('dsa-room-changed', handleDsaRoomChanged);
    };
  }, [socket, channelId, refreshDsaRoom]);

  useEffect(() => {
    setActiveThread(null);
    setBriefOpen(false);
    setDsaOpen(false);
  }, [workspace.id, groupId, channelId]);

  // Use refs to store socket functions to prevent infinite re-renders
  const joinWorkspaceRef = useRef(joinWorkspace);
  const leaveWorkspaceRef = useRef(leaveWorkspace);

  // Update refs when functions change
  useEffect(() => {
    joinWorkspaceRef.current = joinWorkspace;
  }, [joinWorkspace]);

  useEffect(() => {
    leaveWorkspaceRef.current = leaveWorkspace;
  }, [leaveWorkspace]);

  // Join workspace when component mounts, workspace changes, or socket reconnects
  useEffect(() => {
    const roomId = channelId || groupId || workspace.id;
    setOnlineUsers([]);
    if (roomId && isConnected) {
      console.log('🔗 ChatArea: Joining room:', roomId);
      joinWorkspaceRef.current(roomId);
      socket?.emit('presence-request', { workspaceId: roomId });
    }

    return () => {
      if (roomId && isConnected) {
        console.log('🔗 ChatArea: Leaving room:', roomId);
        leaveWorkspaceRef.current(roomId);
      }
    };
  }, [workspace.id, groupId, channelId, isConnected, socket]); // Depend on isConnected to rejoin on reconnect

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const url = channelId 
          ? `/api/chat/messages?channelId=${channelId}&workspaceId=${workspace.id}`
          : groupId
            ? `/api/chat/messages?groupId=${groupId}`
            : `/api/chat/messages?workspaceId=${workspace.id}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspace.id || groupId || channelId) {
      loadMessages();
    }
  }, [workspace.id, groupId, channelId]);

  // Keep the parent message's thread count and participant preview in sync
  // without reloading the conversation.
  const registerReply = useCallback((reply: Message) => {
    if (!reply.replyToId || reply.id.startsWith('temp-')) return;
    if (countedReplyIds.current.has(reply.id)) return;
    countedReplyIds.current.add(reply.id);
    replyParentMap.current.set(reply.id, reply.replyToId);

    const parentSnapshot = messagesRef.current.find(m => m.id === reply.replyToId);
    const previewEntry = {
      id: reply.id,
      createdAt: reply.createdAt,
      author: reply.author,
    };
    const mergePreview = (existing?: Message['replies']) =>
      [previewEntry, ...(existing || []).filter(r => r.author.id !== reply.author.id)].slice(0, 3);

    setMessages(prev => prev.map(m => m.id === reply.replyToId ? {
      ...m,
      _count: { replies: (m._count?.replies ?? 0) + 1 },
      replies: mergePreview(m.replies),
    } : m));

    setActiveThread(prev => prev && prev.id === reply.replyToId ? {
      ...prev,
      _count: { replies: (prev._count?.replies ?? 0) + 1 },
      replies: mergePreview(prev.replies),
    } : prev);

    const isOwnMessage = parentSnapshot?.author.id === currentUser.id;
    if (
      isOwnMessage &&
      reply.author.id !== currentUser.id &&
      activeThreadRef.current?.id !== reply.replyToId
    ) {
      const updatedParent = parentSnapshot ? {
        ...parentSnapshot,
        _count: { replies: (parentSnapshot._count?.replies ?? 0) + 1 },
        replies: mergePreview(parentSnapshot.replies),
      } : null;

      toast({
        title: `${reply.author.name || reply.author.username} replied to you`,
        description: reply.content?.slice(0, 140) || 'Sent an attachment',
        action: updatedParent ? (
          <ToastAction altText="View thread" onClick={() => openThreadPanel(updatedParent)}>
            View thread
          </ToastAction>
        ) : undefined,
      });
    }
  }, [currentUser.id, toast, openThreadPanel]);

  const updateMessagePoll = useCallback((messageId: string, poll: ChatPoll) => {
    setMessages(prev => prev.map(message => message.id === messageId ? { ...message, poll } : message));
    setActiveThread(prev => prev && prev.id === messageId ? { ...prev, poll } : prev);
  }, []);

  const updateMessagePinned = useCallback((messageId: string, isPinned: boolean, pinnedAt: string | null) => {
    setMessages(prev => prev.map(message => message.id === messageId ? { ...message, isPinned, pinnedAt } : message));
    setActiveThread(prev => prev && prev.id === messageId ? { ...prev, isPinned, pinnedAt } : prev);
  }, []);

  const handlePollVote = async (messageId: string, pollId: string, optionId: string) => {
    const message = messagesRef.current.find(item => item.id === messageId);
    if (!message?.poll || message.poll.isClosed) return;

    const previousPoll = message.poll;
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

    updateMessagePoll(messageId, {
      ...previousPoll,
      options,
      totalVotes: Math.max(0, totalVotes),
      isClosed: previousPoll.isClosed,
    });

    try {
      const response = await fetch(`/api/chat/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.poll) {
        throw new Error(data?.error || "Vote failed");
      }

      updateMessagePoll(messageId, data.poll);
      const counts: Record<string, number> = {};
      for (const option of data.poll.options) {
        counts[option.id] = option.voteCount;
      }
      socket?.emit("poll-updated", {
        workspaceId: channelId || groupId || workspace.id,
        messageId,
        counts,
        totalVotes: data.poll.totalVotes,
        isClosed: data.poll.isClosed,
      });
    } catch (error) {
      updateMessagePoll(messageId, previousPoll);
      toast({
        title: "Could not save your vote",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handlePinMessage = async (message: Message) => {
    const nextPinned = !message.isPinned;
    updateMessagePinned(message.id, nextPinned, nextPinned ? new Date().toISOString() : null);

    try {
      const response = await fetch(`/api/chat/messages/${message.id}/pin`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Could not update pin");
      }

      updateMessagePinned(message.id, data.isPinned, data.pinnedAt);
      socket?.emit("message-pinned", {
        workspaceId: channelId || groupId || workspace.id,
        messageId: message.id,
        isPinned: data.isPinned,
        pinnedAt: data.pinnedAt,
      });

      toast({
        title: data.isPinned ? "Pinned to the channel brief" : "Decision unpinned",
        description: data.isPinned ? "It now appears under Pinned decisions." : undefined,
      });
    } catch (error) {
      updateMessagePinned(message.id, Boolean(message.isPinned), message.pinnedAt ?? null);
      toast({
        title: "Could not update the pin",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleExternalMessage = useCallback((message: Message) => {
    if (message.replyToId) return;
    setMessages(prev => prev.some(item => item.id === message.id) ? prev : [...prev, message]);
  }, []);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 ChatArea socket listener registered for current user:', currentUser.username, 'in room:', groupId || workspace.id);

    const handleNewMessage = (message: Message & { tempId?: string }) => {
      if (message.replyToId) {
        registerReply(message);
        return;
      }

      console.log('📩 ChatArea received new-message:', message);
      setMessages(prev => {
        // If this real message is replacing an optimistic broadcast
        if (message.tempId) {
            const hasTemp = prev.some(m => m.id === message.tempId);
            if (hasTemp) {
                return prev.map(m => m.id === message.tempId ? message : m);
            }
        }
        if (prev.some(m => m.id === message.id)) {
            return prev;
        }
        return [...prev, message];
      });
    };

    const handleReactionUpdated = (data: { messageId: string; emoji: string; user: { id: string; name: string; username: string }; status: string }) => {
      console.log('📩 ChatArea received reaction-updated:', data, 'current user ID:', currentUser.id);
      if (data.user.id === currentUser.id) {
        console.log('📩 ChatArea: reaction-updated ignored (own reaction broadcast)');
        return; // Ignore our own broadcast
      }

      setMessages(prev => prev.map(m => {
        if (m.id !== data.messageId) return m;

        const currentReactions = m.reactions || [];
        const hasReacted = currentReactions.some(r => r.emoji === data.emoji && r.user.username === data.user.username);

        if (data.status === 'added' && !hasReacted) {
          console.log(`📩 ChatArea: Adding reaction ${data.emoji} by ${data.user.username} to message ${data.messageId}`);
          return {
            ...m,
            reactions: [...currentReactions, { id: `temp-${Date.now()}`, emoji: data.emoji, user: data.user }]
          };
        } else if (data.status === 'removed' && hasReacted) {
          console.log(`📩 ChatArea: Removing reaction ${data.emoji} by ${data.user.username} from message ${data.messageId}`);
          return {
            ...m,
            reactions: currentReactions.filter(r => !(r.emoji === data.emoji && r.user.username === data.user.username))
          };
        }
        return m;
      }));
    };

    const handleUserTyping = (data: { userId: string; username: string; isTyping: boolean; threadId?: string }) => {
      if (data.threadId) return; // Thread typing is shown inside the thread panel
      if (data.userId === currentUser.id) return; // Ignore our own typing indicator

      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.some(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        } else {
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    };

    const handlePresenceList = (users: Array<{ userId: string; username: string }>) => {
      setOnlineUsers(Array.from(new Set(users.map(user => user.userId))));
    };

    const handleMessageEdited = (editedMessage: Message) => {
      console.log('📩 ChatArea received message-edited:', editedMessage);
      setMessages(prev => prev.map(m => m.id === editedMessage.id ? editedMessage : m));
      setActiveThread(prev => prev && prev.id === editedMessage.id ? { ...prev, ...editedMessage } : prev);
    };

    const handleMessageDeleted = (messageId: string) => {
      console.log('📩 ChatArea received message-deleted:', messageId);
      const parentId = replyParentMap.current.get(messageId);

      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, isDeleted: true, content: "This message was deleted." };
        }
        if (parentId && m.id === parentId) {
          return {
            ...m,
            _count: { replies: Math.max(0, (m._count?.replies ?? 1) - 1) },
            replies: (m.replies || []).filter(reply => reply.id !== messageId),
          };
        }
        return m;
      }));

      if (parentId) {
        replyParentMap.current.delete(messageId);
        setActiveThread(prev => prev && prev.id === parentId ? {
          ...prev,
          _count: { replies: Math.max(0, (prev._count?.replies ?? 1) - 1) },
          replies: (prev.replies || []).filter(reply => reply.id !== messageId),
        } : prev);
      }
    };

    const handleMessagesRead = (data: { messageIds: string[]; readByUserId: string }) => {
      console.log('📩 ChatArea received messages-read:', data, 'current user ID:', currentUser.id);
      if (data.readByUserId === currentUser.id) {
        console.log('📩 ChatArea: messages-read ignored (own read receipt broadcast)');
        return; // Ignore our own read receipt
      }

      setMessages(prev => prev.map(m => {
        if (data.messageIds.includes(m.id)) {
          const currentReads = m.readByIds || [];
          if (!currentReads.includes(data.readByUserId)) {
            console.log(`📩 ChatArea: Marking message ${m.id} as read by user ${data.readByUserId}`);
            return { ...m, readByIds: [...currentReads, data.readByUserId] };
          }
        }
        return m;
      }));
    };

    const applyPollUpdate = (poll: ChatPoll | null | undefined, data: { counts: Record<string, number>; totalVotes: number; isClosed: boolean }) => {
      if (!poll) return poll;
      return {
        ...poll,
        options: poll.options.map(option => ({
          ...option,
          voteCount: data.counts[option.id] ?? option.voteCount,
        })),
        totalVotes: data.totalVotes,
        isClosed: data.isClosed,
      };
    };

    const handlePollUpdated = (data: { messageId: string; counts: Record<string, number>; totalVotes: number; isClosed: boolean }) => {
      setMessages(prev => prev.map(message => message.id === data.messageId
        ? { ...message, poll: applyPollUpdate(message.poll, data) }
        : message));
      setActiveThread(prev => prev && prev.id === data.messageId
        ? { ...prev, poll: applyPollUpdate(prev.poll, data) }
        : prev);
    };

    const handleMessagePinned = (data: { messageId: string; isPinned: boolean; pinnedAt?: string | null }) => {
      setMessages(prev => prev.map(message => message.id === data.messageId
        ? { ...message, isPinned: data.isPinned, pinnedAt: data.pinnedAt ?? null }
        : message));
      setActiveThread(prev => prev && prev.id === data.messageId
        ? { ...prev, isPinned: data.isPinned, pinnedAt: data.pinnedAt ?? null }
        : prev);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('user-typing', handleUserTyping);
    socket.on('presence-list', handlePresenceList);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('messages-read', handleMessagesRead);
    socket.on('poll-updated', handlePollUpdated);
    socket.on('message-pinned', handleMessagePinned);

    return () => {
      console.log('🔌 ChatArea socket listener cleaning up');
      socket.off('new-message', handleNewMessage);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('user-typing', handleUserTyping);
      socket.off('presence-list', handlePresenceList);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('messages-read', handleMessagesRead);
      socket.off('poll-updated', handlePollUpdated);
      socket.off('message-pinned', handleMessagePinned);
    };
  }, [socket, currentUser.id, currentUser.username, groupId, workspace.id, registerReply]);

  // Instantly mark live messages as read when received
  useEffect(() => {
    const unreadMessages = messages.filter(m => m.author.id !== currentUser.id && !(m.readByIds || []).includes(currentUser.id));
    if (unreadMessages.length > 0) {
      const idsToMark = unreadMessages.map(m => m.id);
      
      console.log('⚡ ChatArea auto-reading messages:', idsToMark);
      
      // Emit socket event and call API
      socket?.emit('messages-read', { workspaceId: channelId || groupId || workspace.id, messageIds: idsToMark, readByUserId: currentUser.id });
      fetch('/api/chat/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: idsToMark })
      }).catch(console.error);

      // Optimistically update locally
      setMessages(prev => prev.map(m => 
        idsToMark.includes(m.id) ? { ...m, readByIds: [...(m.readByIds || []), currentUser.id] } : m
      ));
    }
  }, [messages, currentUser.id, socket, groupId, workspace.id]);

  const handleReactionToggle = (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = message.reactions || [];
    const hasReacted = currentReactions.some(r => r.emoji === emoji && r.user.username === currentUser.username);

    const roomId = channelId || groupId || workspace.id;
    const status = hasReacted ? 'removed' : 'added';

    console.log(`⚡ ChatArea emitting reaction-updated:`, { workspaceId: roomId, messageId, emoji, status });
    socket?.emit('reaction-updated', { workspaceId: roomId, messageId, emoji, user: currentUser, status });

    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;

      let newReactions;
      if (hasReacted) {
        newReactions = currentReactions.filter(r => !(r.emoji === emoji && r.user.username === currentUser.username));
      } else {
        newReactions = [...currentReactions, { id: `temp-${Date.now()}`, emoji, user: { name: currentUser.name || currentUser.username, username: currentUser.username } }];
      }

      return {
        ...m,
        reactions: newReactions
      };
    }));
  };

  const handleOptimisticMessage = (message: Message) => {
    if (message.replyToId) return;
    setMessages(prev => [...prev, message]);
  };

  const handleMessageConfirmed = (tempId: string, realMessage: Message) => {
    if (realMessage.replyToId) {
      registerReply(realMessage);
      return;
    }

    setMessages(prev => {
      // Check if the real message already exists (e.g. came from socket before API response)
      const exists = prev.some(m => m.id === realMessage.id);

      if (exists) {
          // If real message exists, just remove the optimistic one to avoid duplicates
          return prev.filter(m => m.id !== tempId);
      }

      // Otherwise, replace optimistic with real
      return prev.map(m => m.id === tempId ? realMessage : m);
    });
  };

  const handleMessageFailed = (tempId: string) => {
    setMessages(prev => prev.filter(m => m.id !== tempId));
  };

  const conversationTitle = channelName
    ? `# ${channelName}`
    : groupId
      ? "Group conversation"
      : workspace.name;

  const copyChannelLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", description: "Share it with a workspace member." });
    } catch {
      toast({
        title: "Could not copy the link",
        description: "Copy the address from your browser instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <Link
              href={`/${locale}/dashboard/chat`}
              className="mr-2 inline-flex h-8 w-8 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>

            {/* Mobile menu button */}
            {onOpenMobileMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenMobileMenu}
                className="mr-3 lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent p-1 flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}

            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground mr-3 flex-shrink-0",
              colorMap[workspace.color as keyof typeof colorMap] || colorMap.BLUE
            )}>
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {channelName ? `# ${channelName}` : workspace.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center">
                <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {channelName ? `${workspace.name} · ` : ""}
                  {workspace._count.subscribers} {workspace._count.subscribers === 1 ? "member" : "members"}
                </span>
                {onlineUsers.length > 0 && (
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {onlineUsers.length} online
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => briefOpen ? setBriefOpen(false) : openBriefPanel()}
              aria-label="Channel brief"
              title="Channel brief"
              className={cn("p-1 text-muted-foreground hover:bg-accent hover:text-foreground", briefOpen && "bg-secondary text-foreground")}
            >
              <ClipboardList className="w-4 h-4" />
            </Button>
            {channelId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dsaOpen ? setDsaOpen(false) : openDsaPanel()}
                aria-label="DSA co-working room"
                title="DSA co-working room"
                className={cn("p-1 text-muted-foreground hover:bg-accent hover:text-foreground", dsaOpen && "bg-secondary text-foreground")}
              >
                <Brain className="w-4 h-4" />
              </Button>
            )}
            <ChatSearch workspaceId={workspace.id} groupId={groupId} currentUser={currentUser} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Channel options"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="truncate text-[10px] font-medium tracking-wide text-muted-foreground">
                  {conversationTitle}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={openBriefPanel}
                >
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Channel brief
                </DropdownMenuItem>
                {channelId && (
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={openDsaPanel}
                  >
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    DSA co-working room
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={() => setDetailsOpen(true)}
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                  {channelName ? "Channel details" : "Conversation details"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={copyChannelLink}
                >
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Copy channel link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link
                    href={`/${locale}/dashboard/workspace/${workspace.id}`}
                    className="flex w-full items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    View workspace
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {dsaRoom && !dsaOpen && (
            <DsaRoomBanner room={dsaRoom} onOpen={openDsaPanel} />
          )}
          <MessageList 
            messages={messages.filter(m => !m.replyToId)} 
            isLoading={isLoading} 
            currentUser={currentUser}
            workspaceId={workspace.id}
            onReply={openThreadPanel}
            onReactionToggle={handleReactionToggle}
            setMessages={setMessages}
            onVote={handlePollVote}
            onPinMessage={handlePinMessage}
            onMessageEdit={(msg) => {
              socket?.emit('message-edited', { workspaceId: channelId || groupId || workspace.id, message: msg });
            }}
            onMessageDelete={(msgId) => {
              socket?.emit('message-deleted', { workspaceId: channelId || groupId || workspace.id, messageId: msgId });
            }}
            onMessagesRead={(msgIds) => {
              socket?.emit('messages-read', { workspaceId: channelId || groupId || workspace.id, messageIds: msgIds, readByUserId: currentUser.id });
              fetch('/api/chat/messages/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds: msgIds })
              }).catch(console.error);
            }}
          />

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-1 text-xs text-muted-foreground italic flex items-center gap-1">
              <div className="flex space-x-1 items-center">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="ml-2">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}

          <ChatInput 
            workspaceId={workspace.id} 
            groupId={groupId}
            channelId={channelId}
            currentUser={currentUser} 
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onOptimisticMessage={handleOptimisticMessage}
            onMessageConfirmed={handleMessageConfirmed}
            onMessageFailed={handleMessageFailed}
            onExternalMessage={handleExternalMessage}
            onOpenBrief={openBriefPanel}
            onOpenDsaRoom={channelId ? openDsaPanel : undefined}
          />
        </div>
        {activeThread && (
          <div className="absolute inset-y-0 right-0 z-30 w-full border-l border-border bg-background shadow-lg animate-in slide-in-from-right-4 duration-200 sm:static sm:z-auto sm:w-[420px] sm:flex-shrink-0">
            <ThreadSidebar
              parentMessage={activeThread}
              workspaceId={workspace.id}
              groupId={groupId}
              channelId={channelId}
              currentUser={currentUser}
              onClose={() => setActiveThread(null)}
            />
          </div>
        )}
        {briefOpen && !activeThread && (
          <div className="absolute inset-y-0 right-0 z-30 w-full border-l border-border bg-background shadow-lg animate-in slide-in-from-right-4 duration-200 sm:static sm:z-auto sm:w-[420px] sm:flex-shrink-0">
            <ChannelBrief
              workspaceId={workspace.id}
              groupId={groupId}
              channelId={channelId}
              title={conversationTitle}
              onlineCount={onlineUsers.length}
              onClose={() => setBriefOpen(false)}
              onOpenThread={openThreadPanel}
              onOpenDsaRoom={channelId ? openDsaPanel : () => {}}
            />
          </div>
        )}
        {dsaOpen && channelId && !activeThread && !briefOpen && (
          <div className="absolute inset-y-0 right-0 z-30 w-full border-l border-border bg-background shadow-lg animate-in slide-in-from-right-4 duration-200 sm:static sm:z-auto sm:w-[420px] sm:flex-shrink-0">
            <DsaRoomPanel
              workspaceId={workspace.id}
              channelId={channelId}
              currentUser={currentUser}
              onClose={() => {
                setDsaOpen(false);
                refreshDsaRoom();
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{conversationTitle}</DialogTitle>
            <DialogDescription>
              Conversation details for this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-px border border-border bg-border">
            <div className="flex items-center justify-between gap-4 bg-card px-4 py-3 text-[12px]">
              <span className="text-muted-foreground">Workspace</span>
              <span className="truncate">{workspace.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-card px-4 py-3 text-[12px]">
              <span className="text-muted-foreground">
                {channelName ? "Channel" : groupId ? "Group" : "Space"}
              </span>
              <span className="truncate">{conversationTitle}</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-card px-4 py-3 text-[12px]">
              <span className="text-muted-foreground">Members</span>
              <span>{workspace._count.subscribers}</span>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">People</p>
            <div className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
              {workspace.subscribers.slice(0, 24).map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center gap-3 bg-card px-4 py-2.5"
                >
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                    {(member.user.name || member.user.username)
                      .charAt(0)
                      .toUpperCase()}
                    {onlineUsers.includes(member.user.id) && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-emerald-500"
                        aria-label="Online"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px]">
                      {member.user.name || member.user.username}
                      {member.user.id === currentUser.id && (
                        <span className="ml-1.5 text-[10px] text-primary">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                      @{member.user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {workspace._count.subscribers > 24 && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Showing the first 24 of {workspace._count.subscribers} members.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
