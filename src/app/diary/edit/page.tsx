"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ArrowLeft,
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  Snowflake,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

import {
  fetchDiaryEntryByDate,
  createDiaryEntry,
  updateDiaryEntry,
} from "@/lib/firebase";
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

export default function DiaryEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const { user } = useUser();
  const userId = user?.uid;

  // 状態管理
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState<DiaryEntry["weather"]>("sunny");
  const [mood, setMood] = useState<DiaryEntry["mood"]>("good");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    const loadDiaryEntry = async () => {
      if (!userId || !date) return;

      try {
        setLoading(true);
        const diaryEntry = await fetchDiaryEntryByDate(userId, date);

        if (diaryEntry) {
          setEntry({
            ...diaryEntry,
            isPublic: diaryEntry.isPublic ?? false,
            isLiked: diaryEntry.isLiked ?? false,
          });
          setContent(diaryEntry.content);
          setWeather(diaryEntry.weather);
          setMood(diaryEntry.mood);
          setTags(diaryEntry.tags.join(", "));
          setImages(diaryEntry.images ?? []);
          setIsPublic(diaryEntry.isPublic ?? false);
        }
      } catch (err) {
        console.error("Error fetching diary entry:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDiaryEntry();
  }, [date, userId]);

  // 保存処理
  const handleSave = async () => {
    if (!userId || !date) return;

    try {
      setSaving(true);

      const tagArray = tags
        .split(/[,、]/)
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (entry) {
        await updateDiaryEntry(userId, entry.id, {
          content,
          weather,
          mood,
          tags: tagArray,
          images,
          isPublic,
        });
      } else {
        await createDiaryEntry(userId, {
          date,
          content,
          weather,
          mood,
          tags: tagArray,
          images,
          isPublic,
          isLiked: false,
        });
      }

      router.replace(`/diary/${date}`);
    } catch (err) {
      console.error("Error saving diary entry:", err);
    } finally {
      setSaving(false);
    }
  };

  // 画像追加
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages([...images, ...files]);
    }
  };

  const weatherOptions = [
    { value: "sunny", icon: <Sun size={24} color="#FF9800" />, label: "晴れ" },
    { value: "cloudy", icon: <CloudSun size={24} color="#607D8B" />, label: "曇り" },
    { value: "rainy", icon: <CloudRain size={24} color="#2196F3" />, label: "雨" },
    { value: "partlyCloudy", icon: <Cloud size={24} color="#78909C" />, label: "曇り" },
    { value: "snowy", icon: <Snowflake size={24} color="#90CAF9" />, label: "雪" },
  ];

  const moodOptions = [
    { value: "good", icon: "😊", label: "良い" },
    { value: "neutral", icon: "😐", label: "普通" },
    { value: "bad", icon: "😔", label: "悪い" },
  ];

  if (loading) {
    return <div className="text-center">データを読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <button className="p-2" onClick={() => router.replace("/")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">
          {format(new Date(date || ""), "yyyy年MM月dd日", { locale: ja })} の日記
        </h1>
        <button
          className="px-4 py-2 bg-black text-white rounded-md"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      {/* 天気と気分 */}
      <section className="mb-4">
        <h2 className="text-lg font-bold">今日の天気と気分</h2>
        <div className="flex gap-2 mt-2">
          {weatherOptions.map((option) => (
            <button
              key={option.value}
              className={`p-2 rounded-md ${
                weather === option.value ? "bg-gray-300" : "bg-gray-100"
              }`}
              onClick={() => setWeather(option.value as DiaryEntry["weather"])}
            >
              {option.icon}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              className={`p-2 rounded-md ${
                mood === option.value ? "bg-gray-300" : "bg-gray-100"
              }`}
              onClick={() => setMood(option.value as DiaryEntry["mood"])}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* 日記内容 */}
      <textarea
        className="w-full h-40 p-2 border rounded-md"
        placeholder="今日あったことを書いてみましょう..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* タグ */}
      <input
        className="w-full p-2 border rounded-md mt-2"
        placeholder="タグをカンマ区切りで入力 (例: 旅行, 食事, 仕事)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* 画像アップロード */}
      <div className="mt-4">
        <label className="cursor-pointer flex items-center gap-2 border rounded-md p-2">
          <ImageIcon size={24} />
          <span>画像を追加</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {images.map((img, i) => (
            <Image
              key={i}
              src={img}
              alt="日記画像"
              width={100}
              height={100}
              className="rounded-md"
            />
          ))}
        </div>
      </div>

      {/* 公開設定 */}
      <div className="flex items-center gap-2 mt-4">
        <label htmlFor="public-toggle" className="text-sm font-medium">
          公開する
        </label>
        <input
          id="public-toggle"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-5 h-5"
        />
        <span className="text-sm text-gray-600">
          {isPublic ? "公開する" : "非公開にする"}
        </span>
      </div>
    </div>
  );
}
