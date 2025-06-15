import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// יצירת נקודת קצה (API Endpoint) ראשונה
// היא תחזיר את סך כל התגובות שנשמרו במסד הנתונים
app.get('/api/metrics', async (req, res) => {
  try {
    // ביצוע שאילתה לספירת כל השורות בטבלת 'responses'
    const { count, error } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error; // זריקת השגיאה לבלוק ה-catch
    }

    res.json({ totalInteractions: count });
  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
