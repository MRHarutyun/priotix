/* eslint-disable no-console */
const Redis = require('dal/redis');
const DB = require('dal/mongo-db');
const { TwitterService } = require('./services');

const subscriber = new Redis();
const publisher = new Redis();
const twitter = new TwitterService(publisher, DB);

subscriber.on('error', (err) => {
  console.log(`Error ${err}`);
});

subscriber.on('ready', () => {
  try {
    // configure redis to listen the expiration event.
    subscriber.config('SET', 'notify-keyspace-events', 'Ex');
    subscriber.subscribe('__keyevent@0__:expired');
    twitter.initDataScraping();
    subscriber.on('message', (channel, message) => {
      try {
        switch (message) {
          case 'reminder': {
            publisher.set('call_count', '0');
            twitter.initDataScraping();
            break;
          }
          default: console.log(message, 'message');
        }
      } catch (err) {
        console.log(`--------on-message----${err}--------------`);
        throw err;
      }
    });
  } catch (err) {
    console.log(`--------on-ready----${err}--------------`);
    throw err;
  }
});
