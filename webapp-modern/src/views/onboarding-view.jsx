// Onboarding / Welcome launch screen for Relay.
import React from 'react';

const SLIDES = [
  {
    icon: 'forum',
    badge: 'Real-Time Messaging',
    title: 'Welcome to Relay',
    description: 'Fast, reliable, and distraction-free messaging. Share rich text, files, voice notes, and group conversations in real time.'
  },
  {
    icon: 'videocam',
    badge: 'WebRTC Calling',
    title: 'HD Voice & Video Calls',
    description: 'Start direct peer-to-peer audio and video calls with a single tap right from the chat header — with zero relay lag.'
  },
  {
    icon: 'dark_mode',
    badge: 'Modern Interface',
    title: 'Crafted for Comfort',
    description: 'Seamlessly switch between Light, Dark, and System themes with custom vector chat wallpapers and adjustable typography.'
  }
];

export default class OnboardingView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      step: 0
    };
    this.handleNext = this.handleNext.bind(this);
    this.handleGetStarted = this.handleGetStarted.bind(this);
    this.handleCreateAccount = this.handleCreateAccount.bind(this);
  }

  handleNext(e) {
    e.preventDefault();
    if (this.state.step < SLIDES.length - 1) {
      this.setState({ step: this.state.step + 1 });
    } else {
      this.handleGetStarted(e);
    }
  }

  handleGetStarted(e) {
    if (e) e.preventDefault();
    if (this.props.onGetStarted) {
      this.props.onGetStarted();
    }
  }

  handleCreateAccount(e) {
    if (e) e.preventDefault();
    if (this.props.onCreateAccount) {
      this.props.onCreateAccount();
    }
  }

  render() {
    const slide = SLIDES[this.state.step];
    return (
      <div id="onboarding-view" className="onboarding-panel">
        <div className="onboarding-hero">
          <div className="onboarding-brand">
            <img src="img/logo.svg" alt="Relay" className="onboarding-logo" />
            <span className="onboarding-brand-name">Relay</span>
          </div>

          <div className="onboarding-card" key={this.state.step}>
            <div className="onboarding-icon-badge">
              <i className="material-icons">{slide.icon}</i>
            </div>
            <span className="onboarding-pill">{slide.badge}</span>
            <h2 className="onboarding-title">{slide.title}</h2>
            <p className="onboarding-desc">{slide.description}</p>
          </div>

          <div className="onboarding-dots" role="tablist" aria-label="Onboarding steps">
            {SLIDES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className={'onboarding-dot' + (idx === this.state.step ? ' active' : '')}
                aria-label={`Slide ${idx + 1}: ${s.title}`}
                onClick={() => this.setState({ step: idx })}
              />
            ))}
          </div>
        </div>

        <div className="onboarding-actions">
          <button type="button" className="primary onboarding-btn-main" onClick={this.handleGetStarted}>
            <span>Get Started</span>
            <i className="material-icons">arrow_forward</i>
          </button>
          <button type="button" className="outline onboarding-btn-secondary" onClick={this.handleCreateAccount}>
            Create New Account
          </button>
          {this.state.step < SLIDES.length - 1 ? (
            <a href="#" className="onboarding-next-link" onClick={this.handleNext}>
              Next feature ({this.state.step + 1}/{SLIDES.length}) &rarr;
            </a>
          ) : (
            <span className="onboarding-footnote">
              Instant sign-up enabled &bull; End-to-end synchronized
            </span>
          )}
        </div>
      </div>
    );
  }
}
