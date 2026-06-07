# Aurelius Fire & Rescue — Incident Run Report App

A mobile-first web application for completing fire/rescue incident run reports on a
phone or tablet, saving the data locally, and generating professional print- and
email-ready PDFs. Built as a single self-contained HTML file and designed to be
hosted for free on GitHub Pages.

The app digitizes the department’s original 2015 paper run-report form so members
can fill out reports in the field, then produce a clean completed PDF for records
or a blank printable form to fill out by hand.

-----

## Files in this project

|File                     |Purpose                                                                                                                                                    |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
|**index.html**           |The entire application — a self-contained single-page app. This is the only file required to run. Loads the `html2pdf.js` library from a CDN.              |
|**personnel.json**       |The member roster (name, badge number, qualification). Fetched by the app at startup so the roster can be updated without editing the app code.            |
|**manage-personnel.html**|An admin page to edit the roster through a simple add/edit/delete interface plus CSV import, then download an updated `personnel.json` to push to the repo.|
|**_headers**             |Cache-control settings (used by Netlify; on GitHub Pages the app relies on its built-in cache-buster instead).                                             |
|**README.md**            |This document.                                                                                                                                             |

-----

## How to deploy (GitHub Pages)

1. Create a public GitHub repository.
1. Upload `index.html`, `personnel.json`, `manage-personnel.html`, and `_headers`.
1. In the repo go to **Settings → Pages** and set the source to deploy from the
   `main` branch, root folder.
1. The app will be live at `https://USERNAME.github.io/REPO/`.
1. To update the roster later, edit it in `manage-personnel.html`, download the new
   `personnel.json`, and commit it to the repo. The app cache-busts the fetch with a
   timestamp so changes appear without a hard refresh.

-----

## How the app works

### Data model and saving

- All form data lives in a single state object (`F`) that **auto-saves to the
  browser’s `localStorage` on every change** — there is no Save button because saving
  is automatic and continuous.
- On startup the app loads instantly using a built-in fallback roster, then quietly
  fetches `personnel.json` in the background and refreshes the roster if successful.
  This means the app never hangs waiting on a network request.
- A migration step in `loadForm()` upgrades data saved by older versions (e.g. a
  mutual-aid value that used to be a single text entry is converted to a list), so a
  returning user’s saved report never crashes the app.

### Tabs

The form is organized into tabs, navigated with **Back** and **Next** buttons:

1. **Incident** — Date, Run #, Incident Commander (roster dropdown), Location Type
   (address field appears once a type is chosen), and the Mutual Aid card.
1. **Times** — The five response times (Dispatched, Enroute, Arrived, Cleared, In
   Quarters) with auto-inserted colon and green elapsed-time badges, plus a Response
   Time Summary showing total call time.
1. **Dispatch** — Dispatch type selector; choosing a type reveals an “Actual Dispatch
   Text” box directly beneath it.
1. **Apparatus** — Toggle responding units; each selected unit reveals a driver
   dropdown.
1. **Personnel** — Toggle responding members; auto-tallies EMTs and Interior FF, and
   calculates Total Personnel Hours (members × call time).
1. **MVA** — Vehicles involved. Starts with one vehicle; the next appears as you fill
   one in, up to six. Vehicle make/model is a searchable dropdown of common vehicles,
   color is a dropdown.
1. **EMS** — Ambulances. Starts with one; the next appears once a service is picked.
   Each has its own PCR number. Includes a progressive “Refused Transport PCR #”
   section.
1. **Law** — Law enforcement. Progressive officer rows; each has an agency dropdown
   (NY State Police, Cayuga County Sheriff’s Dept, City of Auburn Police, Other) and
   an officer/badge field.
1. **Remarks** — Free-text remarks, a Personnel Injured sub-section (roster dropdown +
   auto-filled badge + Report Filed), and a Report Signature card with a roster
   dropdown and a touchscreen signature pad you sign with a finger or stylus.
1. **Preview** — A summary plus three buttons:
- **Generate & Download PDF** — the completed report.
- **Generate PDF & Send via Email** — generates the PDF and opens the native
  share sheet (iOS/Android) so it can be attached to an email.
- **Download Blank Form** — a printable form to fill out by hand.

### PDF output

- **Completed PDF** — Page 1 contains Incident Information, Response Times + stats,
  Apparatus (with full driver name and badge number), Vehicles, Law Enforcement,
  EMS/Ambulances, Mutual Aid, Remarks, Personnel Injured, and the signature footer.
  **Personnel on Scene appears on its own second page** in a three-column roster so a
  large crew never overflows page 1.
- **Blank hand-fill form** — Three pages with checkboxes and write-in lines: page 1
  incident details, page 2 remarks/counts/signature, page 3 a 40-slot personnel
  roster with checkboxes. Sections are kept whole so none is split across a page
  break.
- Both are laid out for 8.5 × 11 paper with fixed sizing so elements don’t reflow,
  and use a grayscale palette that prints cleanly in black and white.

-----

## Email / sharing behavior

- **iOS Safari / Android Chrome** — The PDF is generated as a file and handed to the
  native share sheet, where the user taps Mail to attach it to a message.
