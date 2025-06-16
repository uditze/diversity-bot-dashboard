document.addEventListener('DOMContentLoaded', () => {
  fetchMetrics();
  fetchSessions();
});

// פונקציה לקבלת מדדים (ללא שינוי)
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

// ✅ פונקציה מעודכנת לשליפת רשימת השיחות
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
    let sessionsHtml = '<ul class="sessions-list">';
    for (const session of sessions) {
      const formattedDate = new Date(session.last_activity).toLocaleString('he-IL');
      
      // יצירת קישור שפותח דף חדש ומעביר את מזהה השיחה ב-URL
      sessionsHtml += `
        <li>
          <a href="conversation.html?session_id=${session.session_id}" target="_blank">
            שיחה מתאריך: ${formattedDate}
          </a>
        </li>
      `;
    }
    sessionsHtml += '</ul>';
    
    sessionsContainer.innerHTML = sessionsHtml;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    sessionsContainer.innerHTML = `<p>שגיאה בטעינת רשימת השיחות.</p>`;
  }
}
