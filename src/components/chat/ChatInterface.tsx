'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  status: string;
  isEdited: boolean;
  createdAt: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  title: string | null;
  lastMessageAt: string | null;
  participants: Array<{
    userId: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface ChatInterfaceProps {
  currentUserId: string;
  initialConversationId?: string;
}

export function ChatInterface({
  currentUserId,
  initialConversationId,
}: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${selectedConversation}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedConversation]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setIsLoading(true);
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (selectedConversation) {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages();
        fetchConversations();
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConversation, fetchMessages, fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
          replyToId: replyTo?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        setReplyTo(null);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const otherParticipant = selectedConv?.participants[0];

  return (
    <div className="flex h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                  selectedConversation === conv.id
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {conv.participants[0]?.avatar ? (
                        <img
                          src={conv.participants[0].avatar}
                          alt={conv.participants[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                          {conv.participants[0]?.name.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    {conv.participants[0]?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.participants[0]?.name || 'Unknown'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {otherParticipant?.avatar ? (
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {otherParticipant?.name.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                {otherParticipant?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {otherParticipant?.name || 'Unknown'}
                </h3>
                <p className="text-xs text-gray-500">
                  {otherParticipant?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwn
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          } rounded-2xl px-4 py-2`}
                        >
                          {message.replyTo && (
                            <div
                              className={`text-xs mb-2 pb-2 border-b ${
                                isOwn
                                  ? 'border-white/20 text-white/70'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-500'
                              }`}
                            >
                              <span className="font-medium">{message.replyTo.senderName}</span>
                              <p className="truncate">{message.replyTo.content}</p>
                            </div>
                          )}
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                            {message.isEdited && ' (edited)'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-500">Replying to </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {replyTo.senderName}
                  </span>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-brand-600 text-white px-6 py-2 rounded-full font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
