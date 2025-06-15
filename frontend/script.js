document.addEventListener('DOMContentLoaded', () => {
  fetchMetrics();
});

async function fetchMetrics() {
  // ✅ הכתובת המעודכנת של שרת הבאקאנד שלך
  const API_URL = 'https://dashboard-backend-l9uh.onrender.com';

  const metricsContainer = document.getElementById('metrics-container');

  try {
    const response = await fetch(`${API_URL}/api/metrics`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    metricsContainer.innerHTML = `
      <h2>סה"כ אינטראקציות שנשמרו: <strong>${data.totalInteractions}</strong></h2>
    `;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    metricsContainer.innerHTML = `<p>שגיאה בטעינת הנתונים. ודא שהשרת (הבאקאנד) פועל.</p>`;
  }
}
