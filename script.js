const data = window.SITE_DATA;

if (!data) {
  throw new Error("SITE_DATA is missing. Make sure site-data.js loads before script.js.");
}

const meetings = data.meetings;

function addressValues() {
  const { street, city, state, postalCode } = data.address;
  return {
    street,
    cityState: `${city}, ${state}`,
    cityStatePostal: `${city}, ${state} ${postalCode}`,
    full: `${street}, ${city}, ${state} ${postalCode}`
  };
}

function getValue(path) {
  if (path.startsWith("address.")) {
    return addressValues()[path.split(".")[1]];
  }
  return path.split(".").reduce((value, key) => value?.[key], data);
}

function applySiteData() {
  document.querySelectorAll("[data-site]").forEach(element => {
    const value = getValue(element.dataset.site);
    if (value !== undefined && value !== null) element.textContent = value;
  });

  const encodedAddress = encodeURIComponent(addressValues().full);
  const encodedPlace = encodeURIComponent(`${data.club.name}, ${addressValues().full}`);
  const links = {
    email: `mailto:${data.contact.email}`,
    website: data.contact.websiteUrl,
    facebook: data.social?.facebook,
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodedPlace}`,
    appleMaps: `https://maps.apple.com/?q=${encodedPlace}`
  };

  document.querySelectorAll("[data-site-link]").forEach(element => {
    const href = links[element.dataset.siteLink];
    if (href) element.href = href;
  });

  document.querySelectorAll("[data-site-href]").forEach(element => {
    const href = getValue(element.dataset.siteHref);
    if (href) element.href = href;
  });
}

applySiteData();

const nearbyMeetingLinks = document.querySelector("#nearby-meeting-links");
if (nearbyMeetingLinks && Array.isArray(data.resources?.otherMeetings)) {
  nearbyMeetingLinks.innerHTML = data.resources.otherMeetings
    .map(item => `<a class="text-link" href="${item.url}" target="_blank" rel="noreferrer">${item.label}</a>`)
    .join("");
}

const days = Object.keys(meetings);
const tabs = document.querySelector("#day-tabs");
const schedule = document.querySelector("#schedule");
const todayList = document.querySelector("#today-meetings");
const todayTitle = document.querySelector("#today-title");

function fellowshipName(item) {
  if (!item.fellowship) return "";
  return data.fellowships?.[item.fellowship] || item.fellowship;
}

function fellowshipLabel(item) {
  const name = fellowshipName(item);
  if (!name) return "";
  return item.fellowship && name !== item.fellowship
    ? `${name} (${item.fellowship})`
    : name;
}

function meetingMarkup(meeting) {
  const fellowship = fellowshipLabel(meeting);
  return `
    <article class="schedule-card">
      <p class="eyebrow">${meeting.time}</p>
      <h3>${meeting.name}</h3>
      <div class="meta">${fellowship ? `<span class="tag">${fellowship}</span>` : ""}<span class="tag">${meeting.language}</span>${meeting.type.split(" · ").map(item => `<span class="tag">${item}</span>`).join("")}</div>
    </article>`;
}

