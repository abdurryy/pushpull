# Recipes: house-style patterns

Small patterns taken from the Views we already have. Copy them instead of inventing new ones, and rename the `xxx-` prefix to your View's name (`lobby-`, `join-`...), as the existing CSS does. Every value is a token from `src/styles/tokens.css`.

## A View with all its states

The same shape as the weather status in `lobbyView.jsx`: one function picks what to show, so every state is easy to find and explain.

```jsx
function renderContent() {
  if (props.status === "loading") {
    return (
      <StatusMessage kind="loading">Joining room {props.code}…</StatusMessage>
    );
  }
  if (props.status === "error") {
    return (
      <StatusMessage kind="error" onRetry={retryACB}>
        Couldn't join the room. Check the code and try again.
      </StatusMessage>
    );
  }
  if (props.players.length === 0) {
    return <StatusMessage kind="empty">No players yet. Scan the code with your phone to join.</StatusMessage>;
  }
  return renderPlayers();
}
```

## Buttons

Use the shared button classes from `src/styles/buttons.css`. Pick one primary action per screen, add `button-secondary` for supporting actions and use `button-text` for quiet actions such as retries. For a choice that stays set, add `aria-pressed={selected}` to a secondary button. Use a native link for navigation.

```jsx
<button className="button" type="button" onClick={startClickACB} disabled={pending} aria-busy={pending}>
  <span className="icon" aria-hidden="true">play_arrow</span>
  {pending ? "Starting round…" : "Start round"}
</button>
```

## Card

A card is a surface on the background. No border and no shadow. Inside a card, group things on `--color-sunken`.

```css
.xxx-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}

@media (min-width: 60rem) {
  .xxx-card { padding: var(--space-5); }
}
```

## Phone page

One centred column, at most `--phone-max-width` wide.

```css
.xxx {
  box-sizing: border-box;
  max-width: var(--phone-max-width);
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
  display: grid;
  gap: var(--space-6);
}
```

## Field with a visible label

```jsx
<label className="xxx-field">
  <span>Your name</span>
  <input
    className="xxx-input"
    type="text"
    value={props.name}
    onChange={nameInputACB}
    autoComplete="nickname"
    enterKeyHint="done"
  />
</label>
```

```css
.xxx-field {
  display: grid;
  gap: var(--space-2);
  font-weight: var(--weight-bold);
}

.xxx-input {
  box-sizing: border-box;
  min-height: var(--hit-min);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius);
  background: var(--color-sunken);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-regular);
}
```

The focus ring comes from `:focus-visible` in tokens.css. Never remove it.

## Team chip

Team colour always comes with a name. Orange gets ink text, blue gets white text.

```jsx
<span className="xxx-team team-a">Team A</span>
<span className="xxx-team team-b">Team B</span>
```

```css
.xxx-team {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius);
  font-weight: var(--weight-bold);
}

.xxx .team-a {
  background: var(--color-team-a);
  color: var(--color-team-a-ink);
}

.xxx .team-b {
  background: var(--color-team-b);
  color: var(--color-team-b-ink);
}
```

## TV screen frame

Fills the screen, keeps everything inside the safe area, and uses only the TV sizes. Don't hide overflow: if something doesn't fit, make it smaller or remove it. The screenshot script warns when a TV page scrolls.

```css
.xxx {
  box-sizing: border-box;
  min-height: 100dvh;
  padding: var(--tv-safe);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-6);
  font-size: var(--tv-text);
}

.xxx h1 {
  margin: 0;
  font: var(--weight-display) var(--tv-title) / 1.15 var(--font-display);
  text-wrap: balance;
}

.xxx-score {
  font: var(--weight-display) var(--tv-score) / 1 var(--font-display);
}

.xxx-timer {
  font-family: var(--font-numbers);
  font-variant-numeric: tabular-nums;
}
```

## Headings and logo

```css
.xxx-title {
  margin: 0;
  font: var(--weight-display) var(--text-hero) / 1.12 var(--font-display);
  text-wrap: balance;
}
```

The logo is `<PushMark />` next to "PUSH/PULL" in the display font, as in `homeView.jsx` and `loginView.jsx`.

## Long names

```css
.xxx-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Use it where a name has to stay on one line (team lists, the score bar). Elsewhere let it wrap with `overflow-wrap: anywhere`.

## Icons

```jsx
<span className="icon" aria-hidden="true">bolt</span>
```

The meaning goes in the visible text next to it, or in `aria-label` on the button.
