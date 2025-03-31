// Firebase core
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase Auth
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";

// Firebase Firestore
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化（多重初期化を防止）
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();


// ========================================
// 🔐 Google ログイン処理
// ========================================
export const loginWithGoogle = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Google ログイン成功:", result.user);
    return result.user;
  } catch (error) {
    console.error("🔥 Google ログインエラー:", error);
    return null;
  }
};

// ✨ メールアドレスでユーザー登録
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ 新規登録成功:", result.user);
    return result.user;
  } catch (error) {
    console.error("❌ 登録エラー:", error);
    throw error;
  }
};

// ✨ メールアドレスでログイン
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ ログイン成功:", result.user);
    return result.user;
  } catch (error) {
    console.error("❌ ログインエラー:", error);
    throw error;
  }
};


// ========================================
// 🚪 ログアウト処理
// ========================================
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("👋 ログアウトしました");
  } catch (error) {
    console.error("🚨 ログアウトエラー:", error);
  }
};


// ========================================
// 👤 ユーザー情報を Firestore に保存
// ========================================
export const handleUserDocument = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      username: user.displayName || "未設定",
      createdAt: new Date(),
    });
    console.log("✅ Firestore にユーザー情報を保存しました");
  }
};


// ========================================
// 👀 認証状態の監視
// ========================================
export const monitorAuthState = (callback: (user: User | null) => void) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await handleUserDocument(user);
    }
    callback(user);
  });
};


// ========================================
// 📘 型定義：日記エントリー
// ========================================
interface DiaryEntry {
  isLiked: boolean;
  isPublic: boolean;
  id: string;
  date: string | { _seconds: number };
  content: string;
  images: string[];
  tags: string[];
  weather: "sunny" | "cloudy" | "rainy";
  mood: "good" | "neutral" | "bad";
  userId: string;
}


// ========================================
// 📥 日記エントリー一覧を取得
// ========================================
export const fetchDiaryEntries = async (userId: string) => {
  if (!userId) throw new Error("User ID is required");

  const entriesRef = collection(db, `diaries/${userId}/entries`);
  const querySnapshot = await getDocs(entriesRef);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};


// ========================================
// 📅 特定日付の日記エントリーを取得
// ========================================
export const fetchDiaryEntryByDate = async (
  userId: string,
  date: string
): Promise<DiaryEntry | null> => {
  try {
    const entriesRef = collection(db, `diaries/${userId}/entries`);
    const q = query(entriesRef, where("date", "==", date));
    const snapshot = await getDocs(q);

    console.log("📡 Fetching diary entry:", userId, date);

    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DiaryEntry;
    }

    return null;
  } catch (error) {
    console.error("❌ fetchDiaryEntryByDate Error:", error);
    return null;
  }
};


// ========================================
// 🆕 日記エントリーを新規作成
// ========================================
export const createDiaryEntry = async (
  userId: string,
  entry: Omit<DiaryEntry, "id" | "userId">
): Promise<string | null> => {
  try {
    const entriesRef = collection(db, `diaries/${userId}/entries`);
    const docRef = await addDoc(entriesRef, {
      ...entry,
      userId,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("❌ createDiaryEntry Error:", error);
    return null;
  }
};


// ========================================
// ✏️ 日記エントリーを更新
// ========================================
export const updateDiaryEntry = async (
  userId: string,
  entryId: string,
  updatedData: Partial<DiaryEntry>
): Promise<boolean> => {
  try {
    const entryRef = doc(db, `diaries/${userId}/entries`, entryId);
    await updateDoc(entryRef, updatedData);
    return true;
  } catch (error) {
    console.error("❌ updateDiaryEntry Error:", error);
    return false;
  }
};
