const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h to 22h
let currentDate = new Date();
let events = {};

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekDates(date = new Date()) {
  const start = getMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

async function loadEvents() {
  try {
    const response = await fetch('events.json');
    if (response.ok) {
      events = await response.json();
    } else {
      console.warn("Failed to load events.json");
      events = {};
    }
  } catch (err) {
    console.error("Error loading events:", err);
    events = {};
  }
}

function renderTable() {
  const weekDates = getWeekDates(currentDate);
  const container = document.getElementById("table-container");
  const weekLabel = document.getElementById("week-label");
  const timezoneInfo = document.getElementById("timezone-info");

  timezoneInfo.textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

  const start = weekDates[0].toLocaleDateString("en-GB");
  const end = weekDates[6].toLocaleDateString("en-GB");
  weekLabel.textContent = `${start} - ${end}`;

  const table = document.createElement("table");

  // Header with hours in columns
  let thead = `<thead><tr><th class="time-col">Day / Time</th>`;
  HOURS.forEach(hour => {
    thead += `<th>${hour.toString().padStart(2, "0")}:00</th>`;
  });
  thead += `</tr></thead>`;

  // Body with days in rows
  let tbody = "<tbody>";

  weekDates.forEach(date => {
    const iso = date.toISOString().split("T")[0];
    const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
    const dayEvents = events[iso] || [];

    tbody += `<tr><th class="time-col">${dayName} (${date.toLocaleDateString("en-GB")})</th>`;

    let currentHour = 6;

    dayEvents.sort((a, b) => a.start - b.start).forEach(event => {
      const emptyCols = event.start - currentHour;
      if (emptyCols > 0) {
        tbody += `<td colspan="${emptyCols}"></td>`;
      }

      // Clamp duration if event runs past 22h
      const duration = Math.min(event.duration, 23 - event.start);

      tbody += `<td class="event-cell" colspan="${duration}">${event.title}</td>`;

      currentHour = event.start + duration;
    });

    // Fill remaining empty cells after last event
    const remainingCols = 23 - currentHour;
    if (remainingCols > 0) {
      tbody += `<td colspan="${remainingCols}"></td>`;
    }

    tbody += "</tr>";
  });

  tbody += "</tbody>";

  table.innerHTML = thead + tbody;
  container.innerHTML = "";
  container.appendChild(table);
}

async function nextWeek() {
  currentDate.setDate(currentDate.getDate() + 7);
  await loadEvents();
  renderTable();
}

async function prevWeek() {
  currentDate.setDate(currentDate.getDate() - 7);
  await loadEvents();
  renderTable();
}

async function init() {
  await loadEvents();
  renderTable();
}

window.nextWeek = nextWeek;
window.prevWeek = prevWeek;

init();