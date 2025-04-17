export const fetchDiaryEntriesAPI = async (userId: string) => {
  const res = await fetch(`/api/diary?userId=${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch diary entries");
  }
  return res.json();
};

export const createDiaryEntryAPI = async (userId: string, entry: any) => {
  const res = await fetch(`/api/diary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, entry }),
  });
  if (!res.ok) {
    throw new Error("Failed to create diary entry");
  }
  return res.json();
};

export const updateDiaryEntryAPI = async (userId: string, entryId: string, updatedData: any) => {
  const res = await fetch(`/api/diary`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, entryId, updatedData }),
  });
  if (!res.ok) {
    throw new Error("Failed to update diary entry");
  }
  return res.json();
};