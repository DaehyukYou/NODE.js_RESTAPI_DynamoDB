var AWS = require('./aws.js');
var dateUtil = require('date-utils'); // npm install date-utils
var uuid4 = require('uuid4'); // npm install uuid4
var newDate = new Date();

// delete Table
module.exports.deleteTable = function deleteTable() {
    var dynamoDB = new AWS.DynamoDB();
    var params = {
        TableName: "TEST"
    };
    dynamoDB.deleteTable(params, function (err, data) {
        if (err) {
            console.log("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Delete Table! Table description JSON: ", JSON.stringify(data, null, 2));
        }
    });

};

// create
module.exports.createTable = function create() {
    var dynamoDB = new AWS.DynamoDB();
    var params = {
        TableName: "TEST",
        KeySchema: [
            { AttributeName: "uid", KeyType: "HASH" }
            //,{ AttributeName: "datetime", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "uid", AttributeType: "S" }
            //,{ AttributeName: "datetime", AttributeType: "S", }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    };
    dynamoDB.createTable(params, function (err, data) {
        if (err) {
            console.log(
                "Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Create Table! Table description JSON: ", JSON.stringify(data, null, 2));
        }
    });
};
/******************************************************************************************************************************************/
// 여기서 select,insert,delete,update하면 restapi.js로 return할 때, 비동기 방식이라 이상하게 됨... 해결 못하겠음 ㅜ, 그래서 restapi.js에 구현...
/******************************************************************************************************************************************/
// insert
module.exports.insertData = function (item) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    console.log('putting data : ', item);
    // uuid4에서 -를 제외하고 3,2,1,4,5순으로 조합하면 AutoIncrement와 같은 인덱싱 성능을 보장
    var tokens = uuid4().split('-');
    var uid = tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
    var today = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    var param = {
        TableName: "TEST",
        Item: {
            uid: uid,
            datetime: today,
            testdata: item  // data로 넣으려고 했지만, dynamoDB에서 쓰는 예약어라서 나중에 Update 불가
        }
    };

    docClient.put(param, function (err, data) {
        if (err) {
            console.error("Unable to add data : ", uid, ". Error JSON : ", JSON.stringify(err, null, 2));
        } else {
            console.log("put item succeeded : ", uid, "when : ", today);
        }
    });
    return uid;
};

// select 
module.exports.selectData = function (uid) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    if (uid === '') {
        var params = {
            TableName: "TEST"
        };
        docClient.scan(params, onScan);
        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(function (d) {
                    console.log("uid : ", d.uid + ", datetime : ", d.datetime, "testdata :", d.testdata);
                });
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                }
            }
        }
    } else {
        var params = {
            TableName: "TEST",
            Key: { "uid": uid }
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            }
        });
    }
    return data;
};

// update
module.exports.updateData = function (uid) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "TEST",
        Key: { "uid": uid },
        UpdateExpression: "set testdata.title = :t",
        ExpressionAttributeValues: { ":t": "new ydh" },
        ReturnValues: "UPDATED_NEW"
    };
    var result = true;
    docClient.update(params, function (err, data) {
        if (err) {
            result = false;
            console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2))
        } else {
            console.log('Update item succeeded :', JSON.stringify(data, null, 2))
        }
    });
    return result;
}