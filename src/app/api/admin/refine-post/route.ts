import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const { content, instruction } = await req.json();
  if (!content || !instruction) {
    return NextResponse.json({ error: "Content and instruction required" }, { status: 400 });
  }

  const prompt = `You are editing a LinkedIn post for a software engineering job board called Reblet. Here is the current post:

---
${content}
---

The user wants you to: ${instruction}

Rules:
- Return ONLY the updated post text, nothing else
- Do NOT use any markdown formatting (no **, no [], no () links). Write plain text only.
- Keep the same general structure unless the user asks to change it
- Links should be plain URLs on their own line

Return the updated post:`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    return NextResponse.json({ error: "Failed to refine post" }, { status: 500 });
  }

  const data = await aiRes.json();
  const refined = data.choices?.[0]?.message?.content || "";

  return NextResponse.json({ content: refined });
}
