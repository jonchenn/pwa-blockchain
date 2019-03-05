export default {
  firebaseConfig: {
    apiKey: "AIzaSyAFxE5DKT9OUaxc8-T_lUngkJSbLKrB_ZA",
    authDomain: "pwa-blockchain.firebaseapp.com",
    databaseURL: "https://pwa-blockchain.firebaseio.com",
    projectId: "pwa-blockchain",
    storageBucket: "pwa-blockchain.appspot.com",
    messagingSenderId: "336096845221"
  },
  endpoints: {
    broadcast: 'https://us-central1-pwa-blockchain.cloudfunctions.net/broadcast',
    send: 'https://us-central1-pwa-blockchain.cloudfunctions.net/send',
    subscribe: 'https://us-central1-pwa-blockchain.cloudfunctions.net/subscribe',
  }
};
