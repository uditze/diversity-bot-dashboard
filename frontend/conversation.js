document.addEventListener('DOMContentLoaded', () => {
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
  container.innerHTML = '<p>טוען שיחה...</p>'; // הודעת טעינה ראשונית

  try {
    // שלב 1: קבל במקביל גם את ההודעות וגם את כל התרחישים
    const [messagesResponse, scenariosResponse] = await Promise.all([
      fetch(`${API_URL}/api/sessions/${sessionId}`),
      fetch(`${API_URL}/api/scenarios`)
    ]);

    if (!messagesResponse.ok) throw new Error('Failed to fetch conversation');
    if (!scenariosResponse.ok) throw new Error('Failed to fetch scenarios');

    const messages = await messagesResponse.json();
    const scenarios = await scenariosResponse.json();

    container.innerHTML = ''; // ניקוי הודעת "טוען שיחה"

    if (messages.length === 0) {
      container.innerHTML = '<p>לא נמצאו הודעות עבור שיחה זו.</p>';
      return;
    }

    let currentScenarioId = -1; // משתנה למעקב אחר התרחיש הנוכחי

    // שלב 2: עבור על כל ההודעות והצג אותן ואת התרחישים
    messages.forEach(message => {
      // אם מזהה התרחיש בהודעה שונה מהמזהה ששמור לנו, זה אומר שהתחיל דיון על תרחיש חדש
      if (message.scenario_id !== null && message.scenario_id !== currentScenarioId) {
        currentScenarioId = message.scenario_id;
        const scenario = scenarios.find(s => s.id === currentScenarioId);

        if (scenario) {
          const scenarioDiv = document.createElement('div');
          scenarioDiv.className = 'scenario-display';
          // נציג את התרחיש בעברית כברירת מחדל
          scenarioDiv.innerHTML = `<h3>דיון על תרחיש ${currentScenarioId + 1}</h3><p>${scenario.he.replace(/\n/g, '<br>')}</p>`;
          container.appendChild(scenarioDiv);
        }
      }

      // יצירת אלמנט עבור ההודעה עצמה (כמו קודם)
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.role}`;
      messageDiv.innerText = message.content;
      container.appendChild(messageDiv);
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    container.innerHTML = `<p>שגיאה בטעינת השיחה. בדוק את חיבור הרשת ונסה שוב.</p>`;
  }
}
