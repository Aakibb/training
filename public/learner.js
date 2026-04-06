let currentPerson = null;
let currentTaskId = null;

function selectPerson(button, personName) {
  currentPerson = personName;
  
  // Update UI
  document.querySelectorAll('.person-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');
  
  // Show person content
  document.getElementById('person-content').style.display = 'block';
  document.getElementById('person-name').textContent = personName;
  
  // Load person's tasks
  loadPersonTasks(personName);
}

async function loadPersonTasks(personName) {
  try {
    const [tasksResponse, analyticsResponse, sessionsResponse] = await Promise.all([
      fetch(`/api/tasks/person/${personName}`),
      fetch(`/api/analytics/person/${personName}`),
      fetch(`/api/training-sessions/person/${personName}`)
    ]);

    const tasks = await tasksResponse.json();
    const analytics = await analyticsResponse.json();
    const sessions = await sessionsResponse.json();

    const today = new Date();
    const upcomingSessions = sessions.filter(session => new Date(session.session_date) > today).length;
    const pastSessions = sessions.filter(session => new Date(session.session_date) <= today).length;

    // Update stats
    document.getElementById('total-tasks').textContent = analytics.total_tasks || 0;
    document.getElementById('completed-tasks').textContent = analytics.completed_tasks || 0;
    document.getElementById('pending-tasks').textContent = analytics.pending_tasks || 0;
    document.getElementById('in-progress-tasks').textContent = analytics.in_progress_tasks || 0;
    document.getElementById('queries-tasks').textContent = analytics.queries_arrived_tasks || 0;
    document.getElementById('learner-upcoming-sessions').textContent = upcomingSessions;
    document.getElementById('learner-past-sessions').textContent = pastSessions;

    // Render tasks
    renderAllTasks(tasks);
    renderPendingTasks(tasks);
    renderInProgressTasks(tasks);
    renderQueriesTasks(tasks);
    renderCompletedTasks(tasks);

  } catch (error) {
    console.error('Error loading person tasks:', error);
  }
}

