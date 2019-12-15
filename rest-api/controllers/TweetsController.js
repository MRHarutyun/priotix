/* eslint-disable camelcase, no-await-in-loop */
const DB = require('dal/mongo-db');

class TweetsController {
  constructor() {
    this.DB = DB;
  }

  async get(data, reply) {
    const { page } = data;
    const days = await this.DB.Days
      .find({})
      .sort({ created_at: 'DESC' })
      .skip(page * 20)
      .limit(20);
    const totalCount = await this.DB.Days.countDocuments({});
    const totalPages = Math.ceil(totalCount/20);
    return reply(200, { days, totalPages});
  }
}

module.exports = new TweetsController();
