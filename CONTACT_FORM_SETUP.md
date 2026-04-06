# Contact form email setup

This website is static HTML/CSS/JS, so the best integration is **Basic HTML form POST** to Formspree (no SDK or backend required).

## Current configured endpoint

The form is now configured to submit to:

- `https://formspree.io/f/mbdpqnnr`

in `partials/contact.html`.

## How it works

- Browser submits the form directly to Formspree with `method="POST"`.
- Formspree forwards the message to your designated mailbox.
- A hidden `_subject` field sets a useful email subject line.
- A hidden `_gotcha` field acts as a lightweight spam trap.

## If you ever need to change the destination form

1. Create/open another form in Formspree.
2. Copy its endpoint URL.
3. Replace the `action` URL in `partials/contact.html`.
4. Deploy and send a test submission.

## Front-end behavior

- `scripts/main.js` now keeps native form POST behavior (no AJAX interception).
- On submit, it only handles client validation and shows a "Sending…" status while disabling the submit button.
