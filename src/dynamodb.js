const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const _idName = "LASTID";

async function getLastId() {
    const params = {
        TableName: 'twit',
        KeyConditionExpression: "idName = :idName",
        ExpressionAttributeValues: {
            ":idName": _idName
        },
        Limit: 1
    };
    let lastId = '1';

    try {
        let data = await dynamoDb.query(params).promise();
        if (Object.keys(data).length !== 0) {
            lastId = data.Items[0].tweetId;
        }
    } catch (err) {
        console.log("ERROR: " + err);
    }
    return lastId;
}

async function saveLastId(lastId){
    const params = {
        TableName: 'twit',
        Item: {
            idName: _idName,
            tweetId: lastId
        }
    };
    try {
        let response = await dynamoDb.put(params).promise();
        return response;
    } catch (err) {
        console.log(err);
    }
}
module.exports = {
    getLastId,
    saveLastId,
};