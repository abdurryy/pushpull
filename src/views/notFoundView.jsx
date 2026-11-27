// View: explains an unknown route and gives players a way back home.
import { Link } from "react-router-dom";
import { GameBoard } from "./gameBoard.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import "./notFoundView.css";

// The snakes come in from opposite sides and meet at the 404 sign.
const DEAD_END_SNAKES = [
  {
    team: "a",
    heading: "right",
    body: [
      { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 },
      { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 2 },
      { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 1 },
    ],
  },
  {
    team: "b",
    heading: "left",
    body: [
      { x: 13, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 },
      { x: 15, y: 6 }, { x: 15, y: 7 }, { x: 14, y: 7 },
      { x: 13, y: 7 }, { x: 12, y: 7 }, { x: 12, y: 8 },
    ],
  },
];

const DEAD_END_APPLES = [{ x: 9, y: 2 }, { x: 8, y: 7 }, { x: 3, y: 7 }];

export function NotFoundView() {
  return (
    <main className="not-found">
      <div className="not-found-copy">
        <h1>Page not found</h1>
        <StatusMessage kind="error">Looks like this link took a wrong turn.</StatusMessage>
      </div>
      <div className="not-found-board">
        <GameBoard
          columns={18}
          rows={10}
          snakes={DEAD_END_SNAKES}
          apples={DEAD_END_APPLES}
          label="Team A and Team B approach a 404 sign from opposite sides of the Double Snake board."
        />
        <span className="not-found-sign" aria-hidden="true">404</span>
      </div>
      <Link className="button not-found-home" to="/">Back to home</Link>
    </main>
  );
}
