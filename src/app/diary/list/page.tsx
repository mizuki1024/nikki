"use client";

import { useEffect, useState } from "react";
import { fetchDiaryEntries } from "@/lib/firebase";
import { useUser } from "../../../lib/UserContext";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// Types
interface DiaryEntry {
    id: string;
    date: string | { _seconds: number };
    content: string;
    images: string[];
    tags: string[];
    weather: "sunny" | "cloudy" | "rainy";
    mood: "good" | "neutral" | "bad";
    userId: string;
    isPublic: boolean;
    isLiked: boolean;
  }

export default function DiaryListPage() {
  const { user } = useUser();
  const userId = user?.uid;
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const fetched = await fetchDiaryEntries(userId) as DiaryEntry[];
        setEntries(fetched);
      } catch (err) {
        console.error("Error loading entries:", err);
      } finally {
        setLoading(false);
      }
    };    loadEntries();
  }, [userId]);

  if (loading) return <div className="text-center mt-8">読み込み中...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">日記一覧</h1>
      {entries.length === 0 ? (
        <p>まだ日記がありません。</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const dateStr = typeof entry.date === "string"
              ? entry.date
              : format(new Date(entry.date._seconds * 1000), "yyyy-MM-dd");
            return (
              <li key={entry.id} className="border rounded p-4">
                <Link href={`/diary/${dateStr}`} className="text-lg font-medium text-blue-600 hover:underline">
                  {format(new Date(dateStr), "yyyy年MM月dd日", { locale: ja })}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  {entry.isPublic ? "🌍 公開" : "🔒 非公開"} - タグ: {entry.tags.join(", ") || "なし"}
                </p>
                <p className="mt-2 line-clamp-2 text-sm">{entry.content}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