function dayId(day) {
  return day.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function renderFullSchedule() {
  schedule.innerHTML = days.map(day => {
    const id = dayId(day);
    return `
      <section
        class="schedule-day"
        id="schedule-${id}"
        data-schedule-day="${day}"
        role="tabpanel"
        aria-labelledby="tab-${id}"
      >
        <h3 class="visually-hidden">${day} recovery meetings in Pasadena, Texas</h3>
        <div class="schedule-grid">
          ${meetings[day].map(meetingMarkup).join("")}
        </div>
      </section>`;
  }).join("");
}

function renderDay(day) {
  schedule.querySelectorAll(".schedule-day").forEach(section => {
    section.hidden = section.dataset.scheduleDay !== day;
  });

  [...tabs.querySelectorAll("button")].forEach(button => {
    const active = button.dataset.day === day;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

days.forEach(day => {
  const id = dayId(day);
  const button = document.createElement("button");
  button.type = "button";
  button.id = `tab-${id}`;
  button.dataset.day = day;
  button.role = "tab";
  button.setAttribute("aria-controls", `schedule-${id}`);
  button.textContent = day;
  button.addEventListener("click", () => renderDay(day));
  tabs.appendChild(button);
});

const currentDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
const initialDay = meetings[currentDay] ? currentDay : "Sunday";
todayTitle.textContent = `${initialDay} meetings`;
todayList.innerHTML = meetings[initialDay].map(m => {
  const fellowship = fellowshipLabel(m);
  const details = [fellowship, m.language, m.type].filter(Boolean).join(" · ");
  return `
  <div class="meeting-row">
    <strong class="meeting-time">${m.time}</strong>
    <div><strong>${m.name}</strong><br><span>${details}</span></div>
  </div>`;
}).join("");
renderFullSchedule();
renderDay(initialDay);


const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ORDINALS = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5
};

function nthWeekdayOfMonth(year, month, weekdayName, ordinal) {
  const weekday = WEEKDAYS.indexOf(weekdayName);
  if (weekday === -1) throw new Error(`Unknown weekday: ${weekdayName}`);

  if (ordinal === "last") {
    const date = new Date(year, month + 1, 0);
    while (date.getDay() !== weekday) {
      date.setDate(date.getDate() - 1);
    }
    return date;
  }

  const occurrence = ORDINALS[ordinal];
  if (!occurrence) throw new Error(`Unknown ordinal: ${ordinal}`);

  const date = new Date(year, month, 1);
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1);
  }

  date.setDate(date.getDate() + 7 * (occurrence - 1));
  return date.getMonth() === month ? date : null;
}

function nextEventDate(event, fromDate = new Date()) {
  if (event.date) {
    return new Date(`${event.date}T00:00:00`);
  }

  const recurrence = event.recurrence;
  if (
    recurrence?.frequency === "monthly" &&
    recurrence.ordinal &&
    recurrence.weekday
  ) {
    let year = fromDate.getFullYear();
    let month = fromDate.getMonth();
    const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());

    // Search ahead far enough to handle recurrences such as a fifth weekday,
    // which does not occur in every month.
    for (let i = 0; i < 24; i += 1) {
      const candidate = nthWeekdayOfMonth(
        year,
        month,
        recurrence.weekday,
        recurrence.ordinal
      );

      if (candidate && candidate >= today) return candidate;

      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }

  return null;
}

const CALENDAR_TIME_ZONE = "America/Chicago";
const calendarEventData = new Map();
let calendarEventSequence = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function parseCalendarClock(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return { hour, minute: Number(match[2]) };
}

function calendarTimeRange(event, date) {
  const parts = String(event.time || "")
    .replace(/&ndash;/gi, "–")
    .split(/\s*–\s*/);
  const start = parseCalendarClock(parts[0]);
  if (!start) return null;

  const hasExplicitEnd = Boolean(parts[1]);
  let end = hasExplicitEnd ? parseCalendarClock(parts[1]) : null;
  if (!end) {
    end = { hour: start.hour + 1, minute: start.minute };
    if (end.hour >= 24) end.hour -= 24;
  }

  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), start.hour, start.minute);
  const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), end.hour, end.minute);
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

  return { startDate, endDate, hasExplicitEnd };
}

function formatCalendarDateTime(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("") + "T" + [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    "00"
  ].join("");
}

function calendarRecurrenceRule(recurrence) {
  if (recurrence?.frequency !== "monthly") return "";

  const ordinals = { first: "1", second: "2", third: "3", fourth: "4", last: "-1" };
  const weekdays = {
    Sunday: "SU", Monday: "MO", Tuesday: "TU", Wednesday: "WE",
    Thursday: "TH", Friday: "FR", Saturday: "SA"
  };
  const ordinal = ordinals[recurrence.ordinal];
  const weekday = weekdays[recurrence.weekday];
  return ordinal && weekday ? `FREQ=MONTHLY;BYDAY=${ordinal}${weekday}` : "";
}

function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line) {
  let output = "";
  let lineBytes = 0;
  const encoder = new TextEncoder();

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (lineBytes + characterBytes > 75) {
      output += "\r\n ";
      lineBytes = 1;
    }
    output += character;
    lineBytes += characterBytes;
  }

  return output;
}

