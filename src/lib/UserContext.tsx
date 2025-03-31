// src/lib/UserContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

// ユーザーコンテキストの型
interface UserContextType {
  user: User | null;
  loading: boolean;
}

// デフォルト値（未ログイン & 認証中）
const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

// ユーザー状態をアプリ全体に提供するプロバイダー
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebaseの認証状態を監視
    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // コンポーネントのアンマウント時に監視を解除
    return () => unsubscribeFromAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Contextを使うためのカスタムフック
export const useUser = () => useContext(UserContext);
