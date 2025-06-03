import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative w-full h-screen bg-blue-100 overflow-hidden">
      {/* Logo (as image) and Button */}
      <div className="absolute top-1/3 left-24 flex flex-col items-start">
        <Image
          src="/images/precoglogofinal.png"
          alt="PRECOG Logo"
          width={250}
          height={80}
          className="mb-6"
        />

        <Link href="/login">
          <button className="px-6 py-2 bg-blue-200 text-blue-800 rounded-lg shadow hover:shadow-lg">
            Log in
          </button>
        </Link>
      </div>

      {/* Pulse + Tide */}
        <div className="absolute right-10 top-1/6 w-[40%] flex flex-col items-center ">
        <Image
            src="/images/tides.png"
            alt="Tide Background"
            width={600}
            height={250}
            className="top-0 z-0"
        />
        <Image
            src="/images/pulsewave.png"
            alt="Pulse Line"
            width={900}
            height={200}
            className="absolute top-4 z-10 right-0"
        />
        </div>


      {/* Wave Background (3 Images) */}
      <div className="absolute bottom-0 w-full">
        <Image
          src="/wave1.png"
          alt="Wave 1"
          width={1920}
          height={200}
          className="w-full absolute bottom-0 z-10"
        />
        <Image
          src="/wave2.png"
          alt="Wave 2"
          width={1920}
          height={200}
          className="w-full absolute bottom-0 z-0"
        />
        <Image
          src="/wave3.png"
          alt="Wave 3"
          width={1920}
          height={200}
          className="w-full absolute bottom-0 z-[-1]"
        />
      </div>
    </div>
  );
}
