import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { supabase } from './supabaseClient.js';
import { createThreadAndSendMessage } from './assistant.js';
import { getNextScenario } from './scenarios.js';

dotenv.config();

const app = express();
app.use(cors());
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

// ENDPOINT 3: השרת הראשי של הצ'אטבוט המקורי
app.post('/chat', async (req, res) => {
  try {
    const { message, thread_id, language, gender } = req.body;

    // --- שמירת הודעת המשתמש ---
    const { error: userError } = await supabase
      .from('responses')
      .insert([{ 
        session_id: thread_id, 
        role: 'user', 
        content: message, 
        language: language 
      }]);
    if (userError) console.error('Supabase insert error (user):', userError.message);
    else console.log('✅ User response saved to Supabase.');
    // ----------------------------

    const { reply } = await createThreadAndSendMessage({
      message, thread_id, language, gender,
    });
    
    // --- שמירת תגובת הבוט ---
    if (reply) {
      const { error: botError } = await supabase
        .from('responses')
        .insert([{ 
          session_id: thread_id, 
          role: 'bot', 
          content: reply, 
          language: language 
        }]);
      if (botError) console.error('Supabase insert error (bot):', botError.message);
      else console.log('✅ Bot response saved to Supabase.');
    }
    // -------------------------
    
    res.json({ reply, thread_id: thread_id });
  } catch (err) {
    console.error('Error handling /chat:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
