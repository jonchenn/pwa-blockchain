import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom'
import firebase from 'firebase';
import config from './firebase-config';

firebase.initializeApp(config);
const messaging = firebase.messaging();

ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
), document.getElementById('root'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    messaging.useServiceWorker(registration);

    // Request permission and get token.
    messaging
      .requestPermission()
      .then(() => {
        console.log('Have Permission');
        return messaging.getToken();
      })
      .then(token => {
        console.log('FCM Token:', token);
        fetch('/addPeer', {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user: 'test',
            token: token,
          }),
        });
      })
      .catch(error => {
        if (error.code === 'messaging/permission-blocked') {
          console.log('Please Unblock Notification Request Manually');
        } else {
          console.log('Error Occurred', error);
        }
      });

    messaging.onMessage(payload => {
      console.log('Notification Received', payload);
      //this is the function that gets triggered when you receive a
      //push notification while you’re on the page. So you can
      //create a corresponding UI for you to have the push
      //notification handled.
    });
  });
}
