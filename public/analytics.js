let tasksChart;
let completionChart;

async function loadAnalytics() {
  try {
    const response = await fetch('/api/analytics/dashboard');
    const data = await response.json();
    
    // Update main stats
    document.getElementById('total-sessions').textContent = data.total_sessions;
    document.getElementById('completed-tasks-total').textContent = data.completed_tasks;
    document.getElementById('queries-arrived-total').textContent = data.queries_arrived_tasks || 0;
    if (data.avg_status_update_days) {
      document.getElementById('avg-update-time').textContent = data.avg_status_update_days.toFixed(1) + ' days';
    }
    
    // Calculate average completion time
    if (data.avg_completion_times && data.avg_completion_times.length > 0) {
      let totalDays = 0;
      let count = 0;
      data.avg_completion_times.forEach(item => {
        if (item.avg_days_to_complete) {
          totalDays += item.avg_days_to_complete;
          count++;
        }
      });
      const avgDays = count > 0 ? (totalDays / count).toFixed(1) : '--';
      document.getElementById('avg-completion-time').textContent = avgDays + ' days';
    }
    
    // Prepare data for charts
    const labels = data.person_stats.map(p => p.assigned_to);
    const totalTasksData = data.person_stats.map(p => p.total_tasks);
    const completedTasksData = data.person_stats.map(p => p.completed_tasks);
    
    // Chart 1: Tasks by Person
    const ctx1 = document.getElementById('tasksChart').getContext('2d');
    if (tasksChart) tasksChart.destroy();
    tasksChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Tasks',
            data: totalTasksData,
            backgroundColor: '#667eea',
            borderColor: '#667eea',
            borderWidth: 1
          },
          {
            label: 'Completed Tasks',
            data: completedTasksData,
            backgroundColor: '#48bb78',
            borderColor: '#48bb78',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Chart 2: Completion Rate
    const completionRates = data.person_stats.map(p => {
      return p.total_tasks > 0 ? (p.completed_tasks / p.total_tasks * 100).toFixed(1) : 0;
    });
    
    const ctx2 = document.getElementById('completionChart').getContext('2d');
    if (completionChart) completionChart.destroy();
    completionChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: completionRates,
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        }
      }
    });
    
    // Load individual analytics
    await loadPersonAnalytics('Mahi', 'mahi');
    await loadPersonAnalytics('Saimom', 'saimom');
    await loadPersonAnalytics('Moushumi', 'moushumi');
    
    // Load tasks table
    await loadTasksTable();
    
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

async function loadPersonAnalytics(personName, prefix) {
  try {
    const response = await fetch(`/api/analytics/person/${personName}`);
    const stats = await response.json();
    
    if (stats) {
      const data = stats;
      document.getElementById(`${prefix}-total`).textContent = data.total_tasks || 0;
      document.getElementById(`${prefix}-completed`).textContent = data.completed_tasks || 0;
      document.getElementById(`${prefix}-pending`).textContent = data.pending_tasks || 0;
      document.getElementById(`${prefix}-in-progress`).textContent = data.in_progress_tasks || 0;
      document.getElementById(`${prefix}-queries`).textContent = data.queries_arrived_tasks || 0;
      
      if (data.avg_days_to_complete) {
        document.getElementById(`${prefix}-avg-days`).textContent = data.avg_days_to_complete.toFixed(1);
      }
      if (data.avg_status_update_days) {
        document.getElementById(`${prefix}-status-update-days`).textContent = data.avg_status_update_days.toFixed(1);
      }
    }
  } catch (error) {
    console.error(`Error loading analytics for ${personName}:`, error);
  }
}

async function loadTasksTable() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    
    const tbody = document.getElementById('tasks-table-body');
    
    if (tasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No tasks created yet</td></tr>';
      return;
    }
    
    let html = '';
    tasks.forEach(task => {
      const deadline = new Date(task.deadline);
      let statusClass = 'status-pending';
      if (task.status === 'Completed') statusClass = 'status-completed';
      else if (task.status === 'In Progress') statusClass = 'status-in-progress';
      else if (task.status === 'Queries Arrived') statusClass = 'status-queries';
      
      html += `
        <tr>
          <td>${task.task_name}</td>
          <td>${task.module_name || 'N/A'}</td>
          <td>${task.assigned_to}</td>
          <td>${deadline.toLocaleDateString()}</td>
          <td><span class="task-status ${statusClass}">${task.status}</span></td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  } catch (error) {
    console.error('Error loading tasks table:', error);
  }
}

// Load analytics on page load
window.addEventListener('load', loadAnalytics);

// Add style for table status badges
const style = document.createElement('style');
style.textContent = `
  .task-status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .status-pending {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .status-in-progress {
    background-color: #cfe2ff;
    color: #084298;
  }
  
  .status-queries {
    background-color: #ffe5d9;
    color: #ad4f3b;
  }
  
  .status-completed {
    background-color: #d1e7dd;
    color: #0f5132;
  }
`;
document.head.appendChild(style);
