// Automation: copies Priority, Target date and View/presenter from an issue to the project board.
// Run by .github/workflows/project-fields.yml with a token (PROJECT_TOKEN) that can edit the board.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const OWNER = process.env.PROJECT_OWNER;
const PROJECT_NUMBER = process.env.PROJECT_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

// Runs the GitHub CLI without a shell, so text from the issue can't be run as a command.
function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function graphql(query, variables) {
  const args = ["api", "graphql", "-f", "query=" + query];
  Object.entries(variables).forEach(function addVariableCB([name, value]) {
    args.push("-f", name + "=" + value);
  });
  return JSON.parse(gh(args)).data;
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

function main() {
  const issue = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")).issue;
  const body = issue.body || "";

  const priority = sectionValue(body, "Priority").toUpperCase();
  const writtenDate = sectionValue(body, "Target date");
  const milestoneDate = issue.milestone && issue.milestone.due_on ? issue.milestone.due_on.slice(0, 10) : "";
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(writtenDate) ? writtenDate : milestoneDate;
  const viewPresenter = sectionValue(body, "View/presenter");

  // Adding an issue that is already on the board just returns its existing item.
  const item = JSON.parse(gh(["project", "item-add", PROJECT_NUMBER, "--owner", OWNER, "--url", issue.html_url, "--format", "json"]));
  const project = JSON.parse(gh(["project", "view", PROJECT_NUMBER, "--owner", OWNER, "--format", "json"]));
  const fields = JSON.parse(gh(["project", "field-list", PROJECT_NUMBER, "--owner", OWNER, "--format", "json"])).fields;
  function fieldCB(name) {
    return fields.find(function hasNameCB(field) { return field.name === name; });
  }
  const editItem = ["project", "item-edit", "--id", item.id, "--project-id", project.id];

  const priorityField = fieldCB("Priority");
  const option = priorityField && priorityField.options.find(function matchesCB(o) { return o.name === priority; });
  if (option) {
    gh([...editItem, "--field-id", priorityField.id, "--single-select-option-id", option.id]);
    console.log("Priority: " + priority);
  } else {
    console.log("Priority: not set (write P0, P1 or P2 under ## Priority)");
  }

  const dateField = fieldCB("Target date");
  if (dateField && targetDate) {
    gh([...editItem, "--field-id", dateField.id, "--date", targetDate]);
    console.log("Target date: " + targetDate + (targetDate === milestoneDate ? " (from the milestone)" : ""));
  } else {
    console.log("Target date: not set (no date and no milestone due date)");
  }

  // View/presenter is an issue field: it's stored on the issue itself, so it has its own mutation.
  if (viewPresenter) {
    const [owner, name] = REPO.split("/");
    const repo = graphql(
      "query($owner:String!,$name:String!){repository(owner:$owner,name:$name){issueFields(first:50){nodes{... on IssueFieldText{id name}}}}}",
      { owner, name },
    ).repository;
    const viewField = repo.issueFields.nodes.find(function isViewFieldCB(field) { return field.name === "View/presenter"; });
    if (viewField) {
      // New issues may not have a value yet. This mutation creates it or updates it.
      graphql(
        "mutation($issue:ID!,$field:ID!,$text:String!){setIssueFieldValue(input:{issueId:$issue, issueFields:[{fieldId:$field, textValue:$text}]}){clientMutationId}}",
        { issue: issue.node_id, field: viewField.id, text: viewPresenter },
      );
      console.log("View/presenter: " + viewPresenter);
    }
  } else {
    console.log("View/presenter: not set (write it under ## View/presenter)");
  }
}

main();
