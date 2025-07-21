import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NoticeRibbon() {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/notices/active`)
      .then(res => res.json())
      .then(data => {
        if (data && data.message) setNotice(data);
      });
  }, []);

  if (!notice || dismissed) return null;

  return (
    <div className="w-full bg-brand-primary text-white text-center py-2 px-4 font-medium flex items-center justify-center relative z-50">
      <span>{notice.message}</span>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 text-lg font-bold"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notice"
      >
        &times;
      </button>
    </div>
  );
} 