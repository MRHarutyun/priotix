/* eslint-disable no-console, camelcase, no-await-in-loop, no-param-reassign */
const { Twitter } = require('twitter-node-client');
const { twitter_config } = require('dal/config');

class TwitterService extends Twitter {
  constructor(redis, DB) {
    super(twitter_config);
    this.DB = DB;
    this.redis = redis;
    this.search = this.search.bind(this);
    this.manageData = this.manageData.bind(this);
    this.initDataScraping = this.initDataScraping.bind(this);
    this.startScrapingData = this.startScrapingData.bind(this);
  }

  /**
   * 
   * @param {String} query 
   * @param {Number} count 
   * @param {String} max_id 
   * @param {String} since_id 
   */
  search(query, count, max_id, since_id) {
    const params = {
      count,
      q: query,
    };
    if (max_id) {
      params.max_id = max_id;
    }
    if (since_id) {
      params.since_id = since_id;
    }
    return new Promise((resolve, reject) => {
      super.getSearch(
        params,
        (error) => {
          console.log(`----search-------${error}---------`);
          reject(error);
        },
        (data) => {
          resolve(JSON.parse(data).statuses);
        },
      );
    });
  }

  /**
   * 
   * @param {Array} data 
   * @param {String} key 
   * @param {Boolean} initial 
   */
  async manageData(data, key, initial) {
    try {
      console.log('====================start');
      const tweetsPromises = [];
      const alldays = await this.DB.Days.find({});
      const daysMap = {};
      const daysPromises = [];
      alldays.forEach((d) => {
        daysMap[d.created_at] = d;
      });
      for (let i = 0; i < data.length; i += 1) {
        const result = {
          id: data[i].id,
          text: data[i].text,
          created_at: data[i].created_at,
          topic: key,
        };
        // YYYY-MM-DD
        const formatedDate = new Date(data[i].created_at).toISOString().substring(0, 10);
        const day = daysMap[formatedDate];
        if (!day) {
          const newDay = new this.DB.Days({
            created_at: formatedDate,
            [key]: 1,
          });
           daysPromises.push(newDay.save());
           daysMap[formatedDate] = newDay;
        } else {
          daysPromises.push(this.DB.Days.updateOne({
            created_at: formatedDate,
          }, {
            $inc: { [key]: 1 },
            // [key]: day[key] + 1,
          }));
          day[key] += 1;
        }

        const tweet = new this.DB.Tweets(result);
        tweetsPromises.push(tweet.save());
      }
      await Promise.all(tweetsPromises);
      await Promise.all(daysPromises);
      console.log('====================end');
      let state = {
        first_id: data[0] ? data[0].id : 0,
        max_id: data[data.length - 1].id,
      };
      if (!initial) {
        // if it is not the  first call
        state = await this.redis.get(key);
        state = JSON.parse(state);
        state.max_id = data[data.length - 1].id;
        if (!data.length) {
          // if there is no data left, start scraping the updated ones.
          state.since_id = state.first_id;
          delete state.max_id;
        }
      }
      await this.redis.set(key, JSON.stringify(state));
    } catch (err) {
      console.log(`-----manageData------${err}-----------`);
      throw err;
    }
  }

  /**
   * 
   * @param {Array} data 
   * @param {String} key 
   * @param {Boolean} initial 
   */
  // async manageData(data, key, initial) {
  //   try {
  //     console.log('====================start');
  //     const tweetsPromises = [];
  //     for (let i = 0; i < data.length; i += 1) {
  //       const result = {
  //         id: data[i].id,
  //         text: data[i].text,
  //         created_at: data[i].created_at,
  //         topic: key,
  //       };
  //       // YYYY-MM-DD
  //       const formatedDate = new Date(data[i].created_at).toISOString().substring(0, 10);
  //       const day = await this.DB.Days.findOne({
  //         created_at: formatedDate,
  //       });
  //       if (!day) {
  //         const newDay = new this.DB.Days({
  //           created_at: formatedDate,
  //           [key]: 1,
  //         });
  //         await newDay.save();
  //       } else {
  //         await this.DB.Days.updateOne({
  //           created_at: formatedDate,
  //         }, {
  //           [key]: day[key] + 1,
  //         });
  //       }

  //       const tweet = new this.DB.Tweets(result);
  //       tweetsPromises.push(tweet.save());
  //     }
  //     await Promise.all(tweetsPromises);
  //     console.log('====================end');
  //     let state = {
  //       first_id: data[0] ? data[0].id : 0,
  //       max_id: data[data.length - 1].id,
  //     };
  //     if (!initial) {
  //       // if it is not the  first call
  //       state = await this.redis.get(key);
  //       state = JSON.parse(state);
  //       state.max_id = data[data.length - 1].id;
  //       if (!data.length) {
  //         // if there is no data left, start scraping the updated ones.
  //         state.since_id = state.first_id;
  //         delete state.max_id;
  //       }
  //     }
  //     await this.redis.set(key, JSON.stringify(state));
  //   } catch (err) {
  //     console.log(`-----manageData------${err}-----------`);
  //     throw err;
  //   }
  // }

  /**
   * 
   * @param {Number} callCount 
   */
  async startScrapingData(callCount) {
    try {
      const trumpState = await this.redis.get('trump');
      const isisState = await this.redis.get('isis');
      const eSportsState = await this.redis.get('esports');
      const ladyGagaState = await this.redis.get('ladygaga');
      let initialCall = false;
      if (callCount === null) {
        callCount = 0;
        initialCall = true;
      }
      while (callCount < 180) {
        const trumpData = await this.search(
          'trump',
          100,
          trumpState ? trumpState.max_id : null,
          trumpState ? trumpState.since_id : null,
        );
        await this.redis.set('call_count', `${callCount + 1}`);
        await this.manageData(trumpData, 'trump', initialCall);
        const isisData = await this.search(
          'isis',
          100,
          isisState ? isisState.max_id : null,
          isisState ? isisState.since_id : null,
        );
        await this.redis.set('call_count', `${callCount + 1}`);
        await this.manageData(isisData, 'isis', initialCall);
        const eSportsData = await this.search(
          'esports',
          100,
          eSportsState ? eSportsState.max_id : null,
          eSportsState ? eSportsState.since_id : null,
        );
        await this.redis.set('call_count', `${callCount + 1}`);
        await this.manageData(eSportsData, 'esports', initialCall);
        const ladyGagaData = await this.search(
          'lady gaga',
          100,
          ladyGagaState ? ladyGagaState.max_id : null,
          ladyGagaState ? ladyGagaState.since_id : null,
        );
        await this.redis.set('call_count', `${callCount + 1}`);
        callCount = await this.redis.get('call_count');
        callCount = Number(callCount);
        await this.manageData(ladyGagaData, 'ladygaga', initialCall);
        console.log(callCount, 'callcount');
      }
      await this.redis.setReminder(1000);
    } catch (err) {
      console.log(`-----startScrapingData------${err}-----------`);
      throw err;
    }
  }

  async initDataScraping() {
    try {
      let callCount = await this.redis.get('call_count');
      const reminder = await this.redis.get('reminder');
      if (Number(callCount) < 180 || callCount === null) {
      // If the callCount is 180 must wait 15 minutes
        await this.startScrapingData(Number(callCount));
      } else if (!reminder) {
      // Case when the expiration event was not catched 
        callCount = 0;
        await this.redis.set('call_count', '0');
        await this.startScrapingData(callCount);
      }
    } catch (err) {
      console.log(`-----startScrapingData------${err}-----------`);
      throw err;
    }
  }
}

module.exports = TwitterService;
