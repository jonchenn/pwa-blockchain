export default {
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_APP.firebaseapp.com",
    databaseURL: "https://YOUR_APP.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_APP.appspot.com",
    messagingSenderId: "123456789"
  },
  endpoints: {
    broadcast: 'https://YOUR_APP.cloudfunctions.net/broadcast',
    send: 'https://YOUR_APP.cloudfunctions.net/send',
    subscribe: 'https://YOUR_APP.cloudfunctions.net/subscribe',
  }
};
