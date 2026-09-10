# Club Alterations — Website

A lightweight static website for Club Alterations, a Texas nonprofit recovery clubhouse in Pasadena, Texas that provides meeting space for independent recovery groups from a variety of fellowships. The site is intentionally written to distinguish the clubhouse from A.A. as an organization and to protect member anonymity.

## Site goals

- Make today's meetings immediately visible.
- Keep navigation simple for a non-technical audience.
- Make directions, parking, and entrance details unusually clear.
- Separate events at the club from events elsewhere in the fellowship.
- Use a restrained, community-oriented visual style instead of generic recovery imagery.
- Provide prominent links to A.A. and related resources.
- Work well on older/smaller phones.

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

You can also open `index.html` directly in a browser.

## Structure

- `index.html` — page structure/content
- `styles.css` — responsive layout and visual design
- `script.js` — demo meeting data and day filtering

## Before publishing

Verify all public club information in `site-data.js`, especially the email address, social media links, meeting schedule, accessibility information, event details, and address. Do not publish member/chair names or other personally identifying information in meeting data.

The production site uses the custom domain `https://clubalterations.org/`. Keep the canonical, Open Graph, structured-data, robots, and sitemap URLs on this domain.

The footer states that Club Alterations is an independent clubhouse and is not operated by or affiliated with Alcoholics Anonymous World Services, Inc. The club should approve its final organizational language.

## Editing site information

Routine site information lives in **`site-data.js`**. This is the first file to edit when the club's information changes.

For example, the address is defined once:

```js
address: {
  street: "123 Example Street",
  city: "San Antonio",
  state: "TX",
  postalCode: "78xxx"
}
```

Changing those four values automatically updates every displayed club address as well as the Google Maps and Apple Maps links.

The same applies to the email address, social media links, entrance information, parking information, accessibility note, club name/tagline, and meeting schedule.

### Files

- `site-data.js` — **routine editable content and meeting data**
- `index.html` — page structure; normally does not need editing for routine information changes
- `styles.css` — visual design and responsive layout
- `script.js` — rendering/binding logic; normally does not need editing for routine information changes

## SEO and search setup

The site includes:

- descriptive page title and meta description
- canonical URL
- Open Graph and Twitter sharing metadata
- Schema.org `WebSite` and `Place` structured data
- `robots.txt`
- `sitemap.xml`
- official Houston Intergroup and A.A. Meeting Guide links

### Google Search Console

1. Open Google Search Console and add the public site URL as a **URL-prefix property** (or add the whole domain as a Domain property if you control DNS).
2. If you choose HTML-tag verification, Google will provide a token. In `index.html`, uncomment the `google-site-verification` meta tag and replace `TOKEN` with the exact value Google provides.
3. Deploy the updated site and click **Verify** in Search Console.
4. Submit `https://clubalterations.org/sitemap.xml` in Search Console.
5. Use URL Inspection to request indexing of the home page after the first deployment.

If the canonical domain ever changes, update every SEO URL and resubmit the sitemap in Search Console.

### Anonymity

Meeting chair/member names are intentionally not stored or rendered by this site. Keep public meeting listings limited to information such as group name, time, meeting format/type, and language.


## Meeting fellowships / programs

Meeting entries can identify the recovery fellowship with a short code, for example:

```js
{ time: "7:00 PM &ndash; 8:00 PM", name: "Still Sober Group", fellowship: "AA", type: "Open · Discussion", language: "English" }
```

The code is expanded from `SITE_DATA.fellowships`, so `AA` renders as `Alcoholics Anonymous (AA)`. Add new fellowship names to that registry once, then reuse the code in meeting entries. If `fellowship` is omitted, no fellowship label is shown; this avoids guessing when a group's program has not been confirmed.


## Organization status wording

The public About section draws its organizational-status text from `site-data.js`:

```js
organization: {
  nonprofitStatus: "Club Alterations is a Texas nonprofit corporation. An application for recognition of federal tax-exempt status has been submitted to the IRS and is currently pending.",
  meetingWelcome: "We welcome independent recovery groups from a variety of fellowships and are actively expanding the meeting schedule."
}
```

When IRS recognition is determined, update `organization.nonprofitStatus` so the site does not continue to describe the application as pending. The site deliberately does not claim federal tax-exempt status while the application is pending.
