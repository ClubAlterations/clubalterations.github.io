/*
 * Club Alterations - editable site data
 *
 * For routine content changes, start here. Repeated information on the page
 * is generated from this object so you do not have to hunt through HTML.
 */
window.SITE_DATA = {
  club: {
    name: "Club Alterations",
    shortName: "CA",
    tagline: "Meeting space for recovery & fellowship",
    description: "Club Alterations is an independent clubhouse in Pasadena, Texas, providing meeting space for independent Alcoholics Anonymous groups and other recovery groups."
  },

  address: {
    street: "4313 Red Bluff Rd",
    city: "Pasadena",
    state: "TX",
    postalCode: "77503"
  },

  contact: {
    phoneDisplay: "(210) 555-0123",
    phoneDial: "+12105550123",
    email: "clubalterations@gmail.com",
    websiteDisplay: "clubalterations.org",
    websiteUrl: "https://clubalterations.org/"
  },

  location: {
    entranceTitle: "On the Red Bluff side of the building",
    entranceNote: "",
    entranceDetail: "On the Red Bluff side of the building",
    parkingTitle: "We ask that you please not park in front of the other businesses when they're open. Car pool when possible.",
    parkingNote: "",
    parkingDetail: "Please avoid parking in front of the other businesses when they're open.",
    accessibility: "Ramp on the otherside of the church nextdoor."
  },


  resources: {
    otherMeetings: [
      { label: "Houston Intergroup meeting guide", url: "https://aahouston.org/meetings/" },
      { label: "A.A. Meeting Guide app", url: "https://www.aa.org/meeting-guide-app" }
    ]
  },

  events: {
    club: [
      {
        date: "2026-08-22",
        title: "Still Sober Group &mdash; Speak and Eat and Bingo",
        time: "4:00 PM &ndash; 8:00 PM",
          description: "Two Tacos with all the fixings and sides for $10. Plus a 50:50 raffle!"
      },
      {
        recurrence: { frequency: "monthly", ordinal: "last", weekday: "Wednesday" },
        title: "Still Sober Group &mdash; Birthday Night",
        time: "7:00 PM &ndash; 8:00 PM",
        description: "Monthly celebration for sobriety anniversaries."
      },
      {
        recurrence: { frequency: "monthly", ordinal: "last", weekday: "Monday" },
        title: "Still Sober Group &mdash; Group Conscience Meeting",
        time: "8:00 PM &ndash; 9:00 PM",
        description: "Monthly group conscience meeting."
      }
    ],
    community: [
      {
        date: "2026-08-29",
        title: "District Workshop",
        time: "Hosted off-site",
        description: "Service workshop and fellowship. See organizer details before attending."
      },
      {
        date: "2026-09-12",
        title: "Local Club Anniversary",
        time: "Hosted off-site",
        description: "Dinner, speaker, and anniversary celebration."
      }
    ]
  },

  meetings: {
    Sunday: [
        { time: "7:00 AM &ndash; 9:00 AM", name: "Want More, Do More Group", type: "Open · Discussion", language: "English" },
        { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Sunday Night God Meeting", language: "English" }
    ],
    Monday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Discussion", language: "English" }
    ],
    Tuesday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Discussion", language: "English"  }
    ],
    Wednesday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Discussion", language: "English"  }
    ],
    Thursday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · 12 and 12 Book Study", language: "English"  }
    ],
    Friday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Big Book Study", language: "English"  }
    ],
    Saturday: [
      { time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", type: "Open · Discussion", language: "English" }
    ]
  }
};
