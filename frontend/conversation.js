document.addEventListener('DOMContentLoaded', () => {
  // קריאת מזהה השיחה משורת הכתובת של הדפדפן
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    fetchAndDisplayConversation(sessionId);
  } else {
    const container = document.getElementById('chat-view-container');
    container.innerHTML = '<p>שגיאה: לא סופק מזהה שיחה.</p>';
  }
});

async function fetchAndDisplayConversation(sessionId) {
  const API_URL = 'https://dashboard-backend-l9uh.onrender.com';
  const container = document.getElementById('chat-view-container');

  try {
    const response = await fetch(`<span class="math-inline">\{API\_URL\}/api/sessions/</span>{sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch conversation');

    const messages = await response.json();

    container.innerHTML = ''; // ניקוי הודעת "טוען שיחה"

    if (messages.length === 0) {
      container.innerHTML = '<p>לא נמצאו הודעות עבור שיחה זו.</p>';
      return;
    }

    // יצירת אלמנטים עבור כל הודעה בשיחה
    messages.forEach(message => {
      const messageDiv = document.createElement('div');
      // הוספת קלאס לפי התפקיד (user או bot)
      messageDiv.className = `message ${message.role}`; 
      messageDiv.innerText = message.content;
      container.appendChild(messageDiv);
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    container.innerHTML = `<p>שגיאה בטעינת השיחה.</p>`;
  }
}
