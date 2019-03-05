# PWA Blockchain Demo - A backendless live chat app with Service Worker using blockchain as database.

## TL;DR

TBD

## Getting Started

### Set up Firebase for Push Notification.

In src/ folder, create an empty file named firebase-config.js, and paste the
following JSON into this file. Replace the following values with corresponding
Firebase variables. You can find them in your Firebase console.

```
export default {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  databaseURL: "https://YOUR_APP.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",  
  storageBucket: "YOUR_APP.appspot.com",
  messagingSenderId: "123456789"
};
```

### Test your Firebase Functions locally

```
firebase functions:config:set config.apikey=<YOUR_FIREBASE_API_KEY>
firebase functions:config:get > .runtimeconfig.json
firebase serve --only functions
```

Set Firebase Functions and apiKey in environment configs:

```
firebase functions:config:set config.apikey=<YOUR_FIREBASE_API_KEY>
firebase deploy --only functions
```

### Run Node.js Server

```
yarn install
yarn start
```

## Design Details

TBD

## Known Issues

TBD

## Resources

TBD
