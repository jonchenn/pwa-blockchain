import React, {Component} from 'react';
import logo from './logo.svg';

class Setup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({name: event.target.value});
  }

  handleInitClick(event) {
    // Query all blocks from peers.
    console.log('clicked init');
    fetch('/api/queryAll');
  }

  handleSubmit(event) {
    this.props.history.push('/chat');
    event.preventDefault();
  }

  render() {
    return (<div className="Setup">
      <header className="Setup-header">
        <img src={logo} className="Setup-logo" alt="logo"/>
      </header>
      <button onClick={this.handleInitClick}>Init</button>
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.name} onChange={this.handleChange}/>
        </label>
        <input type="submit" value="Submit"/>
      </form>
    </div>);
  }
}

export default Setup;
