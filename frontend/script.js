document.addEventListener('DOMContentLoaded', () => {
  // קריאה לפונקציות הקיימות בעת טעינת הדף
  fetchMetrics();
  fetchSessions();

  // --- הפעלת הלוגיקה של טופס ה-AI ---
  initializeAiAnalyzer();
});

// פונקציה לקבלת מדדים
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

// פונקציה לשליפת רשימת השיחות
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

    // יצירת רשימת קישורים לכל שיחה
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

// --- חדש: פונקציה המכילה את כל הלוגיקה של ניתוח ה-AI ---
function initializeAiAnalyzer() {
  const aiForm = document.getElementById('ai-analyzer-form');
  const aiQuestionInput = document.getElementById('ai-question');
  const aiResultContainer = document.getElementById('ai-result-container');
  const aiSubmitButton = aiForm.querySelector('button');

  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // מניעת רענון הדף

    const question = aiQuestionInput.value.trim();
    if (!question) {
      aiResultContainer.textContent = 'נא להזין שאלה.';
      return;
    }

    // שלב 1: הצגת חיווי טעינה למשתמש
    aiResultContainer.innerHTML = '<p>מעבד את הבקשה... תהליך זה עשוי לקחת כדקה, נא להמתין.</p>';
    aiSubmitButton.disabled = true;
    aiSubmitButton.textContent = 'מנתח...';

    const API_URL = 'https://dashboard-backend-l9uh.onrender.com';

    try {
      // שלב 2: שליחת השאלה לשרת
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'תקלה בשרת');
      }

      // שלב 3: הצלחה - הצגת התשובה שהתקבלה מה-AI
      const data = await response.json();
      aiResultContainer.textContent = data.analysis;

    } catch (error) {
      // שלב 4: כשלון - הצגת הודעת שגיאה
      console.error('Failed to fetch AI analysis:', error);
      aiResultContainer.textContent = `אירעה שגיאה: ${error.message}`;
    } finally {
      // שלב 5: החזרת הכפתור למצב פעיל, בין אם הבקשה הצליחה או נכשלה
      aiSubmitButton.disabled = false;
      aiSubmitButton.textContent = 'נתח תשובות';
    }
  });
}
