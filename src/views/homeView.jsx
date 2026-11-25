// View: the start screen. The device picks its role: the shared TV screen, or (later) a phone controller.
import "./homeView.css";

export function HomeView() {
  return (
    <main className="home">
      <h1 className="home-logo">
        <svg className="home-mark" viewBox="0 0 24 12" aria-hidden="true">
          <path className="home-mark-a" d="M0 0H6L12 6L6 12H0L6 6Z" />
          <path className="home-mark-b" d="M24 0H18L12 6L18 12H24L18 6Z" />
        </svg>
        PUSH/PULL
      </h1>
      <p className="home-lead">Four friends, two teams, one shared screen. Two phones steer one character: push the same way to move, opposite ways and you stop.</p>

      <nav className="home-choices" aria-label="Choose what this device is">
        <a className="home-choice" href="#/tv">
          <span className="icon home-choice-icon" aria-hidden="true">tv</span>
          <span className="home-choice-text">
            <strong>Use this screen as the TV</strong>
            <span>Shows the game for everyone. Open it on a laptop or smart TV.</span>
          </span>
        </a>
        <p className="home-choice home-choice-soon">
          <span className="icon home-choice-icon" aria-hidden="true">stay_current_landscape</span>
          <span className="home-choice-text">
            <strong>Use this phone as a controller</strong>
            <span>Coming soon.</span>
          </span>
        </p>
      </nav>
    </main>
  );
}
