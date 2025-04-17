"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { RefreshCw, List } from "lucide-react";

import { useUser } from "@/lib/UserContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

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

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function DiaryCalendar() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const userId = user?.uid || "";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPublicView, setIsPublicView] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔐 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // 📦 日記データ取得
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/diary?userId=${userId}`);
        if (!res.ok) {
          throw new Error("日記データの取得に失敗しました");
        }
        const entries = await res.json();
        setDiaryEntries(entries as DiaryEntry[]);
      } catch (e) {
        console.error(e);
        setError("日記の取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // 🔄 選択日への遷移
  const navigateToDate = async (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    if (!userId) return;

    try {
      const res = await fetch(`/api/diary?userId=${userId}&date=${formattedDate}`);
      if (!res.ok) {
        throw new Error("日記データの取得に失敗しました");
      }
      const diaryEntry = await res.json();
      const path = diaryEntry ? `/diary/${formattedDate}` : `/diary/edit?date=${formattedDate}`;
      router.push(path);
    } catch (e) {
      console.error("日記データの取得エラー:", e);
      router.push(`/diary/edit?date=${formattedDate}`);
    }
  };

  // 📆 カレンダー1日分の表示
  const renderCalendarDay = (date: Date, index: number) => {
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());
    const dayOfWeek = getDay(date);

    const hasEntry = diaryEntries.some((entry) => {
      const entryDate =
        typeof entry.date === "string"
          ? new Date(entry.date)
          : new Date(entry.date._seconds * 1000);
      return (
        isSameDay(entryDate, date) &&
        (isPublicView ? entry.isPublic : true)
      );
    });

    return (
      <button
        key={index}
        className={`
          relative aspect-square p-2 flex items-center justify-center text-lg font-medium
          ${!isCurrentMonth ? "text-gray-400" : "text-black"}
          ${isToday ? "text-white font-bold bg-black rounded-md" : ""}
          ${hasEntry ? "font-bold underline" : ""}
          ${dayOfWeek === 0 ? "text-red-500" : ""}
          ${dayOfWeek === 6 ? "text-blue-500" : ""}
          hover:bg-gray-100 transition-all
        `}
        onClick={() => navigateToDate(date)}
      >
        {date.getDate()}
      </button>
    );
  };

  // 📆 カレンダー全体の生成
  const renderCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - getDay(start));
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + (6 - getDay(end)));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="w-full max-w-lg mx-auto grid grid-cols-7 aspect-[1.4] bg-white rounded-lg p-2 shadow">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className={`py-2 text-center font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""
            }`}
          >
            {day}
          </div>
        ))}
        {days.map((date, index) => renderCalendarDay(date, index))}
      </div>
    );
  };

  // 📋 リスト表示
  const renderDiaryList = () => {
    const startOfCurrentMonth = startOfMonth(currentDate);
    const endOfCurrentMonth = endOfMonth(currentDate);

    const filtered = diaryEntries
      .filter((entry) => {
        const entryDate =
          typeof entry.date === "string"
            ? new Date(entry.date)
            : new Date(entry.date._seconds * 1000);

        return (
          entryDate >= startOfCurrentMonth &&
          entryDate <= endOfCurrentMonth &&
          (isPublicView ? entry.isPublic : true)
        );
      })
      .sort((a, b) => {
        const dateA = typeof a.date === "string" ? new Date(a.date) : new Date(a.date._seconds * 1000);
        const dateB = typeof b.date === "string" ? new Date(b.date) : new Date(b.date._seconds * 1000);
        return dateB.getTime() - dateA.getTime();
      });

    if (filtered.length === 0) {
      return <div className="text-center text-gray-500">この月には日記がありません</div>;
    }

    return (
      <div className="grid gap-4">
        {filtered.map((entry) => {
          const entryDate = typeof entry.date === "string"
            ? new Date(entry.date)
            : new Date(entry.date._seconds * 1000);

          return (
            <Card key={entry.id} className="hover:shadow-lg cursor-pointer" onClick={() => navigateToDate(entryDate)}>
              <CardContent className="p-4 flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">
                    {format(entryDate, "yyyy年M月d日（E）", { locale: ja })}
                  </div>
                  <div className="text-lg font-semibold truncate">
                    {entry.content.slice(0, 30)}...
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <span>{entry.weather === "sunny" ? "☀️" : entry.weather === "cloudy" ? "☁️" : "🌧️"}</span>
                    <span>{entry.mood === "good" ? "😊" : entry.mood === "neutral" ? "😐" : "😞"}</span>
                  </div>
                </div>
                <div>
                  {entry.isPublic ? (
                    <span className="text-green-600 text-xs border border-green-500 px-2 py-1 rounded-full">公開</span>
                  ) : (
                    <span className="text-gray-500 text-xs border border-gray-400 px-2 py-1 rounded-full">非公開</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">日記</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}>
            <List className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsPublicView(!isPublicView)}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>&lt;</Button>
              <h2 className="text-xl font-medium">
                {format(currentDate, "M月 yyyy", { locale: ja })}
              </h2>
              <Button variant="ghost" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>&gt;</Button>
            </div>

            {viewMode === "calendar" ? renderCalendarDays() : renderDiaryList()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
