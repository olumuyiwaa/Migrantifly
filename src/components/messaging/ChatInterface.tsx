// components/messaging/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import {
    Message,
    SendMessageRequest,
    getStoredUser,
    getToken,
    type AuthUserSummary,
    type UserRole,
    type MessageAttachment
} from "@/lib/api";

interface ChatInterfaceProps {
    applicationId: string;
    recipientId: string;
    recipientName: string;
    adviserName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
                                                                applicationId,
                                                                recipientId,
                                                                recipientName,
                                                                adviserName
                                                            }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<AuthUserSummary | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Load user and token from localStorage on mount
    useEffect(() => {
        const storedUser = getStoredUser();
        const storedToken = getToken();
        if (storedUser) setUser(storedUser);
        if (storedToken) setToken(storedToken);
    }, []);

    // WebSocket connection for real-time messages
    const { sendMessage: sendWsMessage, lastMessage } = useWebSocket({
        applicationId,
        onMessage: (message: Message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        }
    });

    // Fetch messages
    const fetchMessages = useCallback(async (pageNum: number = 1) => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/application/${applicationId}?page=${pageNum}&limit=50`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired - refresh or redirect
                    console.error('Unauthorized - token may have expired');
                }
                throw new Error('Failed to fetch messages');
            }

            const data = await response.json();

            if (pageNum === 1) {
                setMessages(data.data || []);
            } else {
                setMessages(prev => [...(data.data || []), ...prev]);
            }

            setHasMore(data.pagination?.pages > pageNum || false);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [applicationId, token]);

    useEffect(() => {
        if (applicationId && token) {
            fetchMessages(1);
        }
    }, [applicationId, token, fetchMessages]);

    useEffect(() => {
        if (lastMessage) {
            setMessages(prev => [...prev, lastMessage]);
            scrollToBottom();
        }
    }, [lastMessage]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    // Send message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || isSending) return;

        try {
            setIsSending(true);
            const formData = new FormData();
            formData.append('applicationId', applicationId);
            formData.append('recipientId', recipientId);
            formData.append('content', newMessage.trim());

            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send message');
            }

            const data = await response.json();

            if (data.success && data.data) {
                setMessages(prev => [...prev, data.data]);
                setNewMessage('');
                setAttachments([]);
                scrollToBottom();

                // Send via WebSocket for real-time delivery
                if (sendWsMessage) {
                    sendWsMessage(data.data);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Validate file size (max 10MB each)
            const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
            if (validFiles.length !== files.length) {
                alert('Some files exceed the 10MB limit and were not added.');
            }
            setAttachments(prev => [...prev, ...validFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Load older messages
    const loadMoreMessages = () => {
        if (hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    };

    // Format attachment size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {adviserName ? `Chat with ${adviserName}` : 'Messages'}
                        </h3>
                        <p className="text-sm text-gray-500">{recipientName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Secure Chat</span>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ maxHeight: '500px' }}
            >
                {isLoading && page === 1 ? (
                    <div className="text-center py-4">
                        <div className="animate-spin inline-block w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation by sending a message below.</p>
                    </div>
                ) : (
                    <>
                        {hasMore && (
                            <button
                                onClick={loadMoreMessages}
                                disabled={isLoading}
                                className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Load older messages'}
                            </button>
                        )}

                        {messages.map((message) => {
                            const isOwnMessage = message.senderId?._id === user?.id;

                            return (
                                <div
                                    key={message._id}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                        <div className={`rounded-lg px-4 py-2 ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                            {!isOwnMessage && message.senderId && (
                                                <p className="text-xs font-medium mb-1">
                                                    {message.senderId.firstName} {message.senderId.lastName}
                                                </p>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {message.attachments.map((attachment: MessageAttachment, idx: number) => (
                                                        <a
                                                            key={idx}
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`text-xs flex items-center space-x-1 hover:underline ${
                                                                isOwnMessage ? 'text-blue-100' : 'text-blue-600'
                                                            }`}
                                                        >
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="truncate">{attachment.name}</span>
                                                            <span className="text-gray-400">({formatFileSize(attachment.size)})</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {message.isImportant && (
                                                <div className="mt-1 flex items-center space-x-1">
                                                    <span className="text-xs font-semibold text-yellow-500">⚠️ Important</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                            {!isOwnMessage && !message.readAt && (
                                                <span className="ml-2 text-gray-400">Delivered</span>
                                            )}
                                            {isOwnMessage && message.readAt && (
                                                <span className="ml-2 text-green-500">✓ Read</span>
                                            )}
                                            {isOwnMessage && !message.readAt && (
                                                <span className="ml-2 text-gray-400">✓ Sent</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachments.map((file, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                                {file.name} ({formatFileSize(file.size)})
                                <button
                                    onClick={() => removeAttachment(index)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                    type="button"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                    <div className="flex-1">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            disabled={isSending}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            disabled={isSending}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;