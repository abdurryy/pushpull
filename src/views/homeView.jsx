// View: introduces Push/Pull and lets visitors choose this device's role.
import "./homeView.css";
import { GameBoard } from "./gameBoard.jsx";
import { PushMark } from "./pushMark.jsx";
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

export function HomeView() {
  return (
    <main className="home">
      <div className="home-hero">
        <section className="home-intro" aria-labelledby="home-title">
          <header className="home-logo">
            <PushMark variant="entry" />
            PUSH/PULL
          </header>
          <h1 id="home-title" className="home-title">
            <span>Two friends.</span>
            <span>One snake.</span>
          </h1>
          <p className="home-lead">
            A party game for four. Each pair uses their phones to steer one snake on the TV.
          </p>

          <nav className="home-choices" aria-label="Choose this device’s role">
            <a className="home-choice home-choice-primary" href="#/tv">
              <span className="icon" aria-hidden="true">tv</span>
              This is the TV
              <span className="icon home-choice-arrow" aria-hidden="true">arrow_forward</span>
            </a>
            <a className="home-choice" href="#/play/login">
              <span className="icon" aria-hidden="true">smartphone</span>
              This is my phone
              <span className="icon home-choice-arrow" aria-hidden="true">arrow_forward</span>
            </a>
          </nav>
          <nav className="home-extras" aria-label="Demo and testing">
            <a href="#/demo">Play the keyboard demo</a>
            <a href="#/components">Test components and sound</a>
          </nav>
        </section>

        <figure className="home-preview">
          <figcaption>Double Snake</figcaption>
          <div className="home-teams">
            <TeamChip team="a" />
            <TeamChip team="b" />
          </div>
          <GameBoard
            columns={14}
            rows={8}
            snakes={PREVIEW_SNAKES}
            apples={PREVIEW_APPLES}
            inputs={PREVIEW_INPUTS}
            label="Team A steers its snake toward an apple. Team B’s two players steer in opposite directions, stopping their snake."
          />
          <p className="home-preview-copy">Steer together to move. Steer apart to stop.</p>
        </figure>
      </div>
    </main>
  );
}
