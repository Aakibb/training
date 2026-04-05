const urlParams = new URLSearchParams(window.location.search);
const defaultUsers = ["Mahi", "Saimom", "Moushumi"];
const calendarUserSelect = document.getElementById("calendar-user");
const calendarSummary = document.getElementById("calendar-summary");
const calendarEvents = document.getElementById("calendar-events");
const loadCalendarButton = document.getElementById("load-calendar");

function initCalendarPage() {
  const queryUser = urlParams.get("user");
  if (queryUser && defaultUsers.includes(queryUser)) {
    calendarUserSelect.value = queryUser;
  }

  loadCalendarButton.addEventListener("click", () => {
    loadCalendarForUser(calendarUserSelect.value);
  });

  loadCalendarForUser(calendarUserSelect.value);
}

async function loadCalendarForUser(userName) {
  calendarSummary.innerHTML = "<p>Loading calendar...</p>";
  calendarEvents.innerHTML = "";

  try {
    const [sessions, tasks] = await Promise.all([
      fetch(`/api/training-sessions/person/${encodeURIComponent(userName)}`),
      fetch(`/api/tasks/person/${encodeURIComponent(userName)}`)
    ]);

    if (!sessions.ok || !tasks.ok) {
      throw new Error("Unable to load calendar data.");
    }

    const sessionsData = await sessions.json();
    const tasksData = await tasks.json();

    renderCalendar(userName, sessionsData, tasksData);
  } catch (error) {
    calendarSummary.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

function renderCalendar(userName, sessions, tasks) {
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

  calendarSummary.innerHTML = `
    <div class="calendar-card">
      <strong>User</strong>
      <span>${userName}</span>
    </div>
    <div class="calendar-card">
      <strong>Next training date</strong>
      <span>${nextTraining ? formatDate(nextTraining) : "No upcoming training"}</span>
    </div>
    <div class="calendar-card">
      <strong>Next deadline</strong>
      <span>${nextDeadline ? formatDate(nextDeadline) : "No deadlines found"}</span>
    </div>
    <div class="calendar-card">
      <strong>Total sessions</strong>
      <span>${totalSessions}</span>
    </div>
    <div class="calendar-card">
      <strong>Total tasks</strong>
      <span>${totalTasks}</span>
    </div>
  `;

  if (!sessions.length && !tasks.length) {
    calendarEvents.innerHTML = `<p class="empty-state">No training sessions or tasks found for ${userName}.</p>`;
    return;
  }

  const eventsByDate = {};

  sessions.forEach((session) => {
    const dateKey = formatDate(session.date, "yyyy-mm-dd");
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push({
      type: "training",
      date: session.date,
      title: session.module_name || `Session ${session.id}`,
      details: `Training session for ${session.type || 'module'}`,
      status: "training"
    });
  });

  tasks.forEach((task) => {
    const deadlineDate = new Date(task.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return;
    }
    const dateKey = formatDate(deadlineDate, "yyyy-mm-dd");
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push({
      type: "deadline",
      date: deadlineDate,
      title: task.task_name || `Task ${task.id}`,
      details: `${task.status || "Pending"}${task.completion_date ? ` · due ${formatDate(deadlineDate)}` : ``}`,
      status: task.status || "Pending"
    });
  });

  const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));
  calendarEvents.innerHTML = sortedDates.map((dateKey) => {
    const events = eventsByDate[dateKey].sort((a, b) => a.date - b.date);
    return `
      <section class="calendar-day">
        <div class="calendar-day-header">
          <span>${formatDate(new Date(dateKey))}</span>
          <span>${events.length} event${events.length !== 1 ? "s" : ""}</span>
        </div>
        ${events
          .map((event) => {
            const statusClass = event.type === "training"
              ? "event-training"
              : event.status === "Queries Arrived"
                ? "event-queries"
                : event.status === "Completed"
                  ? "event-completed"
                  : "event-deadline";

            return `
              <article class="event-card ${statusClass}">
                <div class="event-card-title">${event.title}</div>
                <div class="event-card-details">${event.details}</div>
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
