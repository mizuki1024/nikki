"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Heart, Edit2, CloudRain, Sun, CloudSun } from "lucide-react";
import Image from "next/image";
import { useUser } from "../../../lib/UserContext";

// 型定義
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

export default function DiaryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const date = typeof params.date === "string" ? params.date : null;

  const { user, loading: userLoading } = useUser();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得処理
  useEffect(() => {
    if (userLoading) return;

    const loadDiaryEntry = async () => {
      if (!user?.uid || !date) {
        console.warn("⚠️ userId または date が null のため、データ取得をスキップ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/diary?userId=${user.uid}`);
        if (!res.ok) {
          throw new Error("日記データの取得に失敗しました");
        }
        const diaryEntries = await res.json();

        // 指定された日付に一致する日記データを取得
        const diaryEntry = diaryEntries.find(
          (entry: DiaryEntry) =>
            typeof entry.date === "string"
              ? entry.date === date
              : format(new Date(entry.date._seconds * 1000), "yyyy-MM-dd") === date
        );

        if (diaryEntry) {
          setEntry({ ...diaryEntry, isPublic: false, isLiked: false });
        } else {
          router.replace(`/diary/edit?date=${date}`);
        }
      } catch (err) {
        console.error("❌ Error fetching diary entry:", err);
        setError("日記データの読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadDiaryEntry();
  }, [userLoading, user?.uid, date, router]);

  useEffect(() => {
    console.log("Entry data:", entry);
  }, [entry]);

  // 表示アイコン
  const renderWeatherIcon = (weather: DiaryEntry["weather"]) => {
    const iconProps = { size: 24 };
    switch (weather) {
      case "sunny": return <Sun {...iconProps} color="#FF9800" />;
      case "cloudy": return <CloudSun {...iconProps} color="#607D8B" />;
      case "rainy": return <CloudRain {...iconProps} color="#2196F3" />;
      default: return <Sun {...iconProps} color="#FF9800" />;
    }
  };

  const renderMoodIcon = (mood: DiaryEntry["mood"]) => {
    const icons = {
      good: "😊",
      neutral: "😐",
      bad: "😔"
    };
    return <span className="text-2xl">{icons[mood] || "😊"}</span>;
  };

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Firestore の更新処理を実装
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!entry) return null;

  const formattedDate = entry?.date
    ? format(
        new Date(
          typeof entry.date === "string"
            ? entry.date
            : entry.date._seconds * 1000 || Date.now() // 安全にデフォルト値を設定
        ),
        "yyyy年MM月dd日",
        { locale: ja }
      )
    : "日付不明"; // entry.date がない場合のフォールバック

  return (
    <div className="min-h-screen bg-white">
      
      {/* ヘッダー */}
      <div className="flex items-center p-6 border-b">
        <button className="p-2" onClick={() => router.push("/")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-center">
          {formattedDate} の日記
        </h1>
      </div>

      {/* 本文 */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            {renderWeatherIcon(entry.weather)}
            {renderMoodIcon(entry.mood)}
          </div>
        </div>

        <p className="text-lg leading-relaxed">{entry.content}</p>

        {/* 画像表示 */}
        {entry.images && entry.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {entry.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                width={200}
                height={200}
                alt={`diary-image-${index}`}
                className="rounded-md"
              />
            ))}
          </div>
        )}

        {/* タグ表示 */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {entry.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-blue-600 px-3 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ボタン表示 */}
        <div className="flex justify-between items-center mt-6">
          <button
            className={`flex items-center space-x-2 px-4 py-2 border rounded-md ${
              liked ? "bg-red-500 text-white" : "border-red-500 text-red-500"
            }`}
            onClick={handleLike}
          >
            <Heart size={20} />
            <span>{liked ? "いいね済み" : "いいね"}</span>
          </button>

          <button
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-md"
            onClick={() => router.push(`/diary/edit?date=${date}`)}
          >
            <Edit2 size={20} />
            <span>編集</span>
          </button>
        </div>
      </div>
    </div>
  );
}
