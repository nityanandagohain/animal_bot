'use strict';
const Twitter = require("twitter");
const { getLastId, saveLastId } = require('./src/dynamodb');

const AWS = require('aws-sdk');

const rek = new AWS.Rekognition();

const { getImage } = require('./src/fetch');
const config = require('./config')

const T = new Twitter(config);

async function getImageLabels(url) {
  let imageUrl = url;
  const imageBytes = await getImage(imageUrl);
  const params = {
    Image: {
      Bytes: imageBytes
    },
    MaxLabels: 5,
    MinConfidence: 80,
  };


  return new Promise((resolve, reject) => {
    rek.detectLabels(params, (err, data) => {
      if (err) {
        return reject(new Error(err));
      }
      let return_string;
      if (data.Labels && data.Labels.length > 0) {
        return_string = data.Labels.map((label) => {
          return `${label.Name} (${Math.floor(label.Confidence)}%)`;
        }).join('/');
        return_string = `Here is what I can recognize: It's either ${return_string}`
      } else {
        return_string = "Sorry Cant recognize";
      }
      return resolve(return_string);
    });
  });
};


//Search tweet and post reply
async function searchAndReplyTweets() {
  return new Promise(async (resolve, reject) => {
    getLastId().then((lastTweetId) => {
      T.get('search/tweets', { q: "@gohainnitya", since_id: lastTweetId, count: 5 }, (error, tweets, response) => {
        if (!error) {
          if (tweets) {
            for (let i = 0; i < tweets.statuses.length; i++) {
              let tweet = tweets.statuses[i];
              //checking if http link is present
              if (tweet && tweet.text.includes("#identify") && tweet.entities && tweet.entities.media && tweet.entities.media[0] && tweet.entities.media[0].media_url) {
                // console.log(tweet.entities.media[0].media_url);
                getImageLabels(tweet.entities.media[0].media_url).then((result) => {
                  let nameID = tweet.id_str;
                  let reply = result;
                  let params = {
                    status: reply,
                    in_reply_to_status_id: nameID
                  };
                  saveLastId(nameID).then(() => {
                    T.post('statuses/update', params, (error, tweet, response) => {
                      if (!error) {
                        resolve(tweet);
                      }
                    })
                  });
                })
              }
            }
          }
        }
      })
    })
  });
}
module.exports.hello = async (event, context) => {
  let res = await searchAndReplyTweets();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      data: res
    }),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
