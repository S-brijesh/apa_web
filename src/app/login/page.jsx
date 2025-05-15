'use client'; // ✅ Only needed if you're using App Router

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ If you're using App Router. Use 'next/router' if you're on Pages Router.
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in user:', userCredential.user);
      router.push('/dashboard'); // ✅ Redirect on success
    } catch (error) {
      console.error('Login failed:', error.code);
      switch (error.code) {
        case 'auth/invalid-email':
          setErrorMsg('The email address is not valid.');
          break;
        case 'auth/user-not-found':
          setErrorMsg('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setErrorMsg('Incorrect password.');
          break;
        case 'auth/too-many-requests':
          setErrorMsg('Too many attempts. Please try again later.');
          break;
        default:
          setErrorMsg('Login failed. Please try again.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left Form Section */}
      <div className="w-1/2 p-16 bg-white flex flex-col justify-center">
        <h1 className="text-2xl font-semibold text-indigo-700 mb-10 text-center">LOG IN</h1>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-gray-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-gray-500"
              required
            />
          </div>

          {/* Display error message */}
          {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow-md transition duration-300 ${loading && 'opacity-50 cursor-not-allowed'}`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <p className="text-sm text-black text-center mt-4">
            Don’t have an account?{' '}
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
          // style={{ backgroundImage: "url('/wave-pattern.png')" }} // Add image URL here
        ></div>
      </div>
    </div>
  );
}
