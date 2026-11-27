// View: introduces Push/Pull and lets visitors choose this device's role.
import "./homeView.css";
import { AccountSignIn } from "./accountSignIn.jsx";
import { GameBoard } from "./gameBoard.jsx";
import { PushMark } from "./pushMark.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamChip } from "./teamChip.jsx";

// A sample turn shows one pair agreeing and the other pair pulling apart.
const PREVIEW_SNAKES = [
  {
    team: "a",
    heading: "right",
    body: [
      { x: 5, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ],
  },
  {
    team: "b",
    heading: "left",
    torn: true,
    body: [
      { x: 8, y: 5 },
      { x: 9, y: 5 },
      { x: 10, y: 5 },
      { x: 11, y: 5 },
      { x: 11, y: 4 },
      { x: 11, y: 3 },
      { x: 10, y: 3 },
    ],
  },
];

const PREVIEW_APPLES = [{ x: 8, y: 2 }, { x: 5, y: 6 }];
const PREVIEW_INPUTS = { a: ["right", "right"], b: ["up", "down"] };

export function HomeView(props) {
  function renderAccountAction() {
    if (!props.authChecked) {
      return <StatusMessage>Checking…</StatusMessage>;
    }
    if (props.user) {
      return (
        <a className="button button-secondary" href="#/profile">
          <span className="icon" aria-hidden="true">account_circle</span>
          View profile
        </a>
      );
    }
    return <AccountSignIn status={props.status} error={props.error} onSignIn={props.onSignIn} label="Sign in" secondary />;
  }

  return (
    <main className="home">
      <header className="home-header">
        <div className="home-logo">
          <PushMark variant="entry" />
          PUSH/PULL
        </div>
        <div className="home-account">{renderAccountAction()}</div>
      </header>

      <div className="home-hero">
        <section className="home-intro" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            <span>Two friends.</span>
            <span>One <span className="home-title-snake">snake</span>.</span>
          </h1>
          <p className="home-lead">
            Four friends, one TV. Each pair steers a snake with their phones.
          </p>

          <nav className="home-choices" aria-label="Choose this device’s role">
            <a className="button home-choice" href="#/tv">
              <span className="icon" aria-hidden="true">tv</span>
              Play on TV
            </a>
            <a className="button button-secondary home-choice" href="#/play/login">
              <span className="icon" aria-hidden="true">smartphone</span>
              Use phone
            </a>
          </nav>
          <nav className="home-extras" aria-label="Demo and testing">
            <a href="#/room">Host a room playtest</a>
            <a href="#/demo">Keyboard demo</a>
            <a href="#/components">Component gallery</a>
          </nav>
        </section>

        <figure className="home-preview">
          <figcaption className="home-preview-header">
            <span>Double Snake</span>
            <div className="home-teams">
              <TeamChip team="a" />
              <TeamChip team="b" />
            </div>
          </figcaption>
          <GameBoard
            columns={14}
            rows={8}
            snakes={PREVIEW_SNAKES}
            apples={PREVIEW_APPLES}
            inputs={PREVIEW_INPUTS}
            label="Team A steers its snake toward an apple. Team B’s two players steer in opposite directions, stopping their snake."
          />
          <p className="home-preview-copy">Steer together. Pull apart to stop.</p>
        </figure>
      </div>
    </main>
  );
}
