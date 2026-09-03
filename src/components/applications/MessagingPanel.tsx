'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applicationsApi, ApiError, Message, WebSocketEvent } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface MessagingPanelProps {
    applicationId: string;
    currentUserId?: string;
}

function initials(firstName?: string, lastName?: string) {
    return `${(firstName || '?').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function formatTime(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function MessagingPanel({ applicationId, currentUserId }: MessagingPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const res = await applicationsApi.getMessages(applicationId);
            setMessages(res.data || []);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleWsMessage = useCallback((event: WebSocketEvent) => {
        if (event.type === 'new_message' && event.applicationId === applicationId) {
            setMessages((prev) => {
                if (prev.some((m) => m._id === event.data._id)) return prev;
                return [...prev, event.data as Message];
            });
        }
    }, [applicationId]);

    const { isConnected } = useWebSocket(applicationId, {
        onMessage: handleWsMessage,
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = draft.trim();
        if (!content || sending) return;

        setSending(true);
        setDraft('');
        try {
            const res = await applicationsApi.sendMessage(applicationId, content);
            // The WS broadcast will also deliver this to us; guard against duplicates.
            if (res.data) {
                setMessages((prev) =>
                    prev.some((m) => m._id === res.data!._id) ? prev : [...prev, res.data as Message]
                );
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send message');
            setDraft(content); // restore so the user doesn't lose their text
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="flex h-[520px] flex-col rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Messages
                </h2>
                <span
                    className={`flex items-center gap-1.5 text-theme-xs ${
                        isConnected ? 'text-success-600 dark:text-success-400' : 'text-gray-400'
                    }`}
                >
                    <span
                        className={`size-1.5 rounded-full ${
                            isConnected ? 'bg-success-500' : 'bg-gray-300'
                        }`}
                    />
                    {isConnected ? 'Live' : 'Connecting…'}
                </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {loading ? (
                    <p className="text-sm text-gray-400">Loading messages…</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No messages yet. Send a note to your adviser below.
                    </p>
                ) : (
                    messages.map((msg) => {
                        const sender = typeof msg.senderId === 'object' ? msg.senderId : null;
                        const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                        const isMine = currentUserId && senderIdStr === currentUserId;
                        const name = sender?.profile
                            ? `${sender.profile.firstName || ''} ${sender.profile.lastName || ''}`.trim()
                            : msg.senderRole;

                        return (
                            <div
                                key={msg._id}
                                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                            >
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                                    {initials(sender?.profile?.firstName, sender?.profile?.lastName)}
                                </div>
                                <div className={`max-w-[75%] ${isMine ? 'text-right' : ''}`}>
                                    <div
                                        className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${
                                            isMine
                                                ? 'rounded-br-sm bg-brand-500 text-white'
                                                : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white/90'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <p className="mt-1 text-theme-xs text-gray-400">
                                        {!isMine && <span className="capitalize">{name} · </span>}
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {error && (
                <div className="mx-5 mb-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </section>
    );
}
