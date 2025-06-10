'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function NavbarBefore() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white font-sans border-b border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      {/* Left - Logo */}
        <div className="flex items-center space-x-2">
            <Image
            src="/images/acuradynelogofinal.png" 
            alt="Logo"
            width={100}
            height={50}
            />
        </div>

      
      {/* Right - Links */}
      <div className="flex items-center space-x-6 text-sm text-indigo-700">
        <Link href="/" className="hover:underline font-semibold">
          Register
        </Link>
        <Link href="/login" className="hover:underline">
          Login
        </Link>
        {/* <div className="flex items-center space-x-1">
          <span>Device is connected</span>
          <span className="bg-lime-400 text-white text-xs rounded-sm px-1">✅</span>
        </div> */}
      </div>
    </nav>
  );
}
