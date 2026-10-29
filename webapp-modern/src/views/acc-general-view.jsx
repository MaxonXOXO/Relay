// Edit account parameters.
import React from 'react';
import { FormattedMessage } from 'react-intl';

const TEXT_SIZE_STEPS = [80, 90, 100, 110, 120];

export default class AccGeneralView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      colorSchema: props.colorSchema || 'auto',
      textSize: Math.round((props.textSize || 10) * 10),
      sendOnEnter: props.sendOnEnter || 'plain',
    };

    this.isMac = ((navigator.userAgentData && navigator.userAgentData.platform)
      || navigator.platform).toLowerCase().startsWith('mac');
    this.handleColorSchemaSelected = this.handleColorSchemaSelected.bind(this);
    this.handleTextSizeChanged = this.handleTextSizeChanged.bind(this);
    this.handleTextSizeStepClick = this.handleTextSizeStepClick.bind(this);
    this.handleSendOnEnterSelected = this.handleSendOnEnterSelected.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.colorSchema !== this.props.colorSchema && this.props.colorSchema) {
      this.setState({colorSchema: this.props.colorSchema});
    }
    if (prevProps.textSize !== this.props.textSize && this.props.textSize) {
      this.setState({textSize: Math.round(this.props.textSize * 10)});
    }
  }

  handleColorSchemaSelected(e) {
    this.setState({colorSchema: e.currentTarget.value});
    this.props.onChangeColorSchema(e.currentTarget.value);
  }

  handleTextSizeChanged(e) {
    const pct = parseInt(e.currentTarget.value, 10) || 100;
    this.setState({textSize: pct});
    // Convert % to pt (100% = 10.5pt base scale -> 80%=8.5pt, 90%=9.5pt, 100%=10.5pt, 110%=11.5pt, 120%=12.5pt).
    this.props.onTextSizeChanged(pct / 10);
  }

  handleTextSizeStepClick(pct) {
    this.setState({textSize: pct});
    this.props.onTextSizeChanged(pct / 10);
  }

  handleSendOnEnterSelected(e) {
    this.setState({sendOnEnter: e.currentTarget.value});
    this.props.onSendOnEnterChanged(e.currentTarget.value);
  }

  render() {
    const currentPct = Number(this.state.textSize) || 100;
    return (
      <div id="settings-form" className="scrollable-panel">
        <div className="panel-form-column">
          <div className="panel-form-row">
            <label className="small">
              <FormattedMessage id="label_color_schema" defaultMessage="Theme:"
                description="Label for selecting color scheme (dark, light) in Settings" />
            </label>
          </div>
          <div className="panel-form-row">
            <ul className="quoted">
              <li key="system">
                <input type="radio" id="system" name="color-scheme-select" value="auto"
                  checked={this.state.colorSchema == 'auto'}
                  onChange={this.handleColorSchemaSelected} />&nbsp;
                <label htmlFor="system">
                  <FormattedMessage id="color_schema_system" defaultMessage="System default" description="Name of the color schema"/>&nbsp;
                  <img src="img/routine.svg" style={{verticalAlign: 'top', width: '1.6rem', height: '1.6rem'}}/>
                </label>
              </li>
              <li key="light">
                <input type="radio" id="light" name="color-scheme-select" value="light"
                  checked={this.state.colorSchema == 'light'}
                  onChange={this.handleColorSchemaSelected} />&nbsp;
                <label htmlFor="light">
                  <FormattedMessage id="color_schema_light" defaultMessage="Light" description="Name of the color schema"/>&nbsp;
                  <i className="material-icons orange large">light_mode</i>
                </label>
              </li>
              <li key="dark">
                <input type="radio" id="dark" name="color-scheme-select" value="dark"
                  checked={this.state.colorSchema == 'dark'}
                  onChange={this.handleColorSchemaSelected} />&nbsp;
                <label htmlFor="dark">
                  <FormattedMessage id="color_schema_dark" defaultMessage="Dark" description="Name of the color schema"/>&nbsp;
                  <i className="material-icons blue large">dark_mode</i>
                </label>
              </li>
            </ul>
          </div>
        </div>
        <div className="hr" />
        <div className="panel-form-row clean-clickable">
          <a onClick={this.props.onSelectWallpapers} className="flat-button">
            <i className="material-icons">wallpaper</i>&nbsp;
            <FormattedMessage id="wallpapers" defaultMessage="Wallpapers"
                description="Link or title for working with wallpapers." />
          </a>
        </div>
        <div className="hr" />
        <div className="panel-form-column">
          <div className="panel-form-row" style={{justifyContent: 'space-between'}}>
            <label className="small" htmlFor="text_size">
              <FormattedMessage id="label_text_size" defaultMessage="Text size:"
                description="Label adjusting text size" />
            </label>
            <span className="text-size-badge">{currentPct}%</span>
          </div>
          <div className="panel-form-row">
            <input
              type="range"
              id="text_size"
              name="text_size"
              className="relay-range-slider"
              min="80"
              max="120"
              step="10"
              value={currentPct}
              onInput={this.handleTextSizeChanged}
              onChange={this.handleTextSizeChanged}
            />
          </div>
          <div className="panel-form-row text-size-steps">
            {TEXT_SIZE_STEPS.map(pct => (
              <button
                key={pct}
                type="button"
                className={'text-size-step' + (currentPct === pct ? ' active' : '')}
                onClick={() => this.handleTextSizeStepClick(pct)}>
                {pct}%
              </button>
            ))}
          </div>
          <div className="text-size-preview-box">
            <div className="text-size-preview-bubble" style={{fontSize: `${currentPct / 10}pt`}}>
              Preview message text at {currentPct}%
            </div>
          </div>
        </div>
        <div className="hr" />
        <div className="panel-form-row">
          <label className="small">
            <FormattedMessage id="label_keyboard" defaultMessage="Keyboard:"
              description="Label for selecting Ctrl+Enter vs Enter behavior" />
          </label>
        </div>
        <div className="panel-form-row">
          <ul className="quoted">
            <li key="send_on_enter">
              <input type="radio" id="send_on_enter" name="send-on-enter-select" value="plain"
                checked={this.state.sendOnEnter == 'plain'}
                onChange={this.handleSendOnEnterSelected} />&nbsp;
              <label htmlFor="send_on_enter">
                <FormattedMessage id="send_on_enter" defaultMessage="Enter to send, Shift+Enter for new line"
                  values={{enter: <kbd>Enter</kbd>, shift_enter: <kbd>Shift+Enter</kbd>}}
                  description="Label for selecting Enter behavior" />
              </label>
            </li>
            <li key="send_on_ctrl_enter">
              <input type="radio" id="send_on_ctrl_enter" name="send-on-enter-select" value="ctrl"
                checked={this.state.sendOnEnter == 'ctrl'}
                onChange={this.handleSendOnEnterSelected} />&nbsp;
              <label htmlFor="send_on_ctrl_enter">
                {this.isMac ?
                <FormattedMessage id="send_on_cmd_enter" defaultMessage="Cmd+Enter to send, Enter for new line"
                  values={{cmd_enter: <kbd>⌘+Enter</kbd>, enter: <kbd>Enter</kbd>}}
                  description="Label for selecting Cmd+Enter behavior on Mac" />
                :
                <FormattedMessage id="send_on_ctrl_enter" defaultMessage="Ctrl+Enter to send, Enter for new line"
                  values={{ctrl_enter: <kbd>Ctrl+Enter</kbd>, enter: <kbd>Enter</kbd>}}
                  description="Label for selecting Ctrl+Enter behavior" />
                }
              </label>
            </li>
          </ul>
        </div>
      </div>
    );
  }
};
