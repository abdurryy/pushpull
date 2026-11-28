// View: explains an unknown route and gives players a way back home.
import { Link } from "react-router-dom";
import { StatusMessage } from "./statusMessage.jsx";
import "./notFoundView.css";

export function NotFoundView() {
  return (
    <main className="not-found">
      <div className="not-found-code" aria-hidden="true">
        <span>4</span>
        <span>0</span>
        <span>4</span>
      </div>
      <h1>Page not found</h1>
      <StatusMessage kind="error">Looks like this link took a wrong turn.</StatusMessage>
      <Link className="button" to="/">Back to home</Link>
    </main>
  );
}