const calendarTimeZone = [
  "BEGIN:VTIMEZONE",
  `TZID:${CALENDAR_TIME_ZONE}`,
  `X-LIC-LOCATION:${CALENDAR_TIME_ZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0600",
  "TZOFFSETTO:-0500",
  "TZNAME:CDT",
  "DTSTART:20070311T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0600",
  "TZNAME:CST",
  "DTSTART:20071104T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE"
];

function eventLocation(event) {
  return event.location || `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.postalCode}`;
}

function eventCalendarDescription(event) {
  return [
    event.description,
    event.host ? `Hosted by ${event.host}` : "",
    fellowshipLabel(event)
  ].filter(Boolean).join("\n\n");
}

function createIcsContent(event, date, timeRange, recurrenceRule) {
  const titleSlug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "club-event";
  const instanceDate = formatCalendarDateTime(date).slice(0, 8);
  const uid = `${titleSlug}${event.recurrence ? "" : `-${instanceDate}`}@clubalterations.org`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Club Alterations//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...calendarTimeZone,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${CALENDAR_TIME_ZONE}:${formatCalendarDateTime(timeRange.startDate)}`,
    `DTEND;TZID=${CALENDAR_TIME_ZONE}:${formatCalendarDateTime(timeRange.endDate)}`,
    recurrenceRule ? `RRULE:${recurrenceRule}` : "",
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(eventCalendarDescription(event))}`,
    `LOCATION:${escapeIcsText(eventLocation(event))}`,
    "URL:https://clubalterations.org/",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean);
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

function formatGoogleCalendarDate(date) {
  return formatCalendarDateTime(date);
}

function eventMarkup(event, muted = false) {
  const date = nextEventDate(event);
  if (!date) return "";

  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date).toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const isoDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  const calendarId = `calendar-event-${++calendarEventSequence}`;
  calendarEventData.set(calendarId, { event, date });

  const fellowship = fellowshipLabel(event);
  const eventMeta = [
    event.host ? `<span class="tag">${event.host}</span>` : "",
    fellowship ? `<span class="tag">${fellowship}</span>` : ""
  ].filter(Boolean).join("");

  const flyerActions = event.flyer?.src ? `
        <div class="event-flyer">
          <button
            class="flyer-thumbnail"
            type="button"
            data-flyer-preview="${event.flyer.src}"
            data-flyer-alt="${event.flyer.alt || `Flyer for ${event.title}`}"
            aria-label="Preview flyer for ${event.title}"
          >
            <img
              src="${event.flyer.src}"
              alt="${event.flyer.alt || `Flyer for ${event.title}`}"
              loading="lazy"
            >
          </button>
        </div>` : "";

  return `
    <article class="event-card${muted ? " muted-card" : ""}">
      <time datetime="${isoDate}"><span>${month}</span><strong>${day}</strong></time>
      <div class="event-card-content">
        <h4>${event.title}</h4>
        ${eventMeta ? `<div class="meta event-meta">${eventMeta}</div>` : ""}
        <p>${weekday}${event.time ? ` · ${event.time}` : ""}</p>
        ${event.location ? `<p class="event-location"><strong>Location:</strong> ${event.location}</p>` : ""}
        <p>${event.description}</p>
        ${flyerActions}
      </div>
      <button
        class="event-card-action"
        type="button"
        data-calendar-event-id="${calendarId}"
        aria-label="Add ${escapeHtml(event.title)} to your calendar"
      ></button>
    </article>`;
}

const clubEvents = document.querySelector("#club-events");
const communityEvents = document.querySelector("#community-events");

if (clubEvents) {
  clubEvents.innerHTML = (data.events?.club || [])
    .slice()
    .sort((a, b) => nextEventDate(a) - nextEventDate(b))
    .map(event => eventMarkup(event))
    .join("");
}

if (communityEvents) {
  communityEvents.innerHTML = (data.events?.community || [])
    .slice()
    .sort((a, b) => nextEventDate(a) - nextEventDate(b))
    .map(event => eventMarkup(event, true))
    .join("");
}


const calendarDialog = document.querySelector("#calendar-dialog");
const calendarDialogTitle = document.querySelector("#calendar-dialog-title");
const calendarDialogTime = document.querySelector("#calendar-dialog-time");
const calendarDialogLocation = document.querySelector("#calendar-dialog-location");
const calendarDialogDescription = document.querySelector("#calendar-dialog-description");
const calendarDialogNote = document.querySelector("#calendar-dialog-note");
const calendarDialogGoogle = document.querySelector("#calendar-dialog-google");
const calendarDialogIcs = document.querySelector("#calendar-dialog-ics");
const calendarDialogClose = document.querySelector("#calendar-dialog-close");
let calendarIcsObjectUrl = "";

function openCalendarDialog(calendarId) {
  const calendarEntry = calendarEventData.get(calendarId);
  if (!calendarEntry || !calendarDialog) return;

  const { event, date } = calendarEntry;
  const timeRange = calendarTimeRange(event, date);
  if (!timeRange) return;

  const recurrenceRule = calendarRecurrenceRule(event.recurrence);
  const eventDateText = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  }).format(date);
  const formatTime = value => new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit"
  }).format(value);
  const timeText = `${formatTime(timeRange.startDate)} – ${formatTime(timeRange.endDate)}`;
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", event.title);
  googleUrl.searchParams.set("dates", `${formatGoogleCalendarDate(timeRange.startDate)}/${formatGoogleCalendarDate(timeRange.endDate)}`);
  googleUrl.searchParams.set("ctz", CALENDAR_TIME_ZONE);
  googleUrl.searchParams.set("details", eventCalendarDescription(event));
  googleUrl.searchParams.set("location", eventLocation(event));
  if (recurrenceRule) googleUrl.searchParams.set("recur", `RRULE:${recurrenceRule}`);

  if (calendarIcsObjectUrl) URL.revokeObjectURL(calendarIcsObjectUrl);
  calendarIcsObjectUrl = URL.createObjectURL(new Blob(
    [createIcsContent(event, date, timeRange, recurrenceRule)],
    { type: "text/calendar;charset=utf-8" }
  ));

  const filename = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "club-event";
  calendarDialogTitle.textContent = event.title;
  calendarDialogTime.textContent = `${eventDateText} · ${timeText}`;
  calendarDialogLocation.textContent = eventLocation(event);
  calendarDialogDescription.textContent = event.description || "";
  calendarDialogGoogle.href = googleUrl.toString();
  calendarDialogIcs.href = calendarIcsObjectUrl;
  calendarDialogIcs.download = `${filename}.ics`;

  const notes = [];
  if (event.recurrence && recurrenceRule) notes.push("This adds the monthly series, starting on the date shown.");
  if (!timeRange.hasExplicitEnd) notes.push("No end time is listed, so the calendar entry uses a one-hour duration.");
  calendarDialogNote.textContent = notes.join(" ");
  calendarDialogNote.hidden = notes.length === 0;
  calendarDialog.showModal();
}

if (calendarDialog && calendarDialogGoogle && calendarDialogIcs) {
  document.addEventListener("click", event => {
    const calendarButton = event.target.closest("[data-calendar-event-id]");
    if (calendarButton) openCalendarDialog(calendarButton.dataset.calendarEventId);
  });

  calendarDialogClose?.addEventListener("click", () => calendarDialog.close());
  calendarDialog.addEventListener("click", event => {
    if (event.target === calendarDialog) calendarDialog.close();
  });
  calendarDialog.addEventListener("close", () => {
    if (calendarIcsObjectUrl) URL.revokeObjectURL(calendarIcsObjectUrl);
    calendarIcsObjectUrl = "";
    calendarDialogGoogle.removeAttribute("href");
    calendarDialogIcs.removeAttribute("href");
  });
}

const flyerDialog = document.querySelector("#flyer-dialog");
const flyerDialogImage = document.querySelector("#flyer-dialog-image");
const flyerDialogLink = document.querySelector("#flyer-dialog-link");
const flyerDialogClose = document.querySelector("#flyer-dialog-close");

if (flyerDialog && flyerDialogImage && flyerDialogLink) {
  document.addEventListener("click", event => {
    const previewButton = event.target.closest("[data-flyer-preview]");
    if (!previewButton) return;

    const src = previewButton.dataset.flyerPreview;
    const alt = previewButton.dataset.flyerAlt || "Event flyer";
    flyerDialogImage.src = src;
    flyerDialogImage.alt = alt;
    flyerDialogLink.href = src;
    flyerDialog.showModal();
  });

  flyerDialogClose?.addEventListener("click", () => flyerDialog.close());

  flyerDialog.addEventListener("click", event => {
    if (event.target === flyerDialog) flyerDialog.close();
  });

  flyerDialog.addEventListener("close", () => {
    flyerDialogImage.removeAttribute("src");
    flyerDialogImage.alt = "";
    flyerDialogLink.removeAttribute("href");
  });
}
