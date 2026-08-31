"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { login, ApiError, LoginRequest } from "@/lib/api"; // Adjust import path as needed
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await login(loginData);

      // Check if login was successful
      if (response.token || response.access_token) {
        // Redirect based on user role
        const storedUser = JSON.parse(localStorage.getItem("migrantifly_user") || "{}");


          router.push("/portal");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message || "Login failed. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign In
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and password to sign in!
              </p>
            </div>
            <div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                      </div>
                  )}
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        placeholder="info@gmail.com"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={error ? "border-red-500 focus:border-red-500" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className={error ? "border-red-500 focus:border-red-500" : ""}
                      />
                      <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          role="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                      {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                          checked={isChecked}
                          onChange={setIsChecked}
                          disabled={isLoading}
                      />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                    </div>
                    <Link
                        href="/reset-password"
                        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div>
                    <Button
                        className="w-full"
                        size="sm"
                        disabled={isLoading}
                    >
                      {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                              <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                              />
                              <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Signing in...
                          </div>
                      ) : (
                          "Sign in"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
}