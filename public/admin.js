// Tab switching
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
  
  // Load data for the active tab
  if (tabName === 'learning-points') {
    loadLearningPoints();
  } else if (tabName === 'training-sessions') {
    loadTrainingSessions();
    loadLearningPointsForDropdown();
  } else if (tabName === 'tasks') {
    loadTasks();
    loadTrainingSessionsForTaskDropdown();
  }
}

// ===== LEARNING POINTS =====

document.getElementById('learning-point-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const typeSelect = document.getElementById('type');
  const selectedTypes = Array.from(typeSelect.selectedOptions).map(option => option.value);
  const module_name = document.getElementById('module_name').value;
  const description = document.getElementById('description').value;
  
  if (selectedTypes.length === 0 || !module_name) {
    alert('Please select at least one type and fill in module name');
    return;
  }
  
  const type = selectedTypes.join(', ');
  
  try {
    const response = await fetch('/api/learning-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, module_name, description })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert('Learning Point created successfully!');
      document.getElementById('learning-point-form').reset();
      loadLearningPoints();
      loadLearningPointsForDropdown();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

async function loadLearningPoints() {
  try {
    const response = await fetch('/api/learning-points');
    const learningPoints = await response.json();
    
    const container = document.getElementById('learning-points-list');
    
    if (learningPoints.length === 0) {
      container.innerHTML = '<p>No learning points created yet</p>';
      return;
    }
    
    let html = '';
    learningPoints.forEach(point => {
      html += `
        <div class="item">
          <div class="item-content">
            <h4>${point.module_name}</h4>
            <p><strong>Type:</strong> ${point.type}</p>
            ${point.description ? `<p><strong>Description:</strong> ${point.description}</p>` : ''}
            <small>Created: ${new Date(point.created_date).toLocaleDateString()}</small>
          </div>
          <div class="item-actions">
            <button class="btn btn-danger btn-small" onclick="deleteLearningPoint(${point.id})">Delete</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading learning points:', error);
  }
}

async function deleteLearningPoint(id) {
  if (!confirm('Are you sure you want to delete this learning point?')) return;
  
  try {
    const response = await fetch(`/api/learning-points/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Learning point deleted successfully!');
      loadLearningPoints();
      loadLearningPointsForDropdown();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function loadLearningPointsForDropdown() {
  try {
    const response = await fetch('/api/learning-points');
    const learningPoints = await response.json();
    
    const select = document.getElementById('learning_point_id');
    select.innerHTML = '<option value="">-- Select Learning Point --</option>';
    
    learningPoints.forEach(point => {
      const option = document.createElement('option');
      option.value = point.id;
      option.textContent = `${point.module_name} (${point.type})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading learning points for dropdown:', error);
  }
}

// ===== TRAINING SESSIONS =====

document.getElementById('training-session-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const learning_point_id = document.getElementById('learning_point_id').value;
  const session_date = document.getElementById('session_date').value;
  
  if (!learning_point_id || !session_date) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const response = await fetch('/api/training-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ learning_point_id, session_date })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert('Training Session created successfully!');
      document.getElementById('training-session-form').reset();
      loadTrainingSessions();
      loadTrainingSessionsForTaskDropdown();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

async function loadTrainingSessions() {
  try {
    const response = await fetch('/api/training-sessions');
    const sessions = await response.json();
    
    const container = document.getElementById('training-sessions-list');
    
    if (sessions.length === 0) {
      container.innerHTML = '<p>No training sessions created yet</p>';
      return;
    }
    
    let html = '';
    sessions.forEach(session => {
      const sessionDate = new Date(session.session_date);
      html += `
        <div class="item">
          <div class="item-content">
            <h4>${session.module_name}</h4>
            <p><strong>Type:</strong> ${session.type}</p>
            <p><strong>Date:</strong> ${sessionDate.toLocaleString()}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-primary btn-small" onclick="openAddParticipantForm(${session.id})">Add Participant</button>
            <button class="btn btn-danger btn-small" onclick="deleteTrainingSession(${session.id})">Delete</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading training sessions:', error);
  }
}

async function loadTrainingSessionsForTaskDropdown() {
  try {
    const response = await fetch('/api/training-sessions');
    const sessions = await response.json();
    
    const select = document.getElementById('session_id');
    select.innerHTML = '<option value="">-- Select Session --</option>';
    
    sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      const sessionDate = new Date(session.session_date);
      option.textContent = `${session.module_name} - ${sessionDate.toLocaleString()}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading training sessions for dropdown:', error);
  }
}

function openAddParticipantForm(sessionId) {
  window.currentSessionId = sessionId;
  document.getElementById('participant-modal').classList.add('show');
}

async function deleteTrainingSession(sessionId) {
  if (!confirm('Are you sure you want to delete this training session and all related data?')) return;

  try {
    const response = await fetch(`/api/training-sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Training session deleted successfully!');
      loadTrainingSessions();
      loadTrainingSessionsForTaskDropdown();
    } else {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function closeParticipantModal() {
  document.getElementById('participant-modal').classList.remove('show');
  // Clear all checkboxes
  document.querySelectorAll('.participant-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  // Clear custom participant input
  document.getElementById('custom-participant').value = '';
  // Reset the participant list to only show default participants
  const checkboxGroup = document.getElementById('participant-list');
  const allLabels = checkboxGroup.querySelectorAll('.checkbox-label');
  allLabels.forEach((label, index) => {
    if (index > 2) { // Keep only first 3 (Mahi, Saimom, Moushumi)
      label.remove();
    }
  });
  window.currentSessionId = null;
}

async function addSelectedParticipants() {
  const selectedParticipants = Array.from(document.querySelectorAll('.participant-checkbox:checked'))
    .map(checkbox => checkbox.value);
  
  if (selectedParticipants.length === 0) {
    alert('Please select at least one participant');
    return;
  }
  
  for (const participantName of selectedParticipants) {
    await addParticipant(window.currentSessionId, participantName);
  }
  
  closeParticipantModal();
  loadTrainingSessions();
}

function addCustomParticipant() {
  const customName = document.getElementById('custom-participant').value.trim();
  if (!customName) {
    alert('Please enter a name');
    return;
  }
  
  // Create a new checkbox for the custom participant
  const checkboxGroup = document.getElementById('participant-list');
  const label = document.createElement('label');
  label.className = 'checkbox-label';
  label.innerHTML = `
    <input type="checkbox" value="${customName}" class="participant-checkbox" checked>
    <span>${customName}</span>
  `;
  checkboxGroup.appendChild(label);
  
  // Clear the input
  document.getElementById('custom-participant').value = '';
}

async function addParticipant(sessionId, participantName) {
  try {
    const response = await fetch('/api/session-participants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: sessionId, participant_name: participantName })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert(`${participantName} added to session successfully!`);
      loadTrainingSessions();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// ===== TASKS =====

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const session_id = document.getElementById('session_id').value;
  const task_name = document.getElementById('task_name').value;
  const description = document.getElementById('task_description').value;
  const deadline = document.getElementById('deadline').value;
  const assignedToSelect = document.getElementById('assigned_to');
  const selectedUsers = Array.from(assignedToSelect.selectedOptions).map(option => option.value);
  const assigned_to = selectedUsers.join(', ');
  const attachment = document.getElementById('task_attachment').files[0];
  
  if (!task_name || !deadline || selectedUsers.length === 0) {
    alert('Please fill in all required fields and select at least one person');
    return;
  }
  
  const formData = new FormData();
  if (session_id) {
    formData.append('session_id', session_id);
  }
  formData.append('task_name', task_name);
  formData.append('description', description);
  formData.append('deadline', deadline);
  formData.append('assigned_to', assigned_to);
  if (attachment) {
    formData.append('attachment', attachment);
  }
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (response.ok) {
      alert('Task created successfully!');
      document.getElementById('task-form').reset();
      loadTasks();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    
    const container = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
      container.innerHTML = '<p>No tasks created yet</p>';
      return;
    }
    
    let html = '';
    tasks.forEach(task => {
      const deadline = new Date(task.deadline);
      let statusColor = 'status-pending';
      if (task.status === 'Completed') statusColor = 'status-completed';
      else if (task.status === 'In Progress') statusColor = 'status-in-progress';
      
      html += `
        <div class="item">
          <div class="item-content">
            <h4>${task.task_name}</h4>
            <p><strong>Module:</strong> ${task.module_name || 'N/A'}</p>
            <p><strong>Assigned To:</strong> ${task.assigned_to}</p>
            <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
          </div>
          <div class="item-actions">
            <span class="task-status ${statusColor}">${task.status}</span>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

window.addEventListener('load', () => {
  loadLearningPoints();
});

// Close modal when clicking outside
window.onclick = function(event) {
  const participantModal = document.getElementById('participant-modal');
  if (event.target == participantModal) {
    closeParticipantModal();
  }
}
