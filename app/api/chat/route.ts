import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages } = await request.json();
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ message: "AI-avain puuttuu palvelinympäristöstä." }, { status: 503 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [{ role: "system", content: "Olet TB AI Assistant, LVI-Valvonta T.B:n suomenkielinen avustaja. Ole käytännöllinen, täsmällinen ja kerro, kun tarvitset lisätietoja. Älä keksi teknisiä tai sopimusoikeudellisia faktoja." }, ...messages],
    temperature: 0.3
  });
  return NextResponse.json({ message: result.choices[0]?.message.content ?? "En saanut vastausta." });
}
