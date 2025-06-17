import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import { getAllScenarios } from './scenario-parser.js';

dotenv.config();

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
    const { count, error } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true });

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
    const { data, error } = await supabase
      .from('responses')
      .select('session_id, created_at')
      .order('created_at', { ascending: false });

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

    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

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

// ENDPOINT 5: ניתוח תשובות (שלב 1 - שליפת נתונים)
app.post('/api/analyze', async (req, res) => {
  try {
    console.log("Received request to /api/analyze");

    // שלב 1: שליפת כל התגובות של המשתמשים מהדאטהבייס
    const { data: userResponses, error } = await supabase
      .from('responses')
      .select('content, scenario_id') // ניקח רק את התוכן והתרחיש
      .eq('role', 'user'); // נסנן רק תגובות של משתמשים

    if (error) {
      throw error; // אם יש שגיאה בשליפה, נעצור כאן
    }

    // כרגע, רק נחזיר הודעה שהצלחנו לשלוף את הנתונים
    // בשלב הבא נשלח את המידע הזה ל-OpenAI
    res.json({
      message: `Successfully retrieved ${userResponses.length} user responses. AI analysis will be implemented in the next step.`
    });

  } catch (error) {
    console.error('Error in /api/analyze endpoint:', error.message);
    res.status(500).json({ error: 'Failed to analyze responses' });
  }
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
