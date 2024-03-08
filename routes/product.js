const express = require("express");

const router = express.Router();
const AWS = require("aws-sdk");

AWS.config.update({
  region: "sa-east-1",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = "product-inventory";

//reference https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
//get single item
router.get("/", async (req, res) => {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      productId: req.query.productId,
    },
  };

  /* var request = s3.putObject({Bucket: 'bucket', Key: 'key'});
        var result = request.promise();
        result.then(function(data) { ... }, function(error) { ... });

        Sends the request and returns a 'thenable' promise.

Two callbacks can be provided to the then method on the returned promise. 
The first callback will be called if the promise is fulfilled, 
and the second callback will be called if the promise is rejected.
    */

  await dynamoDB.get(params).promise.then(
    (response) => {
      res.json(response.Item);
    },
    (error) => {
      console.error("Error while getting item ", error);
      res.status(500).send(error);
    }
  );
});

router.get("/all", async (req, res) => {
  const params = {
    TableName: dynamoDBTableName,
  };

  try {
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
      products: allProducts,
    };
    res.json(body);
  } catch (error) {
    console.error("Error while getting all items ", error);
    res.status(500).send(error);
  }
});
router.post("/", async (req, res) => {
  const params = {
    TableName: dynamoDBTableName,
    Item: req.body,
  };

  await dynamoDB.put(params).promise.then(
    () => {
      const body = {
        Operation: "SAVE",
        Message: "SUCCESS",
        Item: req.body,
      };
      res.json(body);
    },
    (error) => {
      console.error("Error while getting item ", error);
      res.status(500).send(error);
    }
  );
});
/* router.path('/',async (req,res)=>{

})
router.delete('/',async (req,res)=>{

}) */

async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamoDB.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = router;
