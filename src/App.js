import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Setup from './Setup'
import ChatRoom from './ChatRoom'
import './App.css';

// The Main component renders one of the three provided
// Routes (provided that one matches). Both the /roster
// and /schedule routes will match any pathname that starts
// with /roster or /schedule. The / route will only match
// when the pathname is exactly the string "/"
const App = () => (
  <main>
    <Switch>
      <Route exact path='/' component={ChatRoom}/>
      <Route exact path='/setup' component={Setup}/>
    </Switch>
  </main>
)

export default App;
