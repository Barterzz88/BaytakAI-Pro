import { Request, Response } from 'express';

const apiKey = process.env.GEMINI_API_KEY || '';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

const searchSchema = {
  type: "OBJECT",
  properties: {
    "location": { "type": "STRING" },
    "type": { "type": "STRING", "enum": ["apartment", "villa", "chalet", "office", "land"] },
    "beds": { "type": "NUMBER" },
    "maxPrice": { "type": "NUMBER" },
    "features": { "type": "ARRAY", "items": { "type": "STRING" } }
  }
};

export const parseSearch = async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });
  try {
    const payload = {
      contents: [{ parts: [{ text: query }]}],
      systemInstruction: { parts: [{ text: 'Parse user query into the given JSON schema' }] },
      generationConfig: { responseMimeType: "application/json", responseSchema: searchSchema }
    };
    const r = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error('Gemini failed');
    const result = await r.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(jsonText);
    res.json({ searchParams: parsed });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ message: 'AI parse failed' });
  }
};

export const generateDescription = async (req: Request, res: Response) => {
  const { title, bulletPoints } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  try {
    const prompt = `Write a professional property description for "${title}". Use these points: ${JSON.stringify(bulletPoints||[])}.`;
    const payload = { contents: [{ parts: [{ text: prompt }]}], generationConfig: { temperature: 0.2 } };
    const r = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error('Gemini failed');
    const result = await r.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ description: text });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ message: 'AI generation failed' });
  }
};