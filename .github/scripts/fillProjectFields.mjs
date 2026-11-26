// Automation: copies Priority, Target date and View/presenter from an issue to the project board.
// Run by .github/workflows/project-fields.yml with a token (PROJECT_TOKEN) that can edit the board.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const OWNER = process.env.PROJECT_OWNER || "abdurryy";
const PROJECT_NUMBER = process.env.PROJECT_NUMBER || "2";
const REPO = process.env.GITHUB_REPOSITORY || "abdurryy/pushpull";
const PROJECT = "users/" + OWNER + "/projectsV2/" + PROJECT_NUMBER;
// This is the issue field ID. The project's old text column has a different ID.
const VIEW_FIELD_ID = Number(process.env.VIEW_PRESENTER_FIELD_ID || "50428070");

function request(endpoint, { method = "GET", body, filter } = {}) {
  const args = ["api", endpoint, "-H", "X-GitHub-Api-Version: 2026-03-10", "--method", method];
  if (body) args.push("--input", "-");
  if (filter) args.push("--paginate", "--jq", filter);

  const result = execFileSync("gh", args, {
    encoding: "utf8",
    input: body ? JSON.stringify(body) : undefined,
  }).trim();
  return result ? JSON.parse(result) : null;
}

// The first real line under "## <heading>" in the issue body, ignoring <!-- comments -->.
function sectionValue(body, heading) {
  const withoutComments = body.replace(/<!--[\s\S]*?-->/g, "");
  const lines = withoutComments.split(/\r?\n/);
  const start = lines.findIndex(function isHeadingCB(line) {
    return line.trim().toLowerCase() === "## " + heading.toLowerCase();
  });
  if (start === -1) return "";
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) return "";
    if (line.trim() !== "") return line.trim();
  }
  return "";
}

function loadIssue() {
  let number = process.argv[2];
  if (number === undefined && process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    number = event.issue?.number ?? event.inputs?.issue_number;
  }
  if (!/^[1-9]\d*$/.test(String(number)) || process.argv.length > 3) {
    throw new Error("Usage: node .github/scripts/fillProjectFields.mjs <issue-number>");
  }
  // Read the latest body, even when rerunning an older issue event.
  return request("repos/" + REPO + "/issues/" + number);
}

function findProjectItem(issueId, fieldIds) {
  const query = ".[] | select(.content.id == " + issueId + ")";
  return request(PROJECT + "/items?per_page=100&fields=" + fieldIds.join(","), { filter: query });
}

async function findOrAddProjectItem(issueId, fieldIds) {
  const existing = findProjectItem(issueId, fieldIds);
  if (existing) return existing;

  try {
    return request(PROJECT + "/items", { method: "POST", body: { type: "Issue", id: issueId } });
  } catch (error) {
    // The board's auto-add can win the race after the lookup.
    if (!String(error.stderr).includes("Content already exists in this project")) throw error;
    // A recently added card may take a few seconds to appear in the items list.
    for (const waitMs of [500, 1000, 2000, 4000]) {
      await delay(waitMs);
      const added = findProjectItem(issueId, fieldIds);
      if (added) return added;
    }
    throw new Error("The board accepted the issue but its card is not visible yet. Rerun this issue when the card appears.");
  }
}

async function syncProjectFields(issue, priority, targetDate) {
  const fields = request(PROJECT + "/fields?per_page=100");
  const priorityField = fields.find(function priorityCB(field) { return field.name === "Priority"; });
  const dateField = fields.find(function dateCB(field) { return field.name === "Target date"; });
  if (!priorityField || !dateField) {
    throw new Error("The board must have Priority and Target date fields.");
  }

  const item = await findOrAddProjectItem(issue.id, [priorityField.id, dateField.id]);
  const currentPriority = item.fields?.find(function priorityCB(field) { return field.id === priorityField.id; });
  const currentDate = item.fields?.find(function dateCB(field) { return field.id === dateField.id; });
  const option = priorityField.options.find(function matchesCB(choice) { return choice.name.raw === priority; });
  const updates = [];
  if (option && currentPriority?.value?.id !== option.id) {
    updates.push({ id: priorityField.id, value: option.id });
  }
  if (targetDate && currentDate?.value?.slice(0, 10) !== targetDate) {
    updates.push({ id: dateField.id, value: targetDate });
  }
  if (updates.length) {
    request(PROJECT + "/items/" + item.id, { method: "PATCH", body: { fields: updates } });
  }

  console.log("Priority: " + (option?.name.raw || "not set (write P0, P1 or P2 under ## Priority)"));
  console.log("Target date: " + (targetDate || "not set (no date and no milestone due date)"));
}

function syncViewField(number, text) {
  if (!text) {
    console.log("View/presenter: not set (write it under ## View/presenter)");
    return;
  }
  const endpoint = "repos/" + REPO + "/issues/" + number + "/issue-field-values";
  const fields = request(endpoint);
  const existing = fields.find(function viewCB(field) { return field.issue_field_id === VIEW_FIELD_ID; });
  if (existing?.value !== text) {
    // POST updates this field without replacing the issue's other values.
    request(endpoint, { method: "POST", body: { issue_field_values: [{ field_id: VIEW_FIELD_ID, value: text }] } });
  }
  console.log("View/presenter: " + text);
}

async function main() {
  const issue = loadIssue();
  if (issue.pull_request) throw new Error("Pass an issue number, not a pull request number.");
  const body = issue.body || "";
  const priority = sectionValue(body, "Priority").toUpperCase();
  const writtenDate = sectionValue(body, "Target date");
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(writtenDate) ? writtenDate : issue.milestone?.due_on?.slice(0, 10);

  await syncProjectFields(issue, priority, targetDate);
  syncViewField(issue.number, sectionValue(body, "View/presenter"));
}

await main();
