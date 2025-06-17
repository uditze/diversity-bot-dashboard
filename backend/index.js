import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { supabase } from './supabaseClient.js';
import { getAllScenarios } from './scenario-parser.js';

dotenv.config();

// --- הגדרת לקוח OpenAI ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// הגדרות CORS
const corsOptions = {
  origin: 'https://diversity-bot-dashboard.onrender.com'
};
app.use(cors(corsOptions));

app.use(express.json());

// ENDPOINT 1: קבלת מדדים בסיסיים
app.get('/api/metrics', async (req, res) => {
  try {
    const { count, error } = await supabase.from('responses').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ totalInteractions: count });
  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ENDPOINT 2: קבלת רשימת כל השיחות
app.get('/api/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('responses').select('session_id, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    const uniqueSessions = [];
    const seenSessionIds = new Set();
    for (const response of data) {
      if (!seenSessionIds.has(response.session_id)) {
        seenSessionIds.add(response.session_id);
        uniqueSessions.push({ session_id: response.session_id, last_activity: response.created_at });
      }
    }
    res.json(uniqueSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ENDPOINT 3: קבלת כל ההודעות של שיחה ספציפית
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data, error } = await supabase.from('responses').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(`Error fetching session ${req.params.sessionId}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

// ENDPOINT 4: קבלת כל התרחישים
app.get('/api/scenarios', (req, res) => {
  try {
    const scenarios = getAllScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error.message);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// ENDPOINT 5: ניתוח תשובות (שלב 2 - חיבור ל-AI)
app.post('/api/analyze', async (req, res) => {
  try {
    const { question } = req.body; // קבלת השאלה מהפרונטאנד
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. שליפת כל תגובות המשתמשים
    const { data: userResponses, error: dbError } = await supabase.from('responses').select('content, scenario_id').eq('role', 'user');
    if (dbError) throw dbError;

    // 2. שליפת כל התרחישים כדי לתת הקשר
    const scenarios = getAllScenarios();

    // 3. בניית ההנחיה (Prompt) למודל ה-AI
    let dataForPrompt = '';
    scenarios.forEach(scenario => {
      const responsesForScenario = userResponses.filter(r => r.scenario_id === scenario.id).map(r => `- ${r.content}`).join('\n');
      if (responsesForScenario) {
        dataForPrompt += `התגובות לתרחיש ${scenario.id + 1} (${scenario.he.substring(0, 50)}...):\n${responsesForScenario}\n\n`;
      }
    });

    const systemPrompt = `אתה עוזר מחקר המתמחה בניתוח נתונים איכותניים מתחום החינוך. עליך לענות על שאלת המשתמש אך ורק על סמך הנתונים המסופקים לך. אל תמציא מידע. סכם את הממצאים וכתוב את התשובה בעברית, בצורה ברורה ומובנית.`;
    const userPrompt = `השאלה לניתוח היא: "${question}"\n\nלהלן הנתונים - אוסף תגובות של מרצים לתרחישים שונים:\n\n${dataForPrompt}`;

    // 4. שליחת הבקשה ל-OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const analysisResult = completion.choices[0].message.content;

    // 5. החזרת התשובה לפרונטאנד
    res.json({ analysis: analysisResult });

  } catch (error) {
    console.error('Error in /api/analyze endpoint:', error.message);
    res.status(500).json({ error: 'Failed to analyze responses' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
