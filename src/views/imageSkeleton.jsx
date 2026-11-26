// View component: reserves space for an image and shows its loading, ready or fallback state.
import { useState } from "react";
import "./imageSkeleton.css";

export function ImageSkeleton(props) {
  // Remount the image state when its source changes, including when a previous URL returns.
  return <ImageSkeletonContent key={props.src} {...props} />;
}

function ImageSkeletonContent({ src, alt, width, height, className = "", fallback, referrerPolicy, pending = false }) {
  const [status, setStatus] = useState("loading");
  const imageState = src ? status : "error";
  const state = pending ? "loading" : imageState;

  async function imageLoadedACB(event) {
    // Keep the placeholder visible until the browser has pixels ready to paint.
    try {
      await event.currentTarget.decode();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function imageFailedACB() {
    setStatus("error");
  }

  return (
    <span className={`image-skeleton ${className}`} style={{ width, height }} data-state={state}>
      {state === "error" ? (fallback ?? alt) : (
        <>
          {src && <img
            className="image-skeleton-image"
            src={src}
            alt={alt}
            referrerPolicy={referrerPolicy}
            onLoad={imageLoadedACB}
            onError={imageFailedACB}
          />}
          <span className="image-skeleton-placeholder" aria-hidden="true" />
        </>
      )}
    </span>
  );
}
