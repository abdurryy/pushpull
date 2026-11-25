---
title: Grading criteria DH2642 and ID2216
type: grading-matrix
source: "https://docs.google.com/document/d/1luWXvJT_WEqAl4P2Fg3hNTVBOaEBdAbKADENtYJE3oo"
saved: 2026-11-25
tags: [project, grading, architecture, usability, api, persistence, cooperation]
summary: "The project grading matrix (Fx-A) for the 4 criteria: architecture/code, usability/UX, web APIs and persistence, group cooperation. Read before choosing the idea and before every deliverable."
---

# Grading criteria DH2642 and ID2216

Converted from the course's grading matrix (a Google Doc, saved as PDF). The original is a table with one column per grade. Here each criterion is a section with one list per grade. The wording is the original's. Columns Fx–D mostly describe shortcomings typical of that grade, and C–A describe what's required.

## Intended learning outcomes

Having passed the course, the student will be able to:

- choose appropriate technical platforms or JavaScript frameworks to create **highly-useable data-persistent** interactive web (DH2642) or native (ID2216) applications
- program interactive web applications according to **Model-View-Controller or related architectures**
- program systems that read data from, and send data to, **web APIs** with good **user experience**
- assess and **improve the usability** of existing interactive web applications
- **cooperate** with others to implement interactive web applications.

## How the grade is set

- The criteria below are for the **project grade**. An individual bonus applies on top of that.
- **Late projects can reach max grade C.**
- To get grade X, you need at least X on **all** criteria (or the max for a criterion, if its max is below X).
- An **A plus** on a criterion can compensate for small shortcomings in some other criterion.
- The **UX Prize** gives an extra bonus for well-designed and implemented user experience.

## 1. Architecture/code

**Separation of concerns:**

1. Persistence of application state
2. Application state (POJO model, Redux, Vuex, RxJS, Recoil, Mobx, Zustand…)
3. Presenter
4. View

Plus the navigation concern.

**Keywords:** Model-View-Presenter, Model-view-controller, user-visible third-party components (router and promise resolver/suspense do **not** count).

**Fx**
- Bugs that prevent application usage
- Application state spread out in Views
- All 4 concerns mixed (e.g. View native events save to persistence…)
- One single view of application state
- UI components access data via **global** scope/imports rather than props

**E**
- Views with multiple responsibilities/roles (e.g. mix Sidebar and Summary in one component)
- Multiple Views in a module (file)
- 3 of 4 concerns mixed (e.g. top-level state)
- No Application state (e.g. Presenters connected directly to Persistence)

**D**
- Views with multiple responsibilities/roles
- One module per View
- View-Presenter mix incidentally
- Application State mixed with Persistence but separated from Presenters and Views

**C**
- Application state separated from all other concerns
- Views with separate and clear roles
- One module per View

**B**
- None of the four main concerns mixed (Persistence, Application state, Presenter/Controller, View)
- Views with separate and clear roles. One module per View.
- At least one **user-visible component written by others**

**A**
- None of the four main concerns mixed (Persistence, Application state, Presenter/Controller, View)
- Views with separate and clear roles. One module per View.
- At least one **user-visible component written by others**
- **State manager** (Redux, Recoil, Pinia, Zustand, Mobx **with actions**). All application state side effects (e.g. persistence) use the state manager.

**A plus**
- Framework independent
- Redux mappings (connect) instead of custom hooks

## 2. Usability / user experience / improve usability

**Keywords:** target group, use case, beyond state of art, effectiveness, efficiency, satisfaction, discoverable/explorable, feedback to action, visibility of status, user in control, user experience, prototyping, formative evaluation, expert evaluation.

**Fx**
- No feedback on user actions
- Poor visibility of system status
- No user consultation
- No improvement based on usability feedback

**E**
- Effective application (a task can be accomplished) but the target group is not clear
- Inefficient user task accomplishment
- Little feedback on user actions
- Low visibility of system status
- No user consultation

**D**
- Somewhat clear target group, unclear benefits for the user
- Moderately efficient task accomplishment
- User feels somewhat in control
- Satisfactory feedback on user actions
- Satisfactory visibility of system status
- Little user consultation at prototyping or formative evaluation stage
- Some improvement based on usability feedback from users in the target group

