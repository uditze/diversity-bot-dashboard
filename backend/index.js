import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

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

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
