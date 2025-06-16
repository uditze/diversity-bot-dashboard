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

    // שימוש בשיטה בטוחה יותר ליצירת רשימת הקישורים
    const sessionLinks = sessions.map(session => {
      const formattedDate = new Date(session.last_activity).toLocaleString('he-IL');
      // כל פריט ברשימה הוא קישור שפותח את דף השיחה בכרטיסייה חדשה
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
