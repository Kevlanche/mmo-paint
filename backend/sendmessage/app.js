// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const { TABLE_NAME } = process.env;

exports.handler = async event => {
  let connectionData;

  try {
    connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  const postToAll = (postData) => {
    const postCalls = connectionData.Items.map(async ({ connectionId }) => {
      try {
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`Found stale connection, deleting ${connectionId}`);
          await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
        } else {
          throw e;
        }
      }
    });

    return Promise.all(postCalls);
}

  const parsed = JSON.parse(event.body);
  const { x, y, col, addToGallery } = parsed;

  console.log('got message, addtoGallery is:', addToGallery, 'from', parsed);

  const pxData = [...(await s3.getObject({
    Bucket: process.env.BUCKET_NAME,
    Key: 'px8x8',
  }).promise()).Body.toString('utf-8')];

  if (addToGallery === true) {
    let latestIndex = 0;
    try {
      latestIndex = parseInt((await s3.getObject({
        Bucket: process.env.BUCKET_NAME,
        Key: `gallery8x8/latest`,
      }).promise()).Body.toString('utf-8'));
    } catch (e) {
      // Expected first time
    }

    const newIndex = (latestIndex + 1) % 16;
    await s3.copyObject({
      Bucket: process.env.BUCKET_NAME,
      Key: `gallery8x8/img${newIndex}`,
      CopySource: `/${process.env.BUCKET_NAME}/px8x8`,
      CacheControl: 'no-store',
      ACL: 'public-read',
    }).promise();
    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: `gallery8x8/latest`,
      Body: `${newIndex}`,
    }).promise();
    try {
      await postToAll('gallery');
    } catch (e) {
      return { statusCode: 500, body: e.stack };
    }


    return { statusCode: 200, body: 'Added to gallery.' };
  }

  if (x === undefined || y === undefined || col === undefined) {
    return { statusCode: 400, body: 'BadRequest' };
  }
  if (!/^([0-9a-f]{3})+$/.test(col)) {
    return { statusCode: 400, body: 'BadRequest' };
  }
  const firstColIndex = (x + (y * 8)) * 3;
  const lastColIndex = firstColIndex + (col.length / 3) - 1;
  if (firstColIndex < 0 || lastColIndex > (pxData.length - 3)) {
    return { statusCode: 400, body: 'BadRequest' };
  }

  for (let i = 0; i < col.length; i++) {
    pxData[firstColIndex + i] = col[i];
  }
  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: 'px8x8',
    ACL: 'public-read',
    Body: pxData.join(''),
    CacheControl: 'no-store',
  }).promise();

  const postData = pxData.join('');


  try {
    await postToAll(postData);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
