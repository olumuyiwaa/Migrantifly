// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketEvent, WebSocketEventType } from '@/lib/api';
import { getToken } from '@/lib/api';

interface UseWebSocketOptions {
    onMessage?: (event: WebSocketEvent) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export function useWebSocket(
    applicationId?: string,
    options: UseWebSocketOptions = {}
) {
    const {
        onMessage,
        onConnect,
        onDisconnect,
        onError,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        const token = getToken();
        if (!token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://migrantifly-backend.onrender.com/';
        const url = applicationId
            ? `${wsUrl}/ws/applications/${applicationId}?token=${token}`
            : `${wsUrl}/ws/applications?token=${token}`;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as WebSocketEvent;
                    setLastEvent(data);
                    onMessage?.(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                onDisconnect?.();
                attemptReconnect();
            };

            ws.onerror = (error) => {
                onError?.(error);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            attemptReconnect();
        }
    }, [applicationId, onConnect, onDisconnect, onError, onMessage]);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
        }, reconnectInterval);
    }, [connect, maxReconnectAttempts, reconnectInterval]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected,
        lastEvent,
        sendMessage,
        disconnect,
        reconnect: connect,
    };
}