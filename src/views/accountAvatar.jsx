// View component: shows an account photo or an initial alongside the player's name.
import { ImageSkeleton } from "./imageSkeleton.jsx";
import "./loginView.css";

export function AccountAvatar({ name, photoUrl }) {
  const [initial] = name?.trim() || "?";

  return (
    <ImageSkeleton
      className="login-avatar"
      src={photoUrl}
      alt=""
      referrerPolicy="no-referrer"
      fallback={<span className="login-avatar-letter" aria-hidden="true">{initial}</span>}
    />
  );
}
