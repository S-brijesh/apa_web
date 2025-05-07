'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Register() {
  const [form, setForm] = useState({
    hospital: '',
    address: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone to numbers only
    const newValue = name === 'phone' ? value.replace(/[^0-9]/g, '') : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    // Validate on change
    validateField(name, newValue);
  };

  const validateField = (name, value) => {
    let message = '';

    switch (name) {
      case 'hospital':
        if (!value) message = 'Hospital name is required';
        break;
      case 'address':
        if (!value) message = 'Address is required';
        break;
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(value)) message = 'Invalid email';
        break;
      case 'phone':
        if (!/^\d{10}$/.test(value)) message = 'Enter 10-digit phone number';
        break;
      case 'password':
        if (value.length < 6) message = 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (value !== form.password) message = 'Passwords do not match';
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    Object.keys(form).forEach((key) => validateField(key, form[key]));

    const hasErrors = Object.values(errors).some((err) => err);
    if (!hasErrors && Object.values(form).every((v) => v)) {
      alert('Form submitted successfully!');
      // Handle registration logic here
    }
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left Form Section */}
      <div className="w-1/2 p-16 bg-white flex flex-col justify-center">
        <h1 className="text-2xl font-semibold text-blue-800 mb-10 text-center">
          REGISTRATION FORM
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              name="hospital"
              placeholder="Hospital / Clinic name"
              value={form.hospital}
              onChange={handleChange}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
            />
            {errors.hospital && <p className="text-red-600 text-sm">{errors.hospital}</p>}
          </div>
          <div>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
            />
            {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="email"
                name="email"
                placeholder="Email id"
                value={form.email}
                onChange={handleChange}
                className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>
            <div className="w-1/2">
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                inputMode="numeric"
                onChange={handleChange}
                className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
              />
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
              />
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>
            <div className="w-1/2">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full border-b border-black text-black py-2 px-1 outline-none placeholder-black"
              />
              {errors.confirmPassword && <p className="text-red-600 text-sm">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded shadow-md transition duration-300"
            >
              Register
            </button>
          </div>

          <p className="text-sm text-black text-center mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-700 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>

      {/* Right Image Section */}
      <div className="w-1/2 bg-blue-100 flex items-center justify-center">
        <div
          className="w-3/4 h-3/4 bg-no-repeat bg-center bg-contain"
          style={{ backgroundImage: "url('/wave-pattern.png')" }}
        ></div>
      </div>
    </div>
  );
}
