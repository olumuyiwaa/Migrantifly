import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Header from "@/components/Header";

export default function AuthLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
        <Header />
        <ThemeProvider>
          <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
            {children}

            {/* Right panel */}
            <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden relative overflow-hidden">
              {/* Background / decorative image */}
              <Image
                  src="/images/blog4.png"
                  alt="Auth illustration"
                  fill
                  className="object-cover object-center"
                  priority
              />

              {/* Optional dark overlay so text stays readable */}
              <div className="absolute inset-0 bg-brand-950/30 dark:bg-black/40 z-0" />

              {/* Logo + text on top of the image */}
              <div className="relative z-10 flex flex-col items-center max-w-xs mx-auto">
                <Link href="/" className="block mb-4">
                  <Image
                      width={231}
                      height={48}
                      src="/images/logo/auth-logo.svg"
                      alt="Logo"
                  />
                </Link>
                <p className="text-center text-xl text-gray-200 dark:text-white/80">
                  From dreaming to thriving — we guide you through every step of
                  your migration journey.
                </p>
              </div>
            </div>

            <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
              <ThemeTogglerTwo />
            </div>
          </div>
        </ThemeProvider>
      </div>
  );
}