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

  const parsed = JSON.parse(event.body);
  const { x, y, col } = parsed;
  if (x === undefined || y === undefined || col === undefined) {
    return { statusCode: 400, body: 'BadRequest' };
  }
  if (!/[0-9a-f]{3}/.test(col)) {
    return { statusCode: 400, body: 'BadRequest' };
  }

  const pxData = [...(await s3.getObject({
    Bucket: process.env.BUCKET_NAME,
    Key: 'px8x8',
  }).promise()).Body.toString('utf-8')];
  const colIndex = (x + (y * 8)) * 3;
  if (colIndex < 0 || colIndex > (pxData.length - 3)) {
    return { statusCode: 400, body: 'BadRequest' };
  }

  pxData[colIndex] = col[0];
  pxData[colIndex + 1] = col[1];
  pxData[colIndex + 2] = col[2];
  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: 'px8x8',
    ACL: 'public-read',
    Body: pxData.join(''),
  }).promise();

  const postData = pxData.join('');

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

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
