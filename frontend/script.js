document.addEventListener('DOMContentLoaded', () => {
  fetchMetrics();
  fetchSessions();
  initializeAiAnalyzer();
});

async function fetchMetrics() {
  const API_URL = 'https://dashboard-backend-l9uh.onrender.com';
  const interactionCountContainer = document.getElementById('interaction-count-container');
  const sessionCountContainer = document.getElementById('session-count-container');

  try {
    const response = await fetch(`${API_URL}/api/metrics`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();

    sessionCountContainer.innerHTML = `
      <h2>מספר שיחות של משתמשים עם הבוט</h2>
      <strong class="metrics-number">${data.totalSessions}</strong>
    `;
    
    interactionCountContainer.innerHTML = `
      <h2>מספר האינטראקציות עם הבוט</h2>
      <strong class="metrics-number">${data.totalInteractions}</strong>
    `;

  } catch (error) {
    const errorMessage = `<p>שגיאה בטעינת הנתונים.</p>`;
    // ודא שהאלמנטים קיימים לפני שמנסים לשנות אותם
    if(interactionCountContainer) interactionCountContainer.innerHTML = errorMessage;
    if(sessionCountContainer) sessionCountContainer.innerHTML = errorMessage;
    console.error('Failed to fetch metrics:', error);
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
  let chatHistory = [];

  function renderAiChat() {
    aiResultContainer.innerHTML = '';
    chatHistory.forEach(message => {
      const messageDiv = document.createElement('div');
      const roleClass = message.role === 'user' ? 'user' : 'bot';
      messageDiv.className = `message ${roleClass}`;
      messageDiv.textContent = message.content;
      aiResultContainer.appendChild(messageDiv);
    });
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
    chatHistory.push({ role: 'user', content: question });
    renderAiChat();
    aiQuestionInput.value = '';
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
      chatHistory.push({ role: 'ai', content: data.analysis });
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
      chatHistory.push({ role: 'ai', content: `אירעה שגיאה: ${error.message}` });
    } finally {
      renderAiChat();
      aiSubmitButton.disabled = false;
      aiSubmitButton.textContent = 'נתח תשובות';
    }
  });
}
