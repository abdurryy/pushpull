---
title: Project submission
type: assignment
source: "https://canvas.kth.se/courses/65821/assignments/402345"
saved: 2026-11-25
due: "2026-12-23 19:00 (Stockholm)"
grading: ungraded
submission: group, text
attempts: unlimited
tags: [project, deliverable, submission]
summary: "Deliverable 3, due 2026-12-23: final submission checklist (members, deployed non-minified app, repo and README, per-user persistence, user-feedback docs)."
---

# Project submission

See [grading criteria](../project/grading-criteria.md).

Please submit:

1. Name of the group participants and Canvas IDs.
   - It is important to confirm who worked in the group so the credit does not go to somebody else.
2. Link to running version of the web app (**deployed**).
   - For Native you can either [deploy to expo.dev](https://canvas.kth.se/courses/65821/pages/tw3-app-deployment-native) **or** make sure we can run your app easily to run `npm run expo` and scan the QR code
   - Please **make sure that you do not deploy minified code ([React](../project/minimal-react-web-setup.md), [Vue](https://canvas.kth.se/courses/65821/pages/minimal-vue-project-setup))** <- click link for details (make sure your build configuration looks similar)
   - Please check if there are any CORS errors in the console. To solve the errors, you can [use the course proxy for your API](https://canvas.kth.se/courses/65821/pages/d-dot-1-1-http-basics-in-fetch-tw2-dot-1#section-cors).
   - Please make sure that you have separated persisted data per authenticated user. For reference, read [this page](https://canvas.kth.se/courses/65821/pages/g3a50998d5f52fdf17629608e3a275333).
3. Link to your GitHub repository.
   - The repository must be accessible by the course TAs.
   - All group members must commit, in reasonable proportion.
   - Please include a brief README file explaining how to setup your project, and indicate where you use 3rd party components in your code (user-visible, written by others for the framework you use).
4. Text files (gladly with pictures) on documented user feedback and how it was acted upon.
5. Other comments you wish to add.
