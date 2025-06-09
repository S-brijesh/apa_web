'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white font-sans border-b border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      {/* Left - Logo */}
      <div className="text-xl font-semibold text-indigo-700 tracking-wide">
        PRECOG
      </div>

      
      {/* Right - Links */}
      <div className="flex items-center space-x-6 text-sm text-indigo-700">
        <Link href="/" className="hover:underline font-semibold">
          Home
        </Link>
        <Link href="/support" className="hover:underline">
          Help & support
        </Link>
        <Link href="/login" className="hover:underline">
          Log out
        </Link>
        {/* <div className="flex items-center space-x-1">
          <span>Device is connected</span>
          <span className="bg-lime-400 text-white text-xs rounded-sm px-1">✅</span>
        </div> */}
      </div>
    </nav>
  );
}
