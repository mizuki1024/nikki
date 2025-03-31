"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
} from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("正しいメールアドレスを入力してください");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!validateForm()) return;

    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    try {
      await loginWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Googleログイン中にエラーが発生しました";
      setError(message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">
        {isRegister ? "新規登録" : "ログイン"}
      </h1>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />

      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded w-64"
      >
        {isRegister ? "登録する" : "ログインする"}
      </button>

      <div className="text-gray-500 text-sm">または</div>

      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white px-4 py-2 rounded w-64"
      >
        Googleでログイン
      </button>

      <p
        className="text-sm text-gray-600 cursor-pointer"
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister
          ? "すでにアカウントをお持ちの方はこちら"
          : "アカウントを作成する"}
      </p>
    </div>
  );
}
