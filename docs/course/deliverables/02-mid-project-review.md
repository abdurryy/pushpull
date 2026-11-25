---
title: Mid-project review
type: assignment
source: "https://canvas.kth.se/courses/65821/assignments/402343"
saved: 2026-11-25
due: "2026-12-09 19:00 (Stockholm)"
grading: ungraded
submission: group, text or web url
attempts: unlimited
tags: [project, deliverable, mid-review, peer-review, deployment]
summary: "Deliverable 2, due 2026-12-09: deployed app, repo and README with progress, minimum expectations, and how to peer-review another group."
---

# Mid-project review

## Procedure

1. Do a **test deploy** a few days before the deadline as it takes time to set it up first (details below). Seriously, don't wait with deploying until the last day. There will surely be problems that you don't expect and they might take a lot of time to resolve. **Note:** Please check if there are any CORS errors in the console. To solve the errors, you can [use the course proxy for your API](https://canvas.kth.se/courses/65821/pages/g7fbaee43ab46f36e7b18e84ade518744).
2. By **the deadline specified below** submit your project code and link to your running (deployed) app.
   1. For Native you can either [deploy to expo.dev](https://canvas.kth.se/courses/65821/pages/tw3-app-deployment-native) **or** make sure we can run your app easily to run `npm run expo` and scan the QR code
3. If you are late with submission **the final project grade will be affected**: higher graded projects (A and B) will be lowered by one grade, while lower grades projects will be affected in borderline cases.
4. If not using the KTH git project repo that we created for you, please make your git repo **public**, for the review below and for the teachers to see the code and provide feedback.
5. After the deadline each group member will be **individually** assigned 1 other project to peer-review. You will only be assigned peer review if your group has submitted the assignment (step 1).
6. After that, you have **2 working days** to peer-review the project you have been assigned (details bellow).

## What to submit for Mid-project review

- A link to deployed/running app. You can deploy the app on [Heroku](https://devcenter.heroku.com/), [Firebase](https://firebase.google.com/docs/hosting), or any other server that anybody can easily access when doing the review. Setup this **as soon as possible** as it takes time and if you start just before the deadline you might be late.
- A link to your git repository
- A README file (in English) in your Git repository detailing:
  - Short description of your project
  - What you have done
  - What you still plan to do
  - Your project file structure (short description/purpose of each file)

Your projects are naturally at various stages of completeness, but the minimum we expect that you have by deadline is:

- that you have setup the basic framework code (e.g. the skeleton)
- have initial layout of your app
- showing the data from at least one API call

**Note:** For the implementation of user authentication, please refer to [this page](https://canvas.kth.se/courses/65821/pages/authentication-and-per-user-persistence-firebase).

## How to do the peer-review

You will be assigned a peer-review through this canvas assignment. Even though you will see the assignment as reviewing only one student (that's a limitation of Canvas), you will actually be reviewing the whole group's work.

- Review the running app:
  - Focus on layout and interaction, apply HCI evaluation methodology (e.g. [Nielsen's heuristics](http://www.nngroup.com/articles/ten-usability-heuristics), [Shneiderman's golden rules](http://faculty.washington.edu/jtenenbg/courses/360/f04/sessions/schneidermanGoldenRules.html), etc.) that you learned in a basic Human-Computer Interaction course
- Use the [grading criteria matrix](../project/project-intro-and-grading.md) and try to find points where the project might not reach a good grade.
- Reviewing the code on GitHub (you don't need to download or run it):
  - Is the architecture following the principles you learned through the course and/or the guidlines of the framework the group is using?
  - Is the code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) (Don’t Repeat Yourself)? If there is code duplication (similar segments of code repeated in several places), they should have been extracted in a loop, method or module that can be reused.
  - Naming convention: Are the files, methods and variables named in meaningful way (reflecting their purpose)? Is the same pattern used consistently throughout the code?
  - Code formatting: is the code properly indented and formatted for good readability?
- Be respectful and polite towards the group.
- Provide suggestions for improvements, instead of just pointing out flaws.
