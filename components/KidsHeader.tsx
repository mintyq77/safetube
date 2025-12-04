"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface KidsHeaderProps {
  showBackButton?: boolean;
  showUserMenu?: boolean;
  childName?: string;
}

export default function KidsHeader({
  showBackButton = false,
  showUserMenu = true,
  childName = "Zoe",
}: KidsHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleUnlinkDevice = () => {
    if (confirm("Are you sure you want to unlink this device?")) {
      localStorage.removeItem("safetube_parent_id");
      router.push("/link-device");
    }
    setShowMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-md sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left side - Logo/Brand with optional back button */}
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={() => router.push("/")}
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Go back to home"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}
            <Image
              src="/zootube-logo.png"
              alt="ZooTube Logo"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <h1 className="font-chewy text-2xl text-gray-900 sm:text-3xl">
              ZooTube
            </h1>
          </div>

          {/* Right side - User menu */}
          {showUserMenu && (
            <div className="relative z-50">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-200 sm:px-4"
                aria-label="User menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-geist-sans">{childName}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-white shadow-lg">
                  <button
                    onClick={handleUnlinkDevice}
                    className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Unlink device
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
