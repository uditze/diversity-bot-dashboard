import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { supabase } from './supabaseClient.js';
import { getAllScenarios } from './scenario-parser.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

const corsOptions = {
  origin: 'https://diversity-bot-dashboard.onrender.com'
};
app.use(cors(corsOptions));

app.use(express.json());

// ENDPOINT 1: קבלת מדדים בסיסיים (מתוקן)
app.get('/api/metrics', async (req, res) => {
  try {
    // --- התיקון נמצא כאן ---

    // 1. חישוב סך האינטראקציות (הדרך היעילה)
    const { count: totalInteractions, error: countError } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // 2. חישוב סך השיחות (הדרך היעילה)
    // שים לב: אנו משתמשים בפונקציה של מסד הנתונים כדי לספור מזהים ייחודיים
    const { data: sessionsData, error: sessionsError } = await supabase.rpc('get_unique_session_count');
    
    if (sessionsError) {
        // אם ה-RPC נכשל, נשתמש בדרך הגיבוי הישנה יותר
        console.warn('RPC failed, falling back to client-side count. Error:', sessionsError.message);
        const { data: fallbackData, error: fallbackError } = await supabase.from('responses').select('session_id');
        if(fallbackError) throw fallbackError;
        const totalSessions = new Set(fallbackData.map(item => item.session_id)).size;
        res.json({ totalInteractions, totalSessions });
        return;
    }
    
    const totalSessions = sessionsData;

    // החזרת אובייקט עם שני הנתונים
    res.json({ totalInteractions, totalSessions });

  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// שאר הקובץ נשאר זהה...
app.get('/api/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('responses').select('session_id, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    
    const uniqueSessions = [];
    const seenSessionIds = new Set();

    for (const response of data) {
      if (!seenSessionIds.has(response.session_id)) {
        seenSessionIds.add(response.session_id);
        uniqueSessions.push({
          session_id: response.session_id,
          last_activity: response.created_at,
        });
      }
    }
    
    const limitedSessions = uniqueSessions.slice(0, 10);
    res.json(limitedSessions);

  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

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

app.get('/api/scenarios', (req, res) => {
  try {
    const scenarios = getAllScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error.message);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const { data: userResponses, error: dbError } = await supabase.from('responses').select('content, scenario_id').eq('role', 'user');
    if (dbError) throw dbError;
    const scenarios = getAllScenarios();
    let dataForPrompt = '';
    scenarios.forEach(scenario => {
      const responsesForScenario = userResponses.filter(r => r.scenario_id === scenario.id).map(r => `- ${r.content}`).join('\n');
      if (responsesForScenario) {
        dataForPrompt += `התגובות לתרחיש ${scenario.id + 1} (${scenario.he.substring(0, 50)}...):\n${responsesForScenario}\n\n`;
      }
    });
    
    const systemPrompt = `אתה עוזר מחקר המתמחה בניתוח נתונים איכותניים מתחום החינוך. עליך לענות על שאלת המשתמש אך ורק על סמך הנתונים המסופקים לך. אל תמציא מידע. סכם את הממצאים וכתוב את התשובה בעברית, בצורה ברורה ומובנית.
חשוב מאוד: הקפד על פסקאות ברורות. השתמש ברווח של שורה (ירד שורה פעמיים) כדי להפריד בין נושאים שונים, נקודות עיקריות, או בין הדיון על תרחיש אחד למשנהו.`;
    
    const userPrompt = `השאלה לניתוח היא: "${question}"\n\nלהלן הנתונים - אוסף תגובות של מרצים לתרחישים שונים:\n\n${dataForPrompt}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });
    
    const analysisResult = completion.choices[0].message.content;
    res.json({ analysis: analysisResult });
    
  } catch (error) {
    console.error('Error in /api/analyze endpoint:', error.message);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
