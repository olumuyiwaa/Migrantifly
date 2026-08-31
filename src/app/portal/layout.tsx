"use client";
import { Outfit } from "next/font/google";
import "flatpickr/dist/flatpickr.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import {SidebarProvider} from "@/contexts/SidebarContext";

const outfit = Outfit({
    subsets: ["latin"],
});

export default function AdminLayout({
                                        children,
                                    }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${outfit.className} admin-body dark:bg-gray-900 min-h-screen`}>
            <ThemeProvider>
                <SidebarProvider>{children}</SidebarProvider>
            </ThemeProvider>
        </div>
    );
}