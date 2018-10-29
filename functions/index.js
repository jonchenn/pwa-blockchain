const functions = require('firebase-functions');
const request = require('request');
const config = functions.config().config || {};
const cors = require('cors')();

exports.test = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    res.send(functions.config());
  });
});

exports.subscribe = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    var token = req.query.token;
    var url = 'https://iid.googleapis.com/iid/v1/' + token +
        '/rel/topics/blockchain';
    request.post({
      headers: {
        'content-type': 'application/json',
        'content-length': 0,
        'Authorization': 'key='+config.apikey,
      },
      url: url,
    }, function(error, response, body){
      if (!error && response.statusCode === 200) {
        res.send(200);
      } else {
        res.status(500).json(error);
      }
    });
  });
});

exports.broadcast = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    var url = 'https://fcm.googleapis.com/fcm/send';
    var body = req.body;
    request.post({
      headers: {
        'content-type': 'application/json',
        'Authorization': 'key='+config.apikey,
      },
      url: url,
      body: JSON.stringify({
        'to' : '/topics/blockchain',
        'priority' : 'high',
        'notification' : {
          'body' : body,
          'title' : 'pwa-blockchain broadcast'
        }
      }),
    }, function(error, response, body){
      if (!error && response.statusCode === 200) {
        res.send(200);
      } else {
        res.status(500).send(error);
      }
    });
  });
});

exports.send = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    var url = 'https://fcm.googleapis.com/fcm/send';
    var body = req.body || {};
    var token = body.token;
    request.post({
      headers: {
        'content-type': 'application/json',
        'Authorization': 'key='+config.apikey,
      },
      url: url,
      body: {
        'to' : token,
        'priority' : 'high',
        'notification' : {
          'body' : body,
          'title' : 'pwa-blockchain broadcast'
        }
      },
    }, function(error, response, body){
      if (!error && response.statusCode === 200) {
        res.send(200);
      } else {
        res.status(500).send(error);
      }
    });
  });
});
