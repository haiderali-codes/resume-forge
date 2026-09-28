'use client';

export default function Spinner({
  size = 'sm',
}: {
  size?: 'sm' | 'md';
}) {
  return (
    <span
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
      }`}
    />
  );
}