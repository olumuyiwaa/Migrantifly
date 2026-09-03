// pages/dashboard/messages/[applicationId].tsx
import { ChatInterface } from '@/components/messaging/ChatInterface';
import { useRouter } from 'next/router';
import {Message,SendMessageRequest,getStoredUser, type AuthUserSummary, type UserRole } from "@/lib/api";
import { useEffect, useState } from 'react';

export default function MessagesPage() {
    const router = useRouter();
    const { applicationId } = router.query;
    const [user, setUser] = useState<AuthUserSummary | null>(null);

    useEffect(() => {
        setUser(getStoredUser());
    }, []);
    const [application, setApplication] = useState(null);

    useEffect(() => {
        if (applicationId) {
            fetchApplicationDetails();
        }
    }, [applicationId]);

    const fetchApplicationDetails = async () => {
        // Fetch application to get adviser/client details
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Messages</h1>
                <div className="h-[600px]">
                    <ChatInterface
                        applicationId={applicationId as string}
                        recipientId={user?.role === 'client' ? application?.adviserId : application?.clientId}
                        recipientName={user?.role === 'client' ? 'Your Adviser' : 'Client Name'}
                        adviserName={user?.role === 'client' ? 'Adviser Name' : undefined}
                    />
                </div>
            </div>
        </div>
    );
}