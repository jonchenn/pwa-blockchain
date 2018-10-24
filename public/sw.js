importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/hmac-sha256.min.js')
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js');
importScripts('https://www.gstatic.com/firebasejs/4.12.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.12.0/firebase-messaging.js');

// Init IndexedDB
let blockchain = [];
const dbPromise = idb.open('blockchain-store', 1, upgradeDB => {
  upgradeDB.createObjectStore('keyval');
});

const db = {
  get(key) {
    return dbPromise.then(db => {
      return db.transaction('keyval')
        .objectStore('keyval').get(key);
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(val, key);
      return tx.complete;
    });
  },
  delete(key) {
    return dbPromise.then(db => {
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').delete(key);
      return tx.complete;
    });
  },
  clear() {
    return dbPromise.then(db => {
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').clear();
      return tx.complete;
    });
  }
};

// Init Blockchain

class Block {
  constructor(index, previousHash, timestamp, data, hash) {
    this.index = index;
    this.previousHash = previousHash.toString();
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash.toString();
  }
}

var generateNextBlock = (blockData) => {
  var previousBlock = getLatestBlock();
  var nextIndex = previousBlock.index + 1;
  var nextTimestamp = new Date().getTime() / 1000;
  var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
};

var getGenesisBlock = () => {
  return new Block(0, "0", 1465154705, "my genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
};

var addBlock = (newBlock) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock);
    db.set('blockchain', blockchain);
  }
};

var calculateHashForBlock = (block) => {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

var calculateHash = (index, previousHash, timestamp, data) => {
  return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

var isValidNewBlock = (newBlock, previousBlock) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index');
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash');
    return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
    return false;
  }
  return true;
};

// var replaceChain = (newBlocks) => {
//   if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
//     console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
//     blockchain = newBlocks;
//     broadcast(responseLatestMsg());
//   } else {
//     console.log('Received blockchain invalid');
//   }
// };

var getLatestBlock = () => blockchain[blockchain.length - 1];

var init = async () => {
  blockchain = await db.get('blockchain');

  // Init Blockchain if there's none.
  if (!blockchain) {
    blockchain = [getGenesisBlock()];
    db.set('blockchain', blockchain);
    db.set('peers', {});
  }
}

init();



// Server functions in Workbox

var broadcast = ({}) => {

};

var getBlocks = ({
  url,
  event,
  params
}) => {
  return new Response(JSON.stringify(blockchain));
};

var mineBlock = async ({
  url,
  event,
  params
}) => {
  let body = await event.request.json();
  var newBlock = generateNextBlock(body.data);
  addBlock(newBlock);
  // broadcast(responseLatestMsg());
  return new Response('block added: ' + JSON.stringify(newBlock));
};

var getPeers = async ({
  url,
  event,
  params
}) => {
  let peers = await db.get('peers');
  return new Response(peers);
};

var addPeer = async ({
  url,
  event,
  params
}) => {
  // connectToPeers([req.body.peer]);
  let peers = await db.get('peers');
  let body = await event.request.json();
  // peers.push(body.peer);
  peers[body.token] = {
    user: body.user,
  }
  db.set('peers', peers);
  return new Response(peers);
};

workbox.routing.registerRoute('/mineBlock', mineBlock, 'POST');
workbox.routing.registerRoute('/blocks', getBlocks);
workbox.routing.registerRoute('/addPeer', addPeer, 'POST');
workbox.routing.registerRoute('/peers', getPeers);

// Firebase messaging
firebase.initializeApp({
   messagingSenderId: '623133680167'
});
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(payload => {
   const title = payload.notification.title;
   console.log('payload', payload.notification.icon);
   const options = {
      body: payload.notification.body,
      icon: payload.notification.icon
   }
   return self.registration.showNotification(title, options);
})

self.addEventListener('notificationclick', function(event) {
   const clickedNotification = event.notification;
   clickedNotification.close();
   const promiseChain = clients
       .matchAll({
           type: 'window',
           includeUncontrolled: true
        })
       .then(windowClients => {
           let matchingClient = null;
           for (let i = 0; i < windowClients.length; i++) {
               const windowClient = windowClients[i];
               if (windowClient.url === feClickAction) {
                   matchingClient = windowClient;
                   break;
               }
           }
           if (matchingClient) {
               return matchingClient.focus();
           } else {
               return clients.openWindow(feClickAction);
           }
       });
       event.waitUntil(promiseChain);
});
