import React, {Component} from 'react';

class ChatRoom extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messageToSend: '',
      messages: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', function(event){
        console.log("Client 1 Received Message: " + event.data);
      });
    }
  }

  componentDidMount () {
    fetch('/api/queryAll');
    this.refresh();
    // this.timer = setInterval(this.refresh.bind(this), 1000);
  }

  async refresh() {
    var self = this;
    fetch('/api/blocks').then((data) => {
      return data.json();
    }).then((blocks) => {
      var messages = blocks.map((x) => {return x.data;});
      messages.shift();
      self.setState({messages: messages});
    });
  }

  handleChange(event) {
    this.setState({messageToSend: event.target.value});
  }

  handleSubmit(event) {
    fetch('/api/mineBlock', {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'data': {
          user: 'test',
          message: this.state.messageToSend,
        }
      })
    });

    this.state.messages.push({
      user: 'Me',
      message: this.state.messageToSend,
    });
    this.setState({
      messageToSend: '',
    });
    event.preventDefault();
  }

  createMessageList = () => {
    var items = []
    this.state.messages.forEach((msgItem, index) => {
      items.push(
        <li key={"message-"+index} className="message">
          <span>{msgItem.user}</span>
          <p>{msgItem.message}</p>
        </li>
      )
    })
    return items
  }

  render() {
    return (<div className="ChatRoom">
      <header>
        Chat
      </header>
      <ul className="ChatBody">
        {this.createMessageList()}
      </ul>
      <div className="ChatInput">
        <form onSubmit={this.handleSubmit}>
          <label>
            <input type="text" value={this.state.messageToSend} onChange={this.handleChange}/>
          </label>
          <input type="submit" value="Send"/>
        </form>
      </div>
    </div>);
  }
}

export default ChatRoom