- **Older mobile browsers** — The PDF downloads, then the mail app opens with a
  pre-filled subject and body for manual attachment.
- **Desktop** — The PDF downloads; the user attaches it manually.

(Browsers do not allow a web page to attach a file directly to a `mailto:` link, so
the share sheet is the correct path on mobile.)

-----

## Change history

This is the full sequence of changes made while building the app, in order.

### Initial build

- Converted the scanned 2015 paper run-report form into an HTML/JavaScript
  single-page application.
- Established the auto-saving state model, the tab structure, and the first PDF
  generators (completed report and blank form).
- Loaded the roster from `personnel.json` with a built-in fallback, and added the
  `manage-personnel.html` admin page.

### Roster reload + Dispatch

- Added a **Reload Roster** button in the header to re-fetch `personnel.json` on
  demand.
- Reworked the Dispatch tab so selecting a dispatch type reveals the actual-dispatch
  text box inline beneath it, and removed the separate description box.

### Incident tab cleanup

- Made all Incident input fields uniform height and width.
- Changed Incident Commander to a roster dropdown (stores the badge).
- Changed Entered By to a roster dropdown and removed the Badge # field.
- Made the address field appear only after a location type is selected.
- Left-aligned the date fields.
- Later removed Entered By and Entry Date entirely.

### Personnel + Remarks

- Moved the Personnel Injured fields (name, badge, report filed) out of the Personnel
  tab into their own sub-section on the Remarks tab.
- Made the injured-person Name a roster dropdown that auto-fills the badge number.
- Removed the Page / Of fields from the Remarks signature card.

### MVA (Vehicles)

- Added a dropdown of common vehicles for the make/model field, with an “Other”
  free-text fallback.
- Added a dropdown of standard colors, with an “Other” fallback.
- Renamed “Car” to “Vehicle” throughout.
- Made vehicles progressive: one shows at first, the next appears as each is filled
  in, up to six.

### Law Enforcement

- Made officer entries progressive (the next row appears after the previous is
  filled).
- Added an agency dropdown (NY State Police, Cayuga County Sheriff’s Dept, City of
  Auburn Police, Other).
- Moved Law Enforcement to its own dedicated tab after EMS.

### EMS

- Made ambulances progressive (one shown, next appears when a service is selected).
- Removed the ALS field; added a PCR number to each ambulance.
- Replaced the generic PCR section with a progressive “Refused Transport PCR #”
  section.

### Mutual Aid

- Moved the Mutual Aid card to the Incident tab below the address.
- Added a Given/Received dropdown and an agency dropdown (Throop, Cayuga, Seneca
  Falls, Owasco, Auburn, Union Springs, Port Byron, Weedsport, Fleming, Montezuma,
  Aurora, Other).
- Made it support multiple agencies (up to 12) with progressive selection.

### Signature + calculations

- Replaced the Report-By text field with a **touchscreen signature pad** (finger or
  stylus) plus a roster dropdown to record who signed.
- Added a **Total Call Time** calculation (Dispatch → In Quarters), shown on the Times
  tab.
- Added a **Total Personnel Hours** calculation (personnel × call time), shown on the
  Personnel tab’s Counts card.

### Keyboard / input fixes

- Fixed a bug where typing in the MVA plate, EMS PCR, and Law fields closed the
  keyboard after one character. These fields now save when you leave the field rather
  than re-rendering on every keystroke.

### Navigation

- Removed the redundant Save button (auto-save makes it unnecessary) and replaced the
  navigation with simple Back / Next buttons.

### Email sharing

- Added the “Generate PDF & Send via Email” button using the native share sheet on
  iOS and Android, with sensible fallbacks for older browsers and desktop.

### PDF formatting (iterative)

- Redesigned the completed PDF several times for a cleaner, more modern look while
  keeping it black-and-white-print friendly.
- Converted the layout to fixed sizing so elements don’t reflow, and locked it to the
  8.5 × 11 page.
- Ensured driver names show full name and badge number.
- Split **Personnel on Scene onto its own page** so everything else fits on page 1,
  and gave page 1 a minimum height so the page break lands cleanly and the personnel
  list always renders.
- Reworked the blank hand-fill form to three pages (dropping the dispatch-type and
  location-type checkbox grids), keeping each section whole across page breaks, with
  the 40-slot personnel roster on its own page.

### Stability fixes

- Fixed several crashes caused by leftover/duplicate code and a broken expression that
  had stopped the app from loading.
- Hardened the PDF generator so it injects body content into the page container
  correctly (an earlier version produced a blank page because a full HTML document was
  being injected into a `div`).
- Made startup resilient: the app boots immediately with the built-in roster, loads
  the live roster in the background, and shows a clear on-screen error if anything
  fails during boot instead of a blank screen.

-----

## Troubleshooting

- **App shows only the header / blank screen:** Do a hard refresh, or append `?v=2` to
  the URL to bypass the browser cache. If a returning user’s old saved data is
  involved, use **Clear all form data** to reset.
- **PDF button does nothing:** The `html2pdf` library loads from a CDN; check the
  internet connection.
- **Roster looks out of date:** Tap **Reload Roster**, or confirm the updated
  `personnel.json` was committed to the repo.

-----

*Built for Aurelius Fire and Rescue.*