# Deployment recovery before a playtest

Use this runbook when a Push/Pull preview fails or the live site breaks before a playtest. Identify the affected build first so the team can fix the preview or restore a verified live release.

## Identify what is deployed

1. In GitHub Deployments, select **production** for the live site or **preview** for a pull request. Record the commit, status and workflow link. For a preview, match the PR's head commit and use the latest preview link on that PR. The checkout log gives the exact merge commit built for the preview. [Deployment history](https://github.com/abdurryy/pushpull/deployments) · [Firebase Hosting workflow](../.github/workflows/firebase-hosting.yml)
2. In Firebase Hosting for `pushpull-1df2e`, check **Release history** for the live version and its release time. PR previews use channels named `pr<PR number>`. Check the channel URL and expiration in the console or run `npx firebase-tools hosting:channel:list --project pushpull-1df2e`. Use Firebase's live version as the source of truth after a console rollback. [Firebase Hosting dashboard](https://console.firebase.google.com/project/pushpull-1df2e/hosting) · [Hosting channel guide](https://firebase.google.com/docs/hosting/manage-hosting-resources)
3. Open the preview and [live site](https://pushpull.live) in separate signed-out browser sessions. Check the homepage, start a keyboard demo round and open phone sign-in. If it's unclear which build the browser received, compare the `/assets/index-*.js` script in the served HTML with the filename in the workflow's build output. Preview channels use the project's live Auth and database, so use the local emulators for a dry run that needs to write room data. [Firebase preview guide](https://firebase.google.com/docs/hosting/test-preview-deploy#step_2_preview_and_share)

## Diagnose a failed preview

- In **Actions → Firebase Hosting → Deploy Hosting**, open the first failed step. A failure in **Build with Firebase web configuration** can point to missing `VITE_FIREBASE_*` settings. A failure in **Publish a pull request preview** can point to Hosting credentials, permissions or channel quota. On quota errors, list channels and have the deployment owner identify stale previews eligible for cleanup. [Hosting workflow runs](https://github.com/abdurryy/pushpull/actions/workflows/firebase-hosting.yml)
- If the job passed but the preview is unavailable, check whether the PR closed or its channel expired. Once you've resolved the cause and confirmed the PR is still open, rerun the Hosting job for its current head and use the resulting URL from the PR. If Google sign-in alone fails with `auth/unauthorized-domain`, check the exact preview hostname under **Authentication → Settings → Authorized domains**. [Firebase Auth troubleshooting](https://firebase.google.com/docs/auth/faq-and-troubleshooting)
- Share the affected URL, commit, run link and first error with the deployment owner. Keep secret values, service-account files and `.env` contents out of the report.

## Recover the live site

1. Coordinate with Abdurrahman, the deployment owner, and hold merges while the team restores service. Find the last successful production run that passed the relevant playtest checks. Match its time and build output to a retained version in Firebase's live **Release history**. In a dry run, record the version and leave **Roll back** unselected. [Team ownership](../README.md#team)
2. For a real incident, the deployment owner can select that version's **Roll back** action in Firebase Hosting. Once the version is live, reload the live site in a fresh session and repeat the smoke checks, including the original failing step. Record the restored version and associated Git commit. [Firebase rollback steps](https://firebase.google.com/docs/hosting/manage-hosting-resources#roll_back_to_a_previous_version_of_your_site)
3. A Hosting rollback restores the web release. Coordinate any Auth or database recovery separately. Follow up with a fix or revert PR for `main` so the next automatic deploy carries the intended code.
