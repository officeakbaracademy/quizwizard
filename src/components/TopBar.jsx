import Icon from './Icon';
import { LOGO } from '../lib/brand';

function ThemeToggle({ theme, onSetTheme }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        aria-label="Dark theme"
        title="Dark theme"
        onClick={() => onSetTheme('dark')}
      >
        <Icon name="moon" size={16} />
      </button>
      <button
        type="button"
        aria-pressed={theme === 'light'}
        aria-label="Light theme"
        title="Light theme"
        onClick={() => onSetTheme('light')}
      >
        <Icon name="sun" size={16} />
      </button>
    </div>
  );
}

export default function TopBar({ theme, onSetTheme }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <a className="topbar-logo" href="/" aria-label="Akbar Academy">
          {/* The full colour lockup reads on both grounds, so it is the only
              one used. Electric and Mandarin hold up against black, and the
              greyscale strapline against white. */}
          <img src={LOGO.lockup} alt="Akbar Academy" width="2767" height="658" />
        </a>

        <span className="topbar-divider" aria-hidden="true" />

        <div className="topbar-product">
          <span className="name">
            Quiz <em>Wizard</em>
          </span>
          <span className="tagline">Past paper worksheet builder</span>
        </div>

        <span className="topbar-spacer" />

        <span className="topbar-strap">
          Cambridge <b>·</b> Edexcel <b>·</b> AQA
        </span>

        <ThemeToggle theme={theme} onSetTheme={onSetTheme} />
      </div>
    </header>
  );
}
