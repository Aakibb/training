const urlParams = new URLSearchParams(window.location.search);
const defaultUsers = ["Mahi", "Saimom", "Moushumi"];
const calendarUserSelect = document.getElementById("calendar-user");
const calendarFilterSelect = document.getElementById("calendar-filter");
const calendarSummary = document.getElementById("calendar-summary");
const calendarEvents = document.getElementById("calendar-events");
const loadCalendarButton = document.getElementById("load-calendar");

function initCalendarPage() {
  const queryUser = urlParams.get("user");
  if (queryUser && (queryUser === "all" || defaultUsers.includes(queryUser))) {
    calendarUserSelect.value = queryUser;
  }

  loadCalendarButton.addEventListener("click", () => {
    loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value);
  });

  calendarFilterSelect.addEventListener("change", () => {
    loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value);
  });

  loadCalendarForUser(calendarUserSelect.value, calendarFilterSelect.value);
}

async function loadCalendarForUser(userName, filter) {
  calendarSummary.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading calendar data...</p></div>';
  calendarEvents.innerHTML = "";

  try {
    const sessionUrl = userName === "all"
      ? "/api/training-sessions"
      : `/api/training-sessions/person/${encodeURIComponent(userName)}`;
    const taskUrl = userName === "all"
      ? "/api/tasks"
      : `/api/tasks/person/${encodeURIComponent(userName)}`;

    const [sessions, tasks] = await Promise.all([
      fetch(sessionUrl),
      fetch(taskUrl)
    ]);

    if (!sessions.ok || !tasks.ok) {
      throw new Error("Unable to load calendar data.");
    }

    const sessionsData = await sessions.json();
    const tasksData = await tasks.json();

    renderCalendar(userName, filter, sessionsData, tasksData);
  } catch (error) {
    calendarSummary.innerHTML = `<div class="error-message">❌ Error loading calendar: ${error.message}</div>`;
  }
}

