---
title: Minimal React (Web) project setup
type: page
source: "https://canvas.kth.se/courses/65821/pages/minimal-react-web-project-setup"
saved: 2026-11-25
tags: [project, react, vite, setup]
summary: Minimal 4-file React + Vite setup (package.json, vite.config.js with minify false, index.html, src/index.jsx).
---

# Minimal React (Web) project setup

You can create a React Vite project with 4 files: `package.json`, `vite.config.js`, `index.html`, `src/index.jsx`

Make a new folder, add a file **package.json**

```json
{
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "serve": "vite preview"
    },
    "devDependencies": {
        "vite": "latest",
        "@vitejs/plugin-react": "latest"
    },
    "dependencies": {
      "firebase": "latest",
      "mobx": "latest",
      "mobx-react-lite": "latest",
      "react": "latest",
     "react-dom": "latest",
  "react-router-dom": "latest"
    }
}
```

`npm install` should work already! Once all of this howto works, you may want to upgrade some of the dependency versions or add more dpendencies (redux, react-redux, recoil). Wipe node_modules before running npm install again

**If you don't want to use Mobx for application state** just remove `mobx` and `mobx-react-lite` and add Recoil or Redux (and react-redux), or Zustand, etc.

Then the Vite config file **vite.config.js** which simply lets you skip window.React={createElement} and sets the port to 8080. The React plugin also gives hot module replacement of stateful components.

```js
import { defineConfig } from 'vite';
import reactJsxPlugin from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        reactJsxPlugin(),
    ],
    server: {
        port: 8080,
    },
    build: {
        sourcemap: true,
        minify: false
    }
});
```

and an **index.html** file (first line ensures responsiveness on mobile devices)

```html
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<div id="root"></div>
<script type="module" src="/src/index.jsx"></script>
```

Bootstrapping **src/index.jsx**

```jsx
// TODO make a reactive model (application state), pass it as prop to the components used
import {createRoot} from "react-dom/client";
const mountedApp= createRoot(document.getElementById('root'))
mountedApp.render(<div>hello world!</div>);  
```

You're good to go: **`npm run dev`**
