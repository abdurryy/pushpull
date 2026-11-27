// View: explains an unknown route and gives players a way back home.
import { Link } from "react-router-dom";
import { StatusMessage } from "./statusMessage.jsx";
import "./notFoundView.css";

export function NotFoundView() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <StatusMessage kind="error">The link may be old, or the address may have a typo.</StatusMessage>
      <Link className="button" to="/">Back to home</Link>
    </main>
  );
}
