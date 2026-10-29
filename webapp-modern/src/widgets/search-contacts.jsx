import React from 'react';

import { Tinode } from 'tinode-sdk';

export default class SearchContacts extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      edited: false,
      search: this.props.initialQuery || ''
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePickContacts = this.handlePickContacts.bind(this);
  }

  componentWillUnmount() {
    if (this.state.edited) {
      this.setState({search: '', edited: false});
      this.props.onSearchContacts(Tinode.DEL_CHAR);
    }
  }

  handleSearchChange(e) {
    this.setState({search: e.target.value});
  }

  handleSearch(e) {
    e.preventDefault();
    const query = this.state.search.trim();
    this.setState({edited: (query.length > 0)});
    this.props.onSearchContacts(query.length > 0 ? query : Tinode.DEL_CHAR);
  }

  handleClear(e) {
    e.preventDefault();
    if (this.state.edited) {
      this.props.onSearchContacts(Tinode.DEL_CHAR);
    }
    this.setState({search: '', edited: false});
  }

  handleKeyDown(e) {
    if (e.key === 'Enter') {
      this.handleSearch(e);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      this.handleClear(e);
    }
  }

  async handlePickContacts(e) {
    e.preventDefault();
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      return;
    }
    try {
      const supported = await navigator.contacts.getProperties();
      const props = ['tel', 'email'].filter(p => supported.includes(p));
      if (props.length === 0) {
        return;
      }
      const picked = await navigator.contacts.select(props, { multiple: true });
      if (!picked || picked.length === 0) {
        return;
      }
      const terms = [];
      picked.forEach(c => {
        if (Array.isArray(c.tel)) {
          c.tel.forEach(t => {
            const clean = t.replace(/[\s\-()]/g, '');
            if (clean) terms.push(clean);
          });
        }
        if (Array.isArray(c.email)) {
          c.email.forEach(em => {
            const clean = em.trim();
            if (clean) terms.push(clean);
          });
        }
      });
      if (terms.length > 0) {
        const query = terms.join(', ');
        this.setState({ search: query, edited: true });
        this.props.onSearchContacts(query);
      }
    } catch (_) {
      // User cancelled picker or permission denied
    }
  }

  render() {
    const canPickContacts = typeof navigator !== 'undefined' &&
      'contacts' in navigator && typeof window !== 'undefined' && 'ContactsManager' in window;
    return (
      <div className="panel-form">
        <div className="panel-form-row">
          <i className="material-icons search">search</i>
          <input className="search" type="text"
              placeholder={this.props.placeholder}
              value={this.state.search} onChange={this.handleSearchChange}
              onKeyDown={this.handleKeyDown} required autoFocus />
          {this.state.search ?
            <a href="#" onClick={this.handleClear} title="Clear"><i className="material-icons">highlight_off</i></a>
            :
            <span><i className="material-icons">&nbsp;</i></span>}
          {canPickContacts ?
            <a href="#" onClick={this.handlePickContacts} title="Find from phone contacts" style={{marginLeft: '4px'}}>
              <i className="material-icons">contacts</i>
            </a>
            : null}
        </div>
      </div>
    );
  }
};
