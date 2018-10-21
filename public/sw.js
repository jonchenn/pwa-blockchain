importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/hmac-sha256.min.js')
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js');

// Init IndexedDB

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

var calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

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
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};


var dbGetItem = (table, id) => {

};

var blockchain = [getGenesisBlock()];
db.set('blockchain', blockchain);
db.set('peers', [1,2,3]);


// Server functions in Workbox

var broadcast = ({}) => {

};

var getBlocks = ({url, event, params}) => {
  return new Response(
    'loading blocks'
  );
};

var mineBlock = ({url, event, params}) => {
  var newBlock = generateNextBlock(req.body.data);
  addBlock(newBlock);
  broadcast(responseLatestMsg());
  return new Response('block added: ' + JSON.stringify(newBlock));
};

var getPeers = async ({url, event, params}) => {
  let peers = await db.get('peers');
  return new Response(peers);
};

var addPeer = async ({url, event, params}) => {
  // connectToPeers([req.body.peer]);
  let peers = await db.get('peers');
  let body = await event.request.json();
  peers.push(body.peer);
  db.set('peers', peers);
  return new Response(peers);
};

workbox.routing.registerRoute('/mineBlock', mineBlock, 'POST');
workbox.routing.registerRoute('/blocks', getBlocks);
workbox.routing.registerRoute('/addPeer', addPeer, 'POST');
workbox.routing.registerRoute('/peers', getPeers);
