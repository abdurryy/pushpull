// View: introduces Push/Pull and lets visitors choose this device's role.
import { Link } from "react-router-dom";
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
      return <StatusMessage>Checking sign-in…</StatusMessage>;
    }
    if (props.user) {
      return (
        <Link className="button button-secondary" to="/profile">
          <span className="icon" aria-hidden="true">account_circle</span>
          View profile
        </Link>
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
            Four friends, one TV. Two of you steer each snake, so you have to agree which way to go.
          </p>

          <nav className="home-choices" aria-label="Choose this device’s role">
            <Link className="button home-choice" to="/tv">
              <span className="icon" aria-hidden="true">tv</span>
              <span className="home-choice-label">
                Play on TV
                <span className="home-choice-role">Shared board</span>
              </span>
            </Link>
            <Link className="button button-secondary home-choice" to="/play/login">
              <span className="icon" aria-hidden="true">smartphone</span>
              <span className="home-choice-label">
                Use phone
                <span className="home-choice-role">Your controller</span>
              </span>
            </Link>
          </nav>
          <nav className="home-extras" aria-label="Demo and testing">
            <Link to="/room">Host a room playtest</Link>
            <Link to="/demo">Keyboard demo</Link>
            <Link to="/components">Component gallery</Link>
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
          <p className="home-preview-copy">Team A agrees. Team B pulls apart.</p>
        </figure>
      </div>
    </main>
  );
}
