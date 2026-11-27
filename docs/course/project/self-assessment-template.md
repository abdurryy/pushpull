---
title: DH2642/ID2216 project self-assessment template
type: template
source: "https://docs.google.com/spreadsheets/d/1HLldjsGFEwcxmGQJ6yQRuVT5YTGs7vFQzCmvd0RkgcI/edit?usp=sharing"
saved: 2026-11-27
tags: [project, grading, self-assessment]
summary: "Evidence prompts for the coach meeting and final project submission."
---

# Project self-assessment template

Duplicate the [official spreadsheet](https://docs.google.com/spreadsheets/d/1HLldjsGFEwcxmGQJ6yQRuVT5YTGs7vFQzCmvd0RkgcI/edit?usp=sharing) and start filling in the evidence before meeting your coach. Update it as the project develops and include it in the [final submission](../deliverables/03-project-submission.md). See the [grading criteria](grading-criteria.md) for grade requirements.

- **Group name**
- **Git link**
- **Deployed app link**

## Architecture

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| All files are named with a suffix: Model, View, Presenter, Persistence or Service | List of file names not respecting the convention | |
|  | Example of presenter with multiple views | |
|  | Code files where the Service(s) are accessed. | |
| Mixed view-presenter | Presenter files containing html code | |
|  | Justification for why it belongs in a presenter | |
| Views with clear role | List of views and their role | |
| Model connection to persistence | File implementing the dependence between model and persistence | |
|  | List of all files importing persistence | |

### A+ criteria in the template

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| User visible component written by others | Name of the component | |
|  | File where the component is used | |
|  | Prop passed down to customize the component | |
|  | Event listened to coming from the component | |
| State manager (Redux, Pinia, etc.) | Name of the state manager | |
|  | File implementing the state | |
| Framework independent Redux mappings (connect) | List of all files implementing state | |

## UX and usability

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| Feedback on user action | example of feedback in the ui | |
|  | file implementing it | |
| Visibility of system status | What status is visible? | |
|  | File implementing it | |
| User consultation learning | Link to the user consultation document. | |
|  | User comment on friction. | |
| Improvement on user consultation | Feature that removed the friction. | |
|  | Link to the code that implements it. | |
| Task that is supported by the application | Describe | |
| Clear target group | Name the group and their need | |
| Benefits to the user | Describe how the app meet the need | |
| User satisfaction | Example of satisfactory interaction | |
|  | Comment from the user | |
| User feel in control | Comment from the user | |

### A+ criteria in the template

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| Originality | Describe what puts your app apart from the industry standard | |
| Very good user satisfaction | (appreciated by the grading team) | |
| Responsive design | What is the value of switching between mobile and web? | |

## Web API

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| First source of data | link to API documentation | |
|  | data queried for the use case | |
|  | service file implementing the access | |
| Second source of data (A+) | link to API documentation | |
|  | data queried for the use case | |
|  | service file implementing the access | |
| Visible collections | What data? What is the use case? | |
|  | View implementing the collection | |
|  | Link to the app | |
| Usable summaries | What operation? On what data? | |
|  | View implementing the summary | |
|  | Link to the app | |
| Other useful data transformation | Data used as input? Output of the transformation? | |
|  | View showing the transformed data | |
|  | Link to the app | |
| Element showing waiting | When does it appear? | |
|  | In which file (view) is it used? | |
| Authentication scheme | Login provider | |
|  | Link to the login page | |
| Persisted data | What data? | |
|  | Files (Views) that display it. | |
| Per user data | What data? | |
|  | Files (Views) that display it. | |
| Data shared between users | What data is accessible by all users? | |
|  | Is it a benefit or detrimental to the privacy of users? | |

### A+ criteria in the template

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| Live update of persistence | - | |
| Mashing up data from several external sources | Describe both data being combined | |
|  | Value for the user to combine the data | |
|  | View file showing the combined data | |
| Collaborative feature | Task accomplished collaboratively | |

## Group cooperation

| Criterion | Type of evidence required | Evidence |
| --- | --- | --- |
| First group member | Responsibilities | |
|  | Files changed | |
|  | #lines of code written | |
|  | #commits | |
| Second group member | Responsibilities | |
|  | Files changed | |
|  | #lines of code written | |
|  | #commits | |
| Third group member | Responsibilities | |
|  | Files changed | |
|  | #lines of code written | |
|  | #commits | |
| Fourth group member | Responsibilities | |
|  | Files changed | |
|  | #lines of code written | |
|  | #commits | |
