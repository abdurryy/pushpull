---
title: Project advice
type: page
source: "https://canvas.kth.se/courses/65821/pages/project-advice"
saved: 2026-11-25
tags: [project, workflow, mvp, api, deployment, persistence, auth]
summary: "Recommended step-by-step workflow for the project: repo and .gitignore, Vite setup, API keys, promise state, presenters, deploy early, model ownership, persistence, auth, navigation, user testing."
---

# Project advice

**User experience** [slides used at the lecture](https://docs.google.com/presentation/d/1l6zjcnWJZib-DbMerVDL832DchAEyvP_MNDb1lHSQuw/edit#slide=id.g29e124abe43_0_96)

See also [per-user persistence](https://canvas.kth.se/courses/65821/pages/authentication-and-per-user-persistence-firebase)
Notes before you start:

1. No project can be done individually.
2. Feel free to utilize any user interface (UI) technology, including those not covered in the course, such as React Native, Swift, Flutter, etc.

Here is a suggestion for how to proceed in a project:

1. Make sure that the group understands the grading criteria, and you know what grade you aim for. Discuss with your coach. You are supposed to work 20h in HT (1 period), 10h in VT (2 periods) per week per person. **You can use any code from the lab**. If you did not write that code (you got it from us), add a comment acknowledging that.
2. Make a paper sketch of your app. Show it to some users, get some feedback
3. A KTH-git repo will be created for you
   - you must include a **.gitignore** file. The one from the lab should work. `node_modules` and `dist` are a must to ignore!
   - Using branches is not absolutely necessary because in a well managed MVP project students generally work on different files each
   - don't forget to `git pull` every time you start working!
4. Create `package.json`, vite.config.js, index.html, and your bootstrapping index.jsx, as per the [minimal React](minimal-react-web-setup.md) or [minimal Vue](https://canvas.kth.se/courses/65821/pages/minimal-vue-project-setup) setup
   - `npm install`, `npm run dev` should work like in the lab
     - For Vue, if you instead use vite-create for vue, it may produce .vue files, that does not (at all) mean that you cannot use JSX files!
   - Whenever you need to add a new npm package, add it to `package.json` with the version you want (look at its npmjs.com page, [example](https://www.npmjs.com/package/firebase)), and run `npm install` again
5. Choose an API, make sure you get the right keys. You will need to **subscribe** to the API to get your key!
   - The course pays for APIs up to 200 SEK. Get a receipt (kvitto) and we can swish the money, or ask [dh2642-ta@eecs.kth.se](mailto:dh2642-ta@eecs.kth.se) how to proceed
   - Some APIs cannot be accessed from browsers, use the course proxy for that, as you did in the lab.
   - **Recommendation**: Start a module that talks to the API, like the lab dishSource. Export a function that does an initial API object retrieval for now
6. **Recommendation,** Render some API data (a View like DetailsView, or SearchResultsView).
   - In your initial bootstrapping, you can **temporarily** mount the View when the promise resolves, to skip (for now) the suspense and the presenter:
     `getMyAPIObject().then(mountACB)`
     where the function `mountACB` mounts `<View someProp={apiResult} />`
     - **React** `function mountACB(apiResult){ createRoot(document.getElementByID("root")).render(<View ../>); }`
     - **Vue** `function mountACB(apiResult){ createApp (function App(){ return <View ../>; }).mount("#root"); }`
7. **Recommendation** promise state in reactive model, simple presenter
   In bootstrapping, make a reactive mini-model that contains just a promise state object. Bootstrapping can (for now) resolve the promise `getMyAPIObject()`, in that promise state, and mount this component, with the reactive model mini-model as prop.
   - `function MockPresenter(props){ return JSON.stringify(props.model.somePromiseState); }`
     - don't forget the observer for React
   - in bootstrapping remove the promise resolve (you use the one in your resolvePromise code) with rendering the mock presenter
   - when testing the app you should see the promise state ”live”
8. Instead of a mock presenter, make a Presenter for the View you made at step 6. It can show suspense, and show the View that visualizes the API object. In the bootstrapping, replace the mock presenter above.
9. Time to [deploy](https://canvas.kth.se/courses/65821/pages/tw3-app-deployment) already! The earlier you deploy, the better, as the course team can troubleshoot directly in your deployed app
10. Time to plan the app:
    - Make a paper mock-up or other low-fidelity prototype (powerpoint, figma, balsamiq). This will help group members have a common understanding of what the project is going to achieve
    - **Test your mock-up with users** and document that as part of your project submission
    - Decide what data and methods are going to be in the Model. This may change as the project grows, and then you'll have to commit to the Model, which everybody uses.
    - Maybe name an **Application state (model) responsible** who makes sure that there are no conflicts, and notifies all group members to pull the new Model.
    - Move the resolvePromise you had in bootstrapping to a Model method
11. The boostrapping can now be changed to get an initial version of the Model, make it reactive, pass it to a root app that shows the presenter above
12. What Presenter-View pairs will you have? Who will take care of each? Such pairs are independent of each other, you can divide the labour in the group as necessary, also avoiding git conflicts
    - Alternatively you can split the work by just Views and let the Presenters in the care of one person. One presenter can be quite simple (see [keeping your presenter simple](keeping-presenter-simple.md)), so it might make sense for one group member to take care of several
    - View folk will generally be good at the **general app layout** (flex, grid, etc)
13. Who will take care of the **API module** (dishSource)? This is pretty independent code from the P-V modules.
14. Who will take care of **persistence**? That person can work independently from the P-V people. In cooperation with (or same as) the Model person(s)
15. Who will take care of **authentication**? It is well connected to persistence, but you also affects rendering (do we show a login link or the app?). Start to plan [per-user persistence](https://canvas.kth.se/courses/65821/pages/authentication-and-per-user-persistence-firebase) if that makes sense for your use case (it usually does)
16. What is the **navigation** going to be? Is it logical for a user? Who will take care of it? Add it in the root component.
17. **Evaluate** your deployed app with users as often as necessary
