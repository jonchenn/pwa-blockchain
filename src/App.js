import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      peer: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({peer: event.target.value});
  }

  handleSubmit(event) {
    // alert('A name was submitted: ' + this.state.value);

    fetch('/addPeer', {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'peer': this.state.peer
      }),
    });
    // .then(response => response.json());  parses response to JSON

    event.preventDefault();
  }

  render() {
    return (<div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
      </header>
      <form onSubmit={this.handleSubmit}>
        <label>
          Peer:
          <input type="text" value={this.state.peer} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit"/>
      </form>

    </div>);
  }
}

export default App;
