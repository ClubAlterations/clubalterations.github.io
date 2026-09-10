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
  const links = {
    email: `mailto:${data.contact.email}`,
    website: data.contact.websiteUrl,
    facebook: data.social?.facebook,
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    appleMaps: `https://maps.apple.com/?q=${encodedAddress}`
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

function fellowshipName(meeting) {
  if (!meeting.fellowship) return "";
  return data.fellowships?.[meeting.fellowship] || meeting.fellowship;
}

function fellowshipLabel(meeting) {
  const name = fellowshipName(meeting);
  if (!name) return "";
  return meeting.fellowship && name !== meeting.fellowship
    ? `${name} (${meeting.fellowship})`
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

function lastWeekdayOfMonth(year, month, weekdayName) {
  const weekday = WEEKDAYS.indexOf(weekdayName);
  if (weekday === -1) throw new Error(`Unknown weekday: ${weekdayName}`);

  const date = new Date(year, month + 1, 0);
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

function nextEventDate(event, fromDate = new Date()) {
  if (event.date) {
    return new Date(`${event.date}T00:00:00`);
  }

  const recurrence = event.recurrence;
  if (
    recurrence?.frequency === "monthly" &&
    recurrence.ordinal === "last" &&
    recurrence.weekday
  ) {
    let year = fromDate.getFullYear();
    let month = fromDate.getMonth();
    let candidate = lastWeekdayOfMonth(year, month, recurrence.weekday);

    const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    if (candidate < today) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      candidate = lastWeekdayOfMonth(year, month, recurrence.weekday);
    }
    return candidate;
  }

  return null;
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
      <div>
        <h4>${event.title}</h4>
        <p>${weekday}${event.time ? ` · ${event.time}` : ""}</p>
        <p>${event.description}</p>
        ${flyerActions}
      </div>
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
