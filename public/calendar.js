const urlParams = new URLSearchParams(window.location.search);
const defaultUsers = ["Mahi", "Saimom", "Moushumi"];
const calendarUserSelect = document.getElementById("calendar-user");
const calendarFilterSelect = document.getElementById("calendar-filter");
const calendarSummary = document.getElementById("calendar-summary");
const calendarGrid = document.getElementById("calendar-grid");
const calendarDayDetails = document.getElementById("calendar-day-details");
const loadCalendarButton = document.getElementById("load-calendar");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const monthLabel = document.getElementById("current-month-label");

let currentMonthDate = new Date();
let currentEventsByDate = {};
let selectedDayKey = null;

function initCalendarPage() {
  const queryUser = urlParams.get("user");
  if (queryUser && (queryUser === "all" || defaultUsers.includes(queryUser))) {
    calendarUserSelect.value = queryUser;
  }

  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));
  loadCalendarButton.addEventListener("click", () => loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value));
  calendarFilterSelect.addEventListener("change", () => loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value));

  loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value);
}

function changeMonth(offset) {
  currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1);
  renderMonthGrid(currentEventsByDate);
}

async function loadCalendarForUser(userName, filter) {
  calendarSummary.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading calendar data...</p></div>';
  calendarGrid.innerHTML = '';
  calendarDayDetails.innerHTML = '';

  try {
    const sessionUrl = userName === "all"
      ? "/api/training-sessions"
      : `/api/training-sessions/person/${encodeURIComponent(userName)}`;
    const taskUrl = userName === "all"
      ? "/api/tasks"
      : `/api/tasks/person/${encodeURIComponent(userName)}`;

    const [sessionsResponse, tasksResponse] = await Promise.all([
      fetch(sessionUrl),
      fetch(taskUrl)
    ]);

    if (!sessionsResponse.ok || !tasksResponse.ok) {
      throw new Error("Unable to load calendar data.");
    }

    const sessions = await sessionsResponse.json();
    const tasks = await tasksResponse.json();

    currentEventsByDate = buildEventMap(sessions, tasks, filter);
    const firstKey = selectInitialDay(currentEventsByDate);
    selectedDayKey = firstKey;
    renderCalendar(userName, filter, sessions, tasks);
    if (firstKey) {
      renderDayDetails(firstKey, currentEventsByDate[firstKey]);
    } else {
      renderDayDetails(null, []);
    }
  } catch (error) {
    calendarSummary.innerHTML = `<div class="error-message">❌ Error loading calendar: ${error.message}</div>`;
  }
}

function buildEventMap(sessions, tasks, filter) {
  const today = new Date();
  const eventsByDate = {};

  if (filter !== "tasks") {
    sessions.forEach(session => {
      const sessionDate = new Date(session.session_date);
      if (isNaN(sessionDate.getTime())) return;
      const dateKey = formatDateKey(sessionDate);
      eventsByDate[dateKey] = eventsByDate[dateKey] || [];
      eventsByDate[dateKey].push({
        type: "training",
        date: sessionDate,
        title: session.module_name || `Session ${session.id}`,
        details: `Training session for ${session.type || 'module'}`,
        status: "training",
        time: formatTime(sessionDate),
        isPast: sessionDate < today
      });
    });
  }

  if (filter !== "training") {
    tasks.forEach(task => {
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) return;
      const dateKey = formatDateKey(deadlineDate);
      eventsByDate[dateKey] = eventsByDate[dateKey] || [];
      eventsByDate[dateKey].push({
        type: "deadline",
        date: deadlineDate,
        title: task.task_name || `Task ${task.id}`,
        details: `${task.status || "Pending"} • ${task.assigned_to || 'Unassigned'}`,
        status: task.status || "Pending",
        time: formatTime(deadlineDate),
        isPast: deadlineDate < today && task.status !== 'Completed'
      });
    });
  }

  return eventsByDate;
}

function selectInitialDay(eventsByDate) {
  const todayKey = formatDateKey(new Date());
  if (eventsByDate[todayKey]) return todayKey;
  const sortedKeys = Object.keys(eventsByDate).sort();
  return sortedKeys.length ? sortedKeys[0] : null;
}

