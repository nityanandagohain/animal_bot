'use strict'

const axios = require('axios');

const getImage = async (url) => {
  try {
    const response = await axios(url, { responseType: 'arraybuffer' });
    const data = new Buffer.from(response.data, 'binary');
    return data;
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getImage
};