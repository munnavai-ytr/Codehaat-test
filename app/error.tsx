'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-[#E85542] text-white text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
