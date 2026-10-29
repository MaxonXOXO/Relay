import React from 'react';

import LetterTile from './letter-tile.jsx';
import ButtonBack from './button-back.jsx';
import ContactBadges from './contact-badges.jsx';
import MenuContacts from './menu-contacts.jsx';
import MenuStart from './menu-start.jsx';

import { sanitizeUrlForMime } from '../lib/utils.js';

export default class SideNavbar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleToggleTheme = this.handleToggleTheme.bind(this);
  }

  handleToggleTheme(e) {
    e.preventDefault();
    if (!this.props.onChangeColorSchema) {
      return;
    }
    const currentSchema = this.props.colorSchema || 'auto';
    const sysSchema = this.props.systemColorSchema || 'light';
    const rendered = currentSchema === 'auto' ? sysSchema : currentSchema;
    const target = rendered === 'dark' ? 'light' : 'dark';
    // Follow two-state toggle semantics: if target matches system preference, revert to 'auto'
    const nextSchema = (currentSchema !== 'auto' && target === sysSchema) ? 'auto' : target;
    this.props.onChangeColorSchema(nextSchema);
  }

  render() {
    const icon_badges = [];
    if (this.props.trustedBadges) {
      this.props.trustedBadges.forEach(b => {
        icon_badges.push({icon: b, color: 'badge-inv'});
      });
    }
    let avatar = null;
    if (this.props.tinode) {
      avatar = this.props.tinode.authorizeURL(sanitizeUrlForMime(this.props.avatar, 'image'));
    }
    const currentSchema = this.props.colorSchema || 'auto';
    const sysSchema = this.props.systemColorSchema || 'light';
    const rendered = currentSchema === 'auto' ? sysSchema : currentSchema;
    const themeIcon = rendered === 'dark' ? 'light_mode' : 'dark_mode';
    const themeTitle = rendered === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

    return (
      <div id="side-caption-panel" className="caption-panel">
        {this.props.onCancel ? <ButtonBack onBack={this.props.onCancel} /> : null}
        {avatar ?
          <div id="self-avatar" className="avatar-box">
            <LetterTile
              authorizeURL={this.props.tinode.authorizeURL}
              avatar={avatar}
              topic={this.props.myUserId}
              title={this.props.title} />
          </div>
          :
          null}
        <div id="sidepanel-title" className="panel-title">{this.props.title}<ContactBadges badges={icon_badges}/></div>
        {this.props.onChangeColorSchema ?
          <a href="#" className="theme-toggle-btn" onClick={this.handleToggleTheme} title={themeTitle} aria-label={themeTitle}>
            <i className="material-icons">{themeIcon}</i>
          </a>
          : null}
        {this.props.state === 'login' || this.props.state === 'onboarding' ?
            <MenuStart onSignUp={this.props.onSignUp} onSettings={this.props.onSettings} /> :
          this.props.state === 'contacts' ?
            <MenuContacts onNewTopic={this.props.onNewTopic} onSettings={this.props.onSettings} /> :
          null}
      </div>
    );
  }
};
