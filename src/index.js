import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
  BrowserRouter
} from 'react-router-dom'
import firebase from 'firebase';

// Don't forget to put your Firebase config in src/firebase-config.js.
import config from './config';

firebase.initializeApp(config.firebaseConfig);
const messaging = firebase.messaging();
const endpoints = config.endpoints;

ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
), document.getElementById('root'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js ').then((registration) => {
    messaging.useServiceWorker(registration);

    // Request permission and get token.
    messaging.requestPermission().then(() => {
      console.log('Have Permission');
      return messaging.getToken();
    }).then(token => {
      console.log(token);
      fetch(endpoints.subscribe + '?token=' + token).then(() => {
        console.log('Subscription success.');
      });
    }).catch(error => {
      if (error.code === 'messaging/permission-blocked') {
        console.log('Please Unblock Notification Request Manually');
      } else {
        console.log('Error Occurred', error);
      }
    });
  });
}
