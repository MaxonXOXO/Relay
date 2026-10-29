// Relay application info panel (Support links disabled).
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { APP_NAME } from '../config.js';

export default class AccSupportView extends React.PureComponent {
  render() {
    return (
      <div className="scrollable-panel">
        <div className="panel-form-column">
          <div className="panel-form-row">
            <label className="small"><FormattedMessage id="label_client" defaultMessage="Client:"
              description="Label for a client version" /></label>
            {APP_NAME}
          </div>
          <div className="panel-form-row">
            <label className="small"><FormattedMessage id="label_server_address" defaultMessage="Server address:" /></label>
            {this.props.serverAddress}
          </div>
        </div>
      </div>
    );
  }
};
