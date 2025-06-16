import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createThreadAndSendMessage } from './assistant.js';
import { supabase } from './supabaseClient.js'; // ייבוא הלקוח של Supabase

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// זהו הנתיב היחיד שהצ'אטבוט המקורי צריך
app.post('/chat', async (req, res) => {
  try {
    const { message, thread_id, language, gender } = req.body;

    // שלב 1: שמירת הודעת המשתמש במסד הנתונים
    await supabase
      .from('responses')
      .insert([{ 
        session_id: thread_id, 
        role: 'user', 
        content: message, 
        language: language 
      }]);
    console.log('✅ Chatbot: User response saved to Supabase.');

    // שלב 2: קבלת תגובה מה-Assistant
    const { reply, newThreadId } = await createThreadAndSendMessage({
      message, thread_id, language, gender,
    });
    
    // שלב 3: שמירת תגובת הבוט במסד הנתונים
    if (reply) {
      await supabase
        .from('responses')
        .insert([{ 
          session_id: thread_id, 
          role: 'bot', 
          content: reply, 
          language: language 
        }]);
      console.log('✅ Chatbot: Bot response saved to Supabase.');
    }
    
    // שלב 4: שליחת התגובה חזרה למשתמש
    res.json({ reply, thread_id: newThreadId || thread_id });
    
  } catch (err) {
    console.error('Error in /chat handler:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Original chatbot server running on port ${PORT}`);
});
