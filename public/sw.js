importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/hmac-sha256.min.js')
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js');

const broadcastEndpoint = 'https://us-central1-pwa-blockchain.cloudfunctions.net/broadcast';

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2
};

// Init IndexedDB
let blockchain = [];
let guid = null;

const dbPromise = idb.open('blockchain-store', 1, upgradeDB => {
  upgradeDB.createObjectStore('keyval');
});

var genGuid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

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

var replaceChain = (newBlocks) => {
  if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
    blockchain = newBlocks;
    db.set('blockchain', blockchain);
    broadcast(responseLatestMsg());
  } else {
    console.log('Received blockchain invalid');
  }
};

var isValidChain = (blockchainToValidate) => {
  if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
    return false;
  }
  var tempBlocks = [blockchainToValidate[0]];
  for (var i = 1; i < blockchainToValidate.length; i++) {
    if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
      tempBlocks.push(blockchainToValidate[i]);
    } else {
      return false;
    }
  }
  return true;
};

var handleBlockchainResponse = (message) => {
  var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
  var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  var latestBlockHeld = getLatestBlock();
  if (latestBlockReceived.index > latestBlockHeld.index) {
    console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      console.log("We can append the received block to our chain");
      blockchain.push(latestBlockReceived);
      db.set('blockchain', blockchain);
      broadcast(responseLatestMsg());
    } else if (receivedBlocks.length === 1) {
      console.log("We have to query the chain from our peer");
      broadcast(queryAllMsg());
    } else {
      console.log("Received blockchain is longer than current blockchain");
      replaceChain(receivedBlocks);
    }
  } else {
    console.log('received blockchain is not longer than current blockchain. Do nothing');
  }
};

var getLatestBlock = () => blockchain[blockchain.length - 1];
var queryChainLengthMsg = () => ({
  'type': MessageType.QUERY_LATEST
});
var queryAllMsg = () => ({
  'type': MessageType.QUERY_ALL
});
var responseChainMsg = () => ({
  'type': MessageType.RESPONSE_BLOCKCHAIN,
  'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
  'type': MessageType.RESPONSE_BLOCKCHAIN,
  'data': JSON.stringify([getLatestBlock()])
});

var init = async () => {
  blockchain = await db.get('blockchain');
  guid = await db.get('guid');

  if (!guid) {
    guid = genGuid();
    db.set('guid', guid);
  }

  // Init Blockchain if there's none.
  if (!blockchain) {
    blockchain = [getGenesisBlock()];
    db.set('blockchain', blockchain);
  }
}

var broadcast = (data) => {
  fetch(broadcastEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      sender: guid,
      data: data,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.status !== 200) {
      throw response;
    }
    return null;
  }).catch(function(error) {
    console.error(error);
    return error;
  });
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
  broadcast(responseLatestMsg());
  return new Response('block added: ' + JSON.stringify(newBlock));
};

var queryAll = async ({
  url,
  event,
  params
}) => {
  var error = await broadcast(responseChainMsg());
  if (error) {
    return Response.error(error);
  }
  return new Response(true);
};

var queryLatest = async ({
  url,
  event,
  params
}) => {
  broadcast(responseLatestMsg());
  return new Response(true);
};

workbox.routing.registerRoute('/api/mineBlock', mineBlock, 'POST');
workbox.routing.registerRoute('/api/blocks', getBlocks);
workbox.routing.registerRoute('/api/queryAll', queryAll);
workbox.routing.registerRoute('/api/queryLatest', queryLatest);


// Push notification handling.
self.addEventListener('push', event => {
  console.log('Get push...');

  let eventData = {};
  if (event.data) {
    eventData = event.data.text();
  }
  var json = JSON.parse(eventData);
  var body = JSON.parse(json.notification.body);
  var sender = body.sender;
  var message = body.data;
  console.log(message);

  if (sender === guid) return;

  switch (message.type) {
    case MessageType.QUERY_LATEST:
      // write(ws, responseLatestMsg());
      break;
    case MessageType.QUERY_ALL:
      // write(ws, responseChainMsg());
      break;
    case MessageType.RESPONSE_BLOCKCHAIN:
      handleBlockchainResponse(message);
      break;
  }

  // Uncomment the following if you want to show the notification dialog.
  // const options = {
  //   body: message,
  //   data: {
  //     dateOfArrival: Date.now(),
  //   },
  // };
  // event.waitUntil(
  //   self.registration.showNotification('Push Notification', options)
  // );
});

init();