**C**
- Clear target group, clear benefits for the user
- Efficient task accomplishment
- Good feedback on user actions
- Good visibility of system status
- User feels in control
- Moderate user satisfaction (pleasure of using the system)
- Documented user consultation, **one 30 min session** at prototyping **or** evaluation stage, documented improvements from user feedback

**B**
- Clear target group, clear benefits for the user
- Application functionality is easy to discover through exploration
- Efficient task accomplishment
- Very good feedback on user actions
- Very good visibility of system status
- User feels in control
- Good user satisfaction (pleasure of using the system)
- Documented user consultation (**30 min prototyping and 30 min formative evaluation, or 2×30 min formative evaluation**), with documented improvements from user feedback

**A**
- Clear target group, clear benefits for the user
- Application functionality is easy to discover through exploration
- Efficient task accomplishment
- Very good feedback on user actions
- Very good visibility of system status
- User feels in control
- Documented user consultation, **at least 30 min at prototyping stage and 30 min at formative evaluation stage**, with **creative** improvements from user feedback
- Very good user satisfaction

**A plus, UX prize**
- Originality (app idea **beyond state of art**)
- UX prize: very good user satisfaction
- **Responsive**/mobile-first design if it makes sense for the use case

## 3. Web APIs and persistence

**Keywords:** single vs multiple data source, app state persistence (e.g. Firebase), user authentication (e.g. Firebase).

**Fx**
- Not using any remote data
- Application state not persisted at the server
- Users can see each other's persisted data while (most cases) the application should keep it separate

**E**
- Remote data is used from a single source, to make collections **and** summaries (**dinner planner in disguise**)
- Some system status shown when waiting for API requests
- Well separated persisted data, per **authenticated** user

**D**
- Remote data is used from a single source but no dinner model in disguise! Create added value to users based on the data provided by the API
- Clear system status shown when waiting for API requests
- Well separated persisted data, per **authenticated** user

**C, B and A** (one shared cell in the original)
- Remote data is used from a single source, but no dinner planner in disguise! Create added value to users based on the data provided by the API
- Clear system status shown when waiting for API requests **and the user can choose to perform other actions while waiting** for the response to arrive
- Well separated persisted data, per **authenticated** user
- Persisted data increases usability (e.g. efficiency: user doesn't need to enter data again, users see comparisons with other users' averages etc.)

**A plus**
- **Live update of persistence.** A user running multiple copies of the app sees the same data
- **Mashing-up data** from several external sources/APIs
- **Collaborative features** on shared application state. User actions complement/help each other and user action conflicts are managed

## 4. Group cooperation

**Keywords:** balance of work, role separation, individual self-reflection.

**Fx**
- Free riding: one or more persons do all work and one does not do anything or very little (**contact project coach ASAP**)

**E**
- Good balance of work in the group
- Some role separation in the group (per component or per concern: views, interaction, model…)
- Work amount and roles documented through individual self-reflections

**D, C, B and A** (one shared cell in the original)
- Good balance of work in the group
- Role separation in the group (per component or per concern: views, interaction, model/application state…)
- Work amount and roles well documented in self-reflections

## Summary: what an A takes

This is our reading of the matrix above. If they disagree, the matrix is authoritative.

- **Architecture:** the four concerns (persistence, application state, presenter, view) fully separated. One module per View, each with one clear role. A **state manager with actions** (e.g. MobX actions), with persistence done as state-manager side effects. **At least one user-visible third-party component** (router and suspense don't count).
- **UX:** clear target group and benefit, functionality easy to discover, very good feedback and system status. **User testing documented: ≥30 min at the prototype stage and ≥30 min of formative evaluation, with creative improvements based on it.**
- **APIs/persistence:** API data used to create **added value**, not just collecting and summarising items ("dinner planner in disguise"). Users can do other things while waiting for API responses. Per-user persisted data that saves the user effort.
- **Cooperation:** balanced work, clear roles, documented in the self-reflections.
- **A plus options:** live sync across devices, combining several APIs, collaborative features, an original idea, or responsive/mobile-first design.
