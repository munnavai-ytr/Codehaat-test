import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] dark:bg-[#0D0B1A] text-[#1E1B4B] dark:text-[#FAF7F2] p-6 text-center">
      <h1 className="text-4xl font-extrabold mb-2">404</h1>
      <p className="text-base text-gray-500 mb-6">Page not found.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-2xl bg-[#E85542] text-white font-semibold text-sm shadow-md"
      >
        Return Home
      </Link>
    </div>
  );
}
