// The same top bar as the AI Tutor: Akbar logo, product name and the soft
// light and dark switch.

// Rounded outline icons, the same as the AI Tutor's switch.
const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// A soft pill with a sun and a moon; the active one sits in a darker block.
function ThemeToggle({ theme, onSetTheme }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      <button
        type="button"
        aria-pressed={theme === 'light'}
        aria-label="Light theme"
        title="Light theme"
        onClick={() => onSetTheme('light')}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        aria-label="Dark theme"
        title="Dark theme"
        onClick={() => onSetTheme('dark')}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

export default function TopBar({ theme, onSetTheme }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <a className="topbar-logo" href="/" aria-label="Akbar Academy">
          {/* Same logos as akbaracademy.vercel.app: the tagline is blue in
              light mode and white in dark mode. CSS shows the right one. */}
          <img className="logo-light" src="/brand/logo-light.png" alt="Akbar Academy" width="1900" height="578" />
          <img className="logo-dark" src="/brand/logo-dark.png" alt="" aria-hidden="true" width="1500" height="450" />
        </a>

        <div className="topbar-product">
          <span className="name">
            Quiz <em>Wizard</em>
          </span>
          <span className="tagline">Past paper worksheet builder</span>
        </div>

        <span className="topbar-spacer" />

        <ThemeToggle theme={theme} onSetTheme={onSetTheme} />
      </div>
    </header>
  );
}
