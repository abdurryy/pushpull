// View: introduces Push/Pull and lets visitors choose this device's role.
import "./homeView.css";

const previewTiles = [
  { column: 2, row: 5, kind: "team-a" },
  { column: 2, row: 4, kind: "team-a" },
  { column: 2, row: 3, kind: "team-a" },
  { column: 3, row: 3, kind: "team-a" },
  { column: 4, row: 3, kind: "team-a head-right" },
  { column: 9, row: 3, kind: "team-b" },
  { column: 9, row: 4, kind: "team-b" },
  { column: 9, row: 5, kind: "team-b" },
  { column: 8, row: 5, kind: "team-b" },
  { column: 7, row: 5, kind: "team-b head-left" },
  { column: 6, row: 3, kind: "apple" },
  { column: 5, row: 6, kind: "apple" },
];

function renderTileCB(tile) {
  return (
    <span
      key={tile.column + "-" + tile.row}
      className={"home-tile " + tile.kind}
      style={{ gridColumn: tile.column, gridRow: tile.row }}
    />
  );
}

export function HomeView() {
  return (
    <main className="home">
      <header className="home-logo">
        <svg className="home-mark" viewBox="0 0 24 12" aria-hidden="true">
          <path className="home-mark-a" d="M0 0H6L12 6L6 12H0L6 6Z" />
          <path className="home-mark-b" d="M24 0H18L12 6L18 12H24L18 6Z" />
        </svg>
        PUSH/PULL
      </header>

      <div className="home-hero">
        <section className="home-intro" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            <span>Two players.</span>
            <span>One snake.</span>
          </h1>
          <p className="home-lead">
            Grab three friends, a shared TV or laptop, and a phone each.
            Split into two teams. Both teammates steer the same snake.
          </p>

          <nav className="home-choices" aria-label="Choose this device's role">
            <a className="home-choice home-choice-primary" href="#/tv">
              <span className="icon" aria-hidden="true">tv</span>
              <span className="home-choice-text">
                <strong>Use this screen as the TV</strong>
                <span>Open the shared screen for everyone.</span>
              </span>
              <span className="icon home-choice-arrow" aria-hidden="true">arrow_forward</span>
            </a>
            <a className="home-choice" href="#/play/login">
              <span className="icon" aria-hidden="true">smartphone</span>
              <span className="home-choice-text">
                <strong>Use this phone as a controller</strong>
                <span>Sign in to play on your phone.</span>
              </span>
              <span className="icon home-choice-arrow" aria-hidden="true">arrow_forward</span>
            </a>
          </nav>
        </section>

        <figure className="home-preview">
          <figcaption>Double Snake</figcaption>
          <div className="home-teams">
            <span className="home-team team-a">Team A</span>
            <span className="home-team team-b">Team B</span>
          </div>
          <div className="home-board" aria-hidden="true">
            {previewTiles.map(renderTileCB)}
          </div>
        </figure>
      </div>

      <section className="home-rules" aria-labelledby="home-rules-title">
        <h2 id="home-rules-title">How it works</h2>
        <ul>
          <li><strong>Push together</strong><span>Steer the same way to move your snake.</span></li>
          <li><strong>Pull apart</strong><span>Steer in opposite directions and your inputs cancel out.</span></li>
          <li><strong>Eat apples</strong><span>Collect apples to grow your snake.</span></li>
        </ul>
      </section>
    </main>
  );
}
