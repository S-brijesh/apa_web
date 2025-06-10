"use client";
import React from 'react';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    step: 'STEP 1',
    description: 'Connect the device to your desktop via HDMI port',
    image: '/images/device1.png' // Place your actual image in the public/ directory
  },
  {
    step: 'STEP 2',
    description: "Adjust the strap on patient's wrist as per required",
    image: '/images/device2.png'
  },
  {
    step: 'STEP 3',
    description: "Click ‘Start recording’ on the app to begin recording",
    image: '/images/device3.png'
  }
];

export default function help() {
  return (
    <div className="min-h-screen bg-white px-6 py-8 text-indigo-700 font-sans">
      

      {/* Header */}
      <div className="flex items-center space-x-2 mb-6 text-lg font-semibold">
        <ArrowLeft className="w-5 h-5" />
        <span>Step by step guide</span>
      </div>
      
      
      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 text-center"
          >
            <div className="relative w-full h-40 mb-4">
              <Image src={step.image} alt={step.step} layout="fill" objectFit="contain" />
            </div>
            <h3 className="text-indigo-700 font-semibold text-base mb-1">{step.step}</h3>
            <p className="text-sm text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
