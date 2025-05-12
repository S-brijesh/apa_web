'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Logging in...'); // Replace with actual logic
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left Form Section */}
      <div className="w-1/2 p-16 bg-white flex flex-col justify-center">
        <h1 className="text-2xl font-semibold text-indigo-700 mb-10 text-center">LOG IN</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-gray-500"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-gray-500"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow-md transition duration-300"
            >
              Login
            </button>
          </div>

          <p className="text-sm text-black text-center mt-4">
            Already have an account?{' '}
            <Link href="/register" className="text-indigo-700 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>

      {/* Right Image Section */}
      <div className="w-1/2 bg-indigo-100 flex items-center justify-center">
        <div
          className="w-3/4 h-3/4 bg-no-repeat bg-center bg-contain"
          style={{ backgroundImage: "url('/wave-pattern.png')" }} // Replace with your image
        ></div>
      </div>
    </div>
  );
}