function renderAllTasks(tasks) {
  const container = document.getElementById('all-tasks-list');
  
  if (tasks.length === 0) {
    container.innerHTML = '<p>No tasks assigned</p>';
    return;
  }
  
  let html = '';
  tasks.forEach(task => {
    const deadline = new Date(task.deadline);
    let statusColor = 'status-pending';
    if (task.status === 'Completed') statusColor = 'status-completed';
    else if (task.status === 'In Progress') statusColor = 'status-in-progress';
    
    html += `
      <div class="task-card" onclick="openTaskModal(${task.id}, '${task.task_name}', '${task.module_name || 'N/A'}', '${task.description || ''}', '${deadline.toLocaleString()}', '${task.status}', '${task.created_date}')">
        <div class="task-header">
          <span class="task-name">${task.task_name}</span>
          <span class="task-status ${statusColor}">${task.status}</span>
        </div>
        <div class="task-info">
          <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
        </div>
        ${task.description ? `<p>${task.description}</p>` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderPendingTasks(tasks) {
  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const container = document.getElementById('pending-tasks-list');
  
  if (pendingTasks.length === 0) {
    container.innerHTML = '<p>No pending tasks</p>';
    return;
  }
  
  let html = '';
  pendingTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    
    html += `
      <div class="task-card" onclick="openTaskModal(${task.id}, '${task.task_name}', '${task.module_name || 'N/A'}', '${task.description || ''}', '${deadline.toLocaleString()}', '${task.status}', '${task.created_date}')">
        <div class="task-header">
          <span class="task-name">${task.task_name}</span>
          <span class="task-status status-pending">${task.status}</span>
        </div>
        <div class="task-info">
          <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderInProgressTasks(tasks) {
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const container = document.getElementById('in-progress-tasks-list');
  
  if (inProgressTasks.length === 0) {
    container.innerHTML = '<p>No in progress tasks</p>';
    return;
  }
  
  let html = '';
  inProgressTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    html += `
      <div class="task-card" onclick="openTaskModal(${task.id}, '${task.task_name}', '${task.module_name || 'N/A'}', '${task.description || ''}', '${deadline.toLocaleString()}', '${task.status}', '${task.created_date}')">
        <div class="task-header">
          <span class="task-name">${task.task_name}</span>
          <span class="task-status status-in-progress">${task.status}</span>
        </div>
        <div class="task-info">
          <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderQueriesTasks(tasks) {
  const queriesTasks = tasks.filter(t => t.status === 'Queries Arrived');
  const container = document.getElementById('queries-tasks-list');
  
  if (queriesTasks.length === 0) {
    container.innerHTML = '<p>No queried tasks</p>';
    return;
  }
  
  let html = '';
  queriesTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    html += `
      <div class="task-card" onclick="openTaskModal(${task.id}, '${task.task_name}', '${task.module_name || 'N/A'}', '${task.description || ''}', '${deadline.toLocaleString()}', '${task.status}', '${task.created_date}')">
        <div class="task-header">
          <span class="task-name">${task.task_name}</span>
          <span class="task-status status-queries">${task.status}</span>
        </div>
        <div class="task-info">
          <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderCompletedTasks(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const container = document.getElementById('completed-tasks-list');
  
  if (completedTasks.length === 0) {
    container.innerHTML = '<p>No completed tasks</p>';
    return;
  }
  
  let html = '';
  completedTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    const completedDate = new Date(task.completion_date);
    
    html += `
      <div class="task-card" onclick="openTaskModal(${task.id}, '${task.task_name}', '${task.module_name || 'N/A'}', '${task.description || ''}', '${deadline.toLocaleString()}', '${task.status}', '${task.created_date}')">
        <div class="task-header">
          <span class="task-name">${task.task_name}</span>
          <span class="task-status status-completed">${task.status}</span>
        </div>
        <div class="task-info">
          <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
          <p><strong>Completed:</strong> ${completedDate.toLocaleString()}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function switchTaskTab(event, tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

async function openTaskModal(taskId, taskName, moduleName, description, deadline, status, created) {
  currentTaskId = taskId;
  
  // Update modal content
  document.getElementById('modal-task-name').textContent = taskName;
  document.getElementById('modal-module-name').textContent = moduleName;
  document.getElementById('modal-description').textContent = description || 'No description';
  document.getElementById('modal-deadline').textContent = deadline;
  document.getElementById('modal-status').textContent = status;
  document.getElementById('modal-created').textContent = new Date(created).toLocaleString();
  
  // Load task attachments
  await loadTaskAttachments(taskId);
  
  // Update task status dropdown
  document.getElementById('task-status').value = status;
  
  // Show modal
  document.getElementById('task-modal').classList.add('show');
}

async function loadTaskAttachments(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/attachments`);
    const attachments = await response.json();
    
    const section = document.getElementById('attachments-section');
    const list = document.getElementById('attachments-list');
    
    if (attachments.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    let html = '';
    attachments.forEach(attachment => {
      html += `
        <div class="attachment">
          <a href="${attachment.file_path}" download="${attachment.file_name}">${attachment.file_name}</a>
        </div>
      `;
    });
    list.innerHTML = html;
  } catch (error) {
    console.error('Error loading attachments:', error);
  }
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('show');
  document.getElementById('submission-attachment').value = '';
  document.getElementById('submission-note').value = '';
}

async function submitTask() {
  if (!currentTaskId || !currentPerson) return;
  
  const status = document.getElementById('task-status').value;
  const completion_date = status === 'Completed' ? new Date().toISOString() : null;
  const note = document.getElementById('submission-note').value.trim();
  const attachment = document.getElementById('submission-attachment').files[0];

  try {
    const formData = new FormData();
    formData.append('status', status);
    if (completion_date) formData.append('completion_date', completion_date);
    if (note) formData.append('note', note);
    if (attachment) formData.append('submission_attachment', attachment);
    formData.append('submitted_by', currentPerson);

    const response = await fetch(`/api/tasks/${currentTaskId}/submit`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      alert('Task submitted successfully!');
      closeTaskModal();
      loadPersonTasks(currentPerson);
    } else {
      alert('Error submitting task');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('task-modal');
  if (event.target == modal) {
    closeTaskModal();
  }
}
