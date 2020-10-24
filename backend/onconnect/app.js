// Copyright 2018-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

exports.handler = async event => {

  try {
    await s3.headObject({
      Bucket: process.env.BUCKET_NAME,
      Key: 'px8x8',
    }).promise();
  } catch (err) {
    console.warn('Object not found:', err);

    try {
      console.log('Putting to', process.env.BUCKET_NAME);
      await s3.putObject({
        Bucket: process.env.BUCKET_NAME,
        Key: 'px8x8',
        ACL:'public-read',
        Body: `
  f00f00ffff00f00ffff00f00
  f00f00ffff00f00ffff00f00
  f00f00ffff00f00ffff00f00
  f00f00ffff00f00ffff00f00
  f00f00f000ff0fff00f00f00
  f00ffff00f00f00f00ffff00
  f00f00fffffffffffff00f00
  f00f00f00f00f00f00f00f00
        `.replace(/\s/g,'')
      }).promise();
    } catch (second) {
      console.warn('Could not create obj', second);
      throw second;
    }
  }

  const putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: event.requestContext.connectionId
    }
  };

  try {
    await ddb.put(putParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
  }

  return { statusCode: 200, body: 'Connected.' };
};
