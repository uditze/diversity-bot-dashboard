import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createThreadAndSendMessage } from './assistant.js';
import { supabase } from './supabaseClient.js'; // ייבוא הלקוח החדש

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const { message, thread_id, language, gender } = req.body;

    // שמירת הודעת המשתמש
    await supabase
      .from('responses')
      .insert([{ session_id: thread_id, role: 'user', content: message, language: language }]);
    console.log('✅ Original bot: User response saved to Supabase.');

    const { reply, newThreadId } = await createThreadAndSendMessage({
      message, thread_id, language, gender,
    });

    // שמירת תגובת הבוט
    if (reply) {
      await supabase
        .from('responses')
        .insert([{ session_id: thread_id, role: 'bot', content: reply, language: language }]);
      console.log('✅ Original bot: Bot response saved to Supabase.');
    }

    res.json({ reply, thread_id: newThreadId || thread_id });
  } catch (err) {
    console.error('Error in original bot /chat handler:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// אין צורך יותר בנתיבים הישנים כמו /scenario או /start-session בבוט הזה

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Original chatbot server running on port ${PORT}`);
});
