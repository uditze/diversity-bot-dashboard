document.addEventListener('DOMContentLoaded', () => {
  fetchMetrics();
  fetchSessions();
  initializeAiAnalyzer();
});

async function fetchMetrics() {
  const API_URL = 'https://dashboard-backend-l9uh.onrender.com';
  const metricsContainer = document.getElementById('metrics-container');
  try {
    const response = await fetch(`${API_URL}/api/metrics`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    metricsContainer.innerHTML = `
      <h2>סה"כ אינטראקציות שנשמרו: <strong>${data.totalInteractions}</strong></h2>
    `;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    metricsContainer.innerHTML = `<p>שגיאה בטעינת הנתונים.</p>`;
  }
}

async function fetchSessions() {
  const API_URL = 'https://dashboard-backend-l9uh.onrender.com';
  const sessionsContainer = document.getElementById('sessions-list-container');
  try {
    const response = await fetch(`${API_URL}/api/sessions`);
    if (!response.ok) throw new Error('Network response was not ok');
    const sessions = await response.json();
    if (sessions.length === 0) {
      sessionsContainer.innerHTML = '<p>לא נמצאו שיחות שמורות.</p>';
      return;
    }
    const sessionLinks = sessions.map(session => {
      const formattedDate = new Date(session.last_activity).toLocaleString('he-IL');
      return `<li>
                <a href="conversation.html?session_id=${session.session_id}" target="_blank">
                  שיחה מתאריך: ${formattedDate} (ID: ...${session.session_id.slice(-6)})
                </a>
              </li>`;
    }).join('');
    sessionsContainer.innerHTML = `<ul class="sessions-list">${sessionLinks}</ul>`;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    sessionsContainer.innerHTML = `<p>שגיאה בטעינת רשימת השיחות.</p>`;
  }
}

// --- לוגיקה משודרגת עבור ה-AI Analyzer ---
function initializeAiAnalyzer() {
  const aiForm = document.getElementById('ai-analyzer-form');
  const aiQuestionInput = document.getElementById('ai-question');
  const aiResultContainer = document.getElementById('ai-result-container');
  const aiSubmitButton = aiForm.querySelector('button');

  // מערך שיחזיק את היסטוריית השיחה עם ה-AI
  let chatHistory = [];

  // פונקציה שמציירת מחדש את כל חלון הצ'אט על סמך ההיסטוריה
  function renderAiChat() {
    aiResultContainer.innerHTML = ''; // נקה את החלון
    chatHistory.forEach(message => {
      const messageDiv = document.createElement('div');
      // הוספת קלאסים לעיצוב: אחד כללי ואחד ספציפי
      messageDiv.className = `analyzer-message ${message.role === 'user' ? 'analyzer-user' : 'analyzer-ai'}`;
      messageDiv.textContent = message.content;
      aiResultContainer.appendChild(messageDiv);
    });
    // גלול לתחתית החלון כדי לראות את ההודעה האחרונה
    aiResultContainer.scrollTop = aiResultContainer.scrollHeight;
  }

  aiQuestionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      aiForm.requestSubmit();
    }
  });

  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = aiQuestionInput.value.trim();
    if (!question) return;

    // הוספת שאלת המשתמש להיסטוריה ורינדור מיידי
    chatHistory.push({ role: 'user', content: question });
    renderAiChat();
    aiQuestionInput.value = ''; // ניקוי תיבת הטקסט

    // חיווי טעינה
    aiSubmitButton.disabled = true;
    aiSubmitButton.textContent = 'מנתח...';
    
    const API_URL = 'https://dashboard-backend-l9uh.onrender.com';

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'תקלה בשרת');
      }

      const data = await response.json();
      // הוספת תשובת ה-AI להיסטוריה
      chatHistory.push({ role: 'ai', content: data.analysis });

    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
      // הוספת הודעת שגיאה להיסטוריה
      chatHistory.push({ role: 'ai', content: `אירעה שגיאה: ${error.message}` });
    } finally {
      // רינדור סופי של הצ'אט והחזרת הכפתור למצב פעיל
      renderAiChat();
      aiSubmitButton.disabled = false;
      aiSubmitButton.textContent = 'נתח תשובות';
    }
  });
}
