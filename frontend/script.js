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

function initializeAiAnalyzer() {
  const aiForm = document.getElementById('ai-analyzer-form');
  const aiQuestionInput = document.getElementById('ai-question');
  const aiResultContainer = document.getElementById('ai-result-container');
  const aiSubmitButton = aiForm.querySelector('button');

  // --- התוספת החדשה ---
  // הוספת מאזין ללחיצה על מקשים בתיבת הטקסט
  aiQuestionInput.addEventListener('keydown', (e) => {
    // בדוק אם המקש שנלחץ הוא Enter ושהמקש Shift אינו לחוץ
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // מנע ברירת מחדל (יצירת שורה חדשה)
      aiForm.requestSubmit(); // שלח את הטופס באופן תכנותי
    }
  });
  // --- סוף התוספת ---

  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = aiQuestionInput.value.trim();
    if (!question) {
      aiResultContainer.textContent = 'נא להזין שאלה.';
      return;
    }
    aiResultContainer.innerHTML = '<p>מעבד את הבקשה... תהליך זה עשוי לקחת כדקה, נא להמתין.</p>';
    aiSubmitButton.disabled = true;
    aiSubmitButton.textContent = 'מנתח...';
    const API_URL = 'https://dashboard-backend-l9uh.onrender.com';
    try {
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
      const data = await response.json();
      aiResultContainer.textContent = data.analysis;
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
      aiResultContainer.textContent = `אירעה שגיאה: ${error.message}`;
    } finally {
      aiSubmitButton.disabled = false;
      aiSubmitButton.textContent = 'נתח תשובות';
    }
  });
}
