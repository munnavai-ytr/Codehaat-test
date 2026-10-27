'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FAF7F2] text-[#1E1B4B]">
        <h2 className="text-xl font-bold mb-2">An unexpected error occurred</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-[#E85542] text-white text-sm font-semibold"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