function renderCalendar(userName, filter, sessions, tasks) {
  const today = new Date();
  const futureSessions = sessions
    .map(session => ({ ...session, date: new Date(session.session_date) }))
    .filter(session => !isNaN(session.date.getTime()) && session.date >= today);

  const totalSessions = sessions.length;
  const upcomingSessions = futureSessions.length;
  const pastSessions = totalSessions - upcomingSessions;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
  const queriesTasks = tasks.filter(task => task.status === 'Queries Arrived').length;

  const selectedUserLabel = userName === "all" ? "Everyone" : userName;
  const selectedFilterLabel = filter === "training" ? "Training sessions" : filter === "tasks" ? "Task deadlines" : "All events";

  calendarSummary.innerHTML = `
    <div class="calendar-card">
      <strong>View</strong>
      <span>${selectedUserLabel}</span>
    </div>
    <div class="calendar-card">
      <strong>Filter</strong>
      <span>${selectedFilterLabel}</span>
    </div>
    <div class="calendar-card">
      <strong>Upcoming Sessions</strong>
      <span>${upcomingSessions}</span>
    </div>
    <div class="calendar-card">
      <strong>Past Sessions</strong>
      <span>${pastSessions}</span>
    </div>
    <div class="calendar-card">
      <strong>Total Tasks</strong>
      <span>${totalTasks}</span>
    </div>
    <div class="calendar-card">
      <strong>Completed</strong>
      <span>${completedTasks}</span>
    </div>
    <div class="calendar-card">
      <strong>In Progress</strong>
      <span>${inProgressTasks}</span>
    </div>
    <div class="calendar-card">
      <strong>Pending</strong>
      <span>${pendingTasks}</span>
    </div>
    <div class="calendar-card">
      <strong>Queries</strong>
      <span>${queriesTasks}</span>
    </div>
  `;

  renderMonthGrid(currentEventsByDate);
}

function renderMonthGrid(eventsByDate) {
  calendarGrid.innerHTML = '';
  monthLabel.textContent = `${formatMonthLabel(currentMonthDate)}`;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const headerRow = document.createElement('div');
  headerRow.className = 'month-row month-header';
  dayNames.forEach(day => {
    const dayLabel = document.createElement('div');
    dayLabel.className = 'day-label';
    dayLabel.textContent = day;
    headerRow.appendChild(dayLabel);
  });
  calendarGrid.appendChild(headerRow);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let row = document.createElement('div');
  row.className = 'month-row';

  for (let blank = 0; blank < firstDay; blank++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'month-cell inactive';
    row.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      calendarGrid.appendChild(row);
      row = document.createElement('div');
      row.className = 'month-row';
    }

    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    const events = eventsByDate[dateKey] || [];
    const isToday = formatDateKey(date) === formatDateKey(new Date());

    const cell = document.createElement('div');
    cell.className = `month-cell ${isToday ? 'today' : ''} ${events.length ? 'has-events' : ''}`;
    if (events.length) cell.addEventListener('click', () => selectDay(dateKey, events));

    const dayNumber = document.createElement('div');
    dayNumber.className = 'date-number';
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    if (events.length) {
      const dots = document.createElement('div');
      dots.className = 'day-dots';
      events.slice(0, 4).forEach(event => {
        const dot = document.createElement('span');
        dot.className = `day-dot ${event.type}`;
        dot.title = event.title;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);

      if (events.length > 4) {
        const more = document.createElement('div');
        more.className = 'more-events';
        more.textContent = `+${events.length - 4} more`;
        cell.appendChild(more);
      }
    }

    row.appendChild(cell);
  }

  while (row.children.length < 7) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'month-cell inactive';
    row.appendChild(emptyCell);
  }

  calendarGrid.appendChild(row);
}

function selectDay(dateKey, events) {
  selectedDayKey = dateKey;
  renderDayDetails(dateKey, events);
}

function renderDayDetails(dateKey, events) {
  if (!dateKey || !events || !events.length) {
    calendarDayDetails.innerHTML = '<div class="day-details"><h3>No events for this day</h3><p>Select a day with events to see details.</p></div>';
    return;
  }

  calendarDayDetails.innerHTML = `
    <div class="day-details">
      <h3>Events on ${formatDisplayDate(new Date(dateKey))}</h3>
      <div class="details-list">
        ${events.map(event => `
          <div class="details-card ${event.type}">
            <div class="details-header">
              <strong>${event.title}</strong>
              <span>${event.time}</span>
            </div>
            <p>${event.details}</p>
            <span class="details-type">${event.type === 'training' ? 'Training Session' : 'Task Deadline'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function formatDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

initCalendarPage();
