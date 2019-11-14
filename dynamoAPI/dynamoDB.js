var AWS = require('./aws.js');
var dateUtil = require('date-utils'); // npm install date-utils
var uuid4 = require('uuid4'); // npm install uuid4

var dynamoDB = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// delete Table
module.exports.deleteTable = function deleteTable() {
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

// create Table
module.exports.createTable = function create() {
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

// insert
module.exports.insertData = function (item) {
    var tokens = uuid4().split('-');
    var uid = tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
    var newDate = new Date();
    var today = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');

    // uuid4에서 -를 제외하고 3,2,1,4,5순으로 조합하면 AutoIncrement와 같은 인덱싱 성능을 보장
    var param = {
        TableName: "TEST",
        Item: {
            uid: uid,
            datetime: today,
            data: item,  // data로 넣으려고 했지만, dynamoDB에서 쓰는 예약어라서 나중에 Update 불가
            tombstone : false
        }
    };
    // callback으로 동기 구현
    /*
    docClient.put(param, function(err,data){
        callback(err,data,uid);
    });
    */
    // promise로 동기 구현
    return new Promise(function (resolve, reject) {
        docClient.put(param, function (err, data) {
            if(err) {
                reject(uid);
            } else {
                resolve(uid);
            }
        });
    });
};

// select All
module.exports.selectAll = function () {
    var params = {
        TableName: "TEST"
    };
    return new Promise(function (resolve, reject) {
        docClient.scan(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

// select where id
module.exports.selectFromId = function (uid) {
    var params = {
        TableName: "TEST",
        KeyConditionExpression: '#uid = :uid',
        FilterExpression: "#tombstone = :tombstone",
        ExpressionAttributeNames: {"#uid" : "uid", "#tombstone" : "tombstone"},
        ExpressionAttributeValues: { ":uid" : uid, ":tombstone" : false }
    };
    return new Promise(function (resolve, reject) {
        docClient.query(params, function (err, data) {
        //docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

// select where id and date
module.exports.selectFromIdAndDate = function (uid,date) {
    // USERID + 날짜로 쿼리
    var date = p.substring(0, 4) + '-' + p.substring(4, 6) + '-' + p.substring(6, 8);
    var params = {
        TableName: "TEST",
        KeyConditionExpression: '#uid = :uid',
        FilterExpression: "begins_with(#datetime,:datetime) and tombstone = :t",
        ExpressionAttributeNames: {"#uid" : "uid", "#datetime" : "datetime", "#tombstone" : "tombstone"},
        ExpressionAttributeValues: { ":uid" : uid, ":datetime" : date, ":tombstone" : false }
    };
    return new Promise(function (resolve, reject) {
        docClient.query(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

// update
module.exports.updateData = function (uid) {
    var params = {
        TableName: "TEST",
        Key: { "uid": uid },
        UpdateExpression: "set #data.title = :newdata",
        ConditionExpression: "tombstone = :tomb",
        ExpressionAttributeNames : { "#data" : "data" }, // data가 aws의 예약어이기 때문
        ExpressionAttributeValues: { ":newdata" : "new ydh", ":tomb" : false },
        ReturnValues: "UPDATED_NEW"
    };
    
    return new Promise(function (resolve, reject) {
        docClient.update(params, function (err, data) {
            if (err) {
                reject(data);
            } else {
                resolve(err);
            }
        });
    });
}

// delete 
module.exports.deleteData = function (uid) {
    // Delete말고, Tombstone 활용하기
    var params = {
        TableName: "TEST",
        Key: { "uid": uid },
        UpdateExpression: "set tombstone = :t",
        ExpressionAttributeValues: { ":t": true },
        ReturnValues: "UPDATED_NEW"
    };
    
    return new Promise(function (resolve, reject) {
        docClient.update(params, function (err, data) {
            if (err) {
                reject(uid);
            } else {
                resolve(uid);
            }
        });
    });
    /*
    // Delete
    var params = {
        TableName: "TEST",
        Key: { "uid": uid },
        ConditionExpression: "uid = :u",
        ExpressionAttributeValues: { ":u": uid }
    };
    
    return new Promise(function(resolve,reject){
        docClient.delete(params, function (err, data) {
            if (err) {
                reject(uid);
            } else {
                resolve(uid);
            }
        });
    });
    */
}