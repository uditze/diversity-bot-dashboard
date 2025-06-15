document.addEventListener('DOMContentLoaded', () => {
  // קריאה לשתי הפונקציות בעת טעינת הדף
  fetchMetrics();
  fetchSessions();
});

// פונקציה זו נשארת כפי שהייתה
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

// ✅ פונקציה חדשה לשליפת רשימת השיחות
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

    // יצירת רשימה של השיחות
    let sessionsHtml = '<ul>';
    for (const session of sessions) {
      // פורמט יפה יותר לתאריך
      const formattedDate = new Date(session.last_activity).toLocaleString('he-IL');
      sessionsHtml += `<li>שיחה מתאריך: ${formattedDate} (ID: ${session.session_id})</li>`;
    }
    sessionsHtml += '</ul>';
    
    sessionsContainer.innerHTML = sessionsHtml;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    sessionsContainer.innerHTML = `<p>שגיאה בטעינת רשימת השיחות.</p>`;
  }
}
