import { NextResponse } from "next/server";
import { fetchDiaryEntries, createDiaryEntry, updateDiaryEntry } from "@/lib/firebase";

// GET: 日記データを取得
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const entries = await fetchDiaryEntries(userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    return NextResponse.json({ error: "Failed to fetch diary entries" }, { status: 500 });
  }
}

// POST: 日記データを保存
export async function POST(req: Request) {
  const body = await req.json();
  const { userId, entry } = body;

  if (!userId || !entry) {
    return NextResponse.json({ error: "User ID and entry data are required" }, { status: 400 });
  }

  try {
    const entryId = await createDiaryEntry(userId, entry);
    return NextResponse.json({ success: true, entryId });
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return NextResponse.json({ error: "Failed to create diary entry" }, { status: 500 });
  }
}

// PUT: 日記データを更新
export async function PUT(req: Request) {
  const body = await req.json();
  const { userId, entryId, updatedData } = body;

  if (!userId || !entryId || !updatedData) {
    return NextResponse.json({ error: "User ID, entry ID, and updated data are required" }, { status: 400 });
  }

  try {
    const success = await updateDiaryEntry(userId, entryId, updatedData);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error updating diary entry:", error);
    return NextResponse.json({ error: "Failed to update diary entry" }, { status: 500 });
  }
}