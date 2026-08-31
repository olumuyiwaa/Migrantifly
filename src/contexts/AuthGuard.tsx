"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

interface AuthGuardProps {
    children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const user = getStoredUser();

        if (!user) {
            router.replace("/signin");
            return;
        }

        setReady(true);
    }, [router]);

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Checking authentication...
            </div>
        );
    }

    return children;
}