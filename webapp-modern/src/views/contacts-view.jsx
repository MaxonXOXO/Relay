/* ContactsView holds all contacts-related stuff */
import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import ContactList from '../widgets/contact-list.jsx';

import { updateFavicon } from '../lib/utils.js';

const messages = defineMessages({
  archived_contacts_title: {
    id: "archived_contacts",
    defaultMessage: "Archived contacts ({count})",
    description: "Label for archived chats"
  }
});

export default class ContactsView extends React.Component {
  constructor(props) {
    super(props);

    this.handleAction = this.handleAction.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleClearFilter = this.handleClearFilter.bind(this);

    this.state = Object.assign({filterQuery: ''}, ContactsView.deriveStateFromProps(props));
  }

  static deriveStateFromProps(props) {
    const contacts = [];
    let unreadThreads = 0;
    let archivedCount = 0;

    const me = props.tinode.getMeTopic();
    props.chatList.forEach(c => {
      const blocked = c.acs && !c.acs.isJoiner();
      c.pinned = me.pinnedTopicRank(c.topic);

      // Show only blocked contacts only when props.blocked == true.
      if (blocked && props.blocked) {
        contacts.push(c);
      }
      if (blocked || props.blocked) {
        return;
      }

      if (c.private && c.private.arch) {
        if (props.archive) {
          contacts.push(c);
        } else {
          archivedCount ++;
        }
      } else if (!props.archive) {
        contacts.push(c);
        unreadThreads += c.unread > 0 ? 1 : 0;
      }
    });

    contacts.sort((a, b) => {
      const pin = b.pinned - a.pinned;
      return pin != 0 ? pin : (b.touched || 0) - (a.touched || 0);
    });

    if (archivedCount > 0) {
      contacts.push({
        action: 'archive',
        title: messages.archived_contacts_title,
        values: {count: archivedCount}
      });
    }

    return {
      contactList: contacts,
      unreadThreads: unreadThreads
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.chatList != this.props.chatList ||
        prevProps.archive != this.props.archive ||
        prevProps.blocked != this.props.blocked) {
      const newState = ContactsView.deriveStateFromProps(this.props);
      this.setState(newState);
      if (newState.unreadThreads != prevState.unreadThreads) {
        updateFavicon(newState.unreadThreads);
      }
    }
  }

  handleAction(action_ignored) {
    this.props.onShowArchive();
  }

  handleFilterChange(e) {
    this.setState({filterQuery: e.target.value});
  }

  handleClearFilter(e) {
    e.preventDefault();
    this.setState({filterQuery: ''});
  }

  render() {
    const query = (this.state.filterQuery || '').trim().toLowerCase();
    const filteredContacts = query
      ? this.state.contactList.filter(c => {
          if (c.action) return false;
          const fn = (c.public && c.public.fn ? String(c.public.fn) : '').toLowerCase();
          const note = (c.public && c.public.note ? String(c.public.note) : '').toLowerCase();
          const comment = (c.private && c.private.comment ? String(c.private.comment) : '').toLowerCase();
          const topic = (c.topic ? String(c.topic) : '').toLowerCase();
          return fn.includes(query) || note.includes(query) || comment.includes(query) || topic.includes(query);
        })
      : this.state.contactList;

    return (
      <div className="flex-column">
        {!this.props.archive && !this.props.blocked && this.state.contactList.length > 0 ?
          <div className="contacts-search-bar">
            <i className="material-icons search-icon">search</i>
            <input
              type="text"
              className="contacts-filter-input"
              placeholder="Search chats…"
              value={this.state.filterQuery}
              onChange={this.handleFilterChange}
            />
            {this.state.filterQuery ?
              <a href="#" className="clear-filter" onClick={this.handleClearFilter}>
                <i className="material-icons">close</i>
              </a>
              : null}
          </div>
          : null}
        <FormattedMessage id="contacts_not_found"
          defaultMessage="You have no chats\n¯∖_(ツ)_/¯"
          description="HTML message shown in ContactList when no contacts are found">{
          (no_contacts) => <ContactList
            tinode={this.props.tinode}
            connected={this.props.connected}
            contacts={filteredContacts}
            emptyListMessage={no_contacts}
            topicSelected={this.props.topicSelected}
            myUserId={this.props.myUserId}
            showOnline={true}
            showUnread={true}
            onTopicSelected={this.props.onTopicSelected}
            showContextMenu={this.props.showContextMenu}
            onAction={this.handleAction} />
        }</FormattedMessage>
      </div>
    );
  }
};
