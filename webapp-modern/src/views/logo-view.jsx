/* Static lounge page displayed when no conversation is selected. */
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { APP_NAME } from '../config.js';

export default class LogoView extends React.PureComponent {
  render() {
    return (
      <div id="dummy-view">
        <div className="relay-lounge-card">
          <div className="relay-lounge-brand">
            <img id="logo" alt="Relay" src="img/logo.svg" />
            <h2>Relay</h2>
          </div>
          <p className="relay-lounge-tagline">
            Send and receive messages in real time, share files, and start HD voice &amp; video calls right from your browser.
          </p>
          <div className="relay-lounge-features">
            <span className="relay-lounge-pill">
              <i className="material-icons">bolt</i> Instant Sync
            </span>
            <span className="relay-lounge-pill">
              <i className="material-icons">videocam</i> WebRTC Calls
            </span>
            <span className="relay-lounge-pill">
              <i className="material-icons">lock</i> Private &amp; Fast
            </span>
          </div>
          <div className="relay-lounge-meta">
            <span><FormattedMessage id="label_client" defaultMessage="Client:"
              description="Label for a client version" /> {APP_NAME}</span>
            <span>&bull;</span>
            <span><FormattedMessage id="label_server" defaultMessage="Server:"
              description="Label for a server version" /> {this.props.serverAddress}</span>
          </div>
        </div>
      </div>
    );
  }
};
