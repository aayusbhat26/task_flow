'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketProvider';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

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
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  isOptimistic?: boolean;
}

interface ChatAreaProps {
  workspace: Workspace;
  currentUser: CurrentUser;
  groupId?: string;
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

export function ChatArea({ workspace, currentUser, groupId, onOpenMobileMenu }: ChatAreaProps) {
  const { socket, joinWorkspace, leaveWorkspace } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Join workspace when component mounts or workspace changes
  useEffect(() => {
    if (workspace.id) {
      console.log('🔗 ChatArea: Joining workspace:', workspace.id);
      joinWorkspaceRef.current(workspace.id);
    }

    return () => {
      if (workspace.id) {
        console.log('🔗 ChatArea: Leaving workspace:', workspace.id);
        leaveWorkspaceRef.current(workspace.id);
      }
    };
  }, [workspace.id]); // Only depend on workspace.id

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const url = groupId
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

    if (workspace.id || groupId) {
      loadMessages();
    }
  }, [workspace.id, groupId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists (by ID)
        if (prev.some(m => m.id === message.id)) {
            return prev;
        }
        return [...prev, message];
      });
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  const handleOptimisticMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleMessageConfirmed = (tempId: string, realMessage: Message) => {
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            {/* Mobile menu button */}
            {onOpenMobileMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenMobileMenu}
                className="mr-3 lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}

            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0",
              colorMap[workspace.color as keyof typeof colorMap] || colorMap.BLUE
            )}>
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {workspace.name}
              </h1>
              <p className="text-sm text-gray-500 flex items-center">
                <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{workspace._count.subscribers} members</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            currentUser={currentUser}
          />
          <ChatInput
            workspaceId={workspace.id}
            groupId={groupId}
            currentUser={currentUser}
            onOptimisticMessage={handleOptimisticMessage}
            onMessageConfirmed={handleMessageConfirmed}
          />
        </div>
      </div>
    </div>
  );
}