function renderCalendar(userName, filter, sessions, tasks) {
  if (!Array.isArray(sessions)) {
    sessions = [];
  }
  if (!Array.isArray(tasks)) {
    tasks = [];
  }

  const today = new Date();
  const futureSessions = sessions
    .map((session) => ({ ...session, date: new Date(session.session_date) }))
    .filter((session) => !isNaN(session.date.getTime()) && session.date >= today)
    .sort((a, b) => a.date - b.date);

  const allDeadlines = tasks
    .map((task) => ({ ...task, deadline: new Date(task.deadline) }))
    .filter((task) => !isNaN(task.deadline.getTime()))
    .sort((a, b) => a.deadline - b.deadline);

  const nextTraining = futureSessions.length ? futureSessions[0].date : null;
  const nextDeadline = allDeadlines.length ? allDeadlines[0].deadline : null;

  const totalSessions = sessions.length;
  const totalTasks = tasks.length;
  const selectedUserLabel = userName === "all" ? "👥 Everyone" : `👤 ${userName}`;
  const selectedFilterLabel = filter === "training" ? "🎓 Training sessions" : filter === "tasks" ? "📝 Task deadlines" : "📋 All events";

  const upcomingSessions = futureSessions.length;
  const upcomingDeadlines = allDeadlines.filter(task => task.deadline >= today).length;

  calendarSummary.innerHTML = `
    <div class="calendar-card">
      <strong>👀 Viewing</strong>
      <span>${selectedUserLabel}</span>
    </div>
    <div class="calendar-card">
      <strong>🔍 Filter</strong>
      <span>${selectedFilterLabel}</span>
    </div>
    <div class="calendar-card">
      <strong>🎓 Next Training</strong>
      <span>${nextTraining ? formatDate(nextTraining) : "No upcoming training"}</span>
    </div>
    <div class="calendar-card">
      <strong>⏰ Next Deadline</strong>
      <span>${nextDeadline ? formatDate(nextDeadline) : "No deadlines found"}</span>
    </div>
    <div class="calendar-card">
      <strong>📊 Total Sessions</strong>
      <span>${totalSessions} (${upcomingSessions} upcoming)</span>
    </div>
    <div class="calendar-card">
      <strong>📋 Total Tasks</strong>
      <span>${totalTasks} (${upcomingDeadlines} upcoming)</span>
    </div>
  `;

  if ((!sessions.length && filter !== "tasks") || (!tasks.length && filter !== "training")) {
    const hasAny = (filter === "training" ? sessions.length : filter === "tasks" ? tasks.length : sessions.length + tasks.length);
    if (!hasAny) {
      calendarEvents.innerHTML = `<div class="empty-state">📭 No ${filter === "training" ? "training sessions" : filter === "tasks" ? "task deadlines" : "events"} found for ${selectedUserLabel.replace(/👥 |👤 /g, '')}.</div>`;
      return;
    }
  }

  const eventsByDate = {};

  if (filter !== "tasks") {
    sessions.forEach((session) => {
      const dateKey = formatDate(new Date(session.session_date), "yyyy-mm-dd");
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push({
        type: "training",
        date: new Date(session.session_date),
        title: session.module_name || `Session ${session.id}`,
        details: `🎓 Training session for ${session.type || 'module'}`,
        status: "training",
        time: formatTime(new Date(session.session_date)),
        participants: session.participants ? session.participants.length : 0
      });
    });
  }

  if (filter !== "training") {
    tasks.forEach((task) => {
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) {
        return;
      }
      const dateKey = formatDate(deadlineDate, "yyyy-mm-dd");
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      const isOverdue = deadlineDate < today && task.status !== 'Completed';
      eventsByDate[dateKey].push({
        type: "deadline",
        date: deadlineDate,
        title: task.task_name || `Task ${task.id}`,
        details: `${task.status || "Pending"} • Assigned to: ${task.assigned_to} • Module: ${task.module_name || 'N/A'}${isOverdue ? ' ⚠️ OVERDUE' : ''}`,
        status: task.status || "Pending",
        time: formatTime(deadlineDate),
        priority: isOverdue ? 'high' : 'normal'
      });
    });
  }

  const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));
  if (!sortedDates.length) {
    calendarEvents.innerHTML = `<div class="empty-state">📭 No ${filter === "training" ? "training sessions" : filter === "tasks" ? "task deadlines" : "events"} found for ${selectedUserLabel.replace(/👥 |👤 /g, '')}.</div>`;
    return;
  }

  calendarEvents.innerHTML = sortedDates.map((dateKey) => {
    const events = eventsByDate[dateKey].sort((a, b) => a.date - b.date);
    const dateObj = new Date(dateKey);
    const isToday = dateObj.toDateString() === today.toDateString();
    const isPast = dateObj < today;

    return `
      <section class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}">
        <div class="calendar-day-header">
          <span class="date-display">${isToday ? '📅 Today - ' : ''}${formatDate(new Date(dateKey))}</span>
          <span class="event-count">${events.length} event${events.length !== 1 ? "s" : ""}</span>
        </div>
        ${events
          .map((event) => {
            const statusClass = event.type === "training"
              ? "event-training"
              : event.status === "Queries Arrived"
                ? "event-queries"
                : event.status === "Completed"
                  ? "event-completed"
                  : event.priority === 'high'
                    ? "event-overdue"
                    : "event-deadline";

            return `
              <article class="event-card ${statusClass}">
                <div class="event-card-header">
                  <div class="event-card-title">${event.title}</div>
                  <div class="event-card-time">${event.time}</div>
                </div>
                <div class="event-card-details">${event.details}</div>
                ${event.participants !== undefined ? `<div class="event-participants">👥 ${event.participants} participant${event.participants !== 1 ? 's' : ''}</div>` : ''}
              </article>
            `;
          })
          .join("")}
      </section>
    `;
  }).join("");
}

function formatDuration(seconds) {
  if (!seconds || seconds < 60) {
    return `${Math.round(seconds || 0)} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(date, format = "medium") {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  if (format === "yyyy-mm-dd") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

initCalendarPage();
