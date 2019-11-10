var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var dateUtil = require('date-utils'); // npm install date-utils
var uuid4 = require('uuid4'); // npm install uuid4
var newDate = new Date();

var dynamoDB = require('./dynamoAPI/dynamoDB');
// table delete, create는 주석 풀어서 사용
//dynamoDB.deleteTable();
//dynamoDB.createTable();

var AWS = require('./dynamoAPI/aws');
var docClient = new AWS.DynamoDB.DocumentClient();

// select all -> return (json)all item
app.get('/items', function (req, res) {
	var params = {
		TableName: "TEST"
	};
	docClient.scan(params, onScan);
	function onScan(err, data) {
		var selectedItem;
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
		// parse하기 전에 stringfy 안 하면 에러남... 
		var jsonData = JSON.parse(JSON.stringify(data));
		if (jsonData['Count'] === 0) {
			console.log('Empty Data : ', JSON.stringify(jsonData));
			res.status(404).send('Empty Data');
		} else {
			console.log('return json : ', JSON.stringify(jsonData));
			res.json(jsonData);
		}
	}
});

// select one where uid or datetime -> return (json)selected item 
// ★날짜 쿼리 실패. 테이블 구조가 uid가 key라서, uid 값 모르면 쿼리 안 됨. 
app.get('/items/:id', function (req, res) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	if (String(req.params.id).length !== 8) { // id로 쿼리
		console.log('ID Searching');
		var params = {
			TableName: "TEST",
			Key: { "uid": req.params.id }
		};
		docClient.get(params, function (err, data) {
			if (err) {
				console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
			} else {
				// parse하기 전에 stringfy 안 하면 에러남... 
				var jsonData = JSON.parse(JSON.stringify(data));
				if (JSON.stringify(jsonData) === JSON.stringify({})) {
					console.log('Not Found Data : ', JSON.stringify(jsonData));
					res.status(404).send('Not Found Data');
				} else {
					console.log('return json : ', JSON.stringify(jsonData));
					res.json(jsonData);
				}
			}
		});
	} else { // 날짜로 쿼리
		console.log('Date Searching');
		var p = String(req.params.id);
		var date = p.substring(0,4) + '-' + p.substring(4,6) + '-' + p.substring(6,8);  
		console.log('where Date:', date);
		var params = {
			TableName: "TEST",
			Key: { "uid": '??????????????????????????' }, // uid를 키로 잡아서 uid 없이 쿼리 못하는 듯.... begins_with로 날짜 쿼리 실패.....
			ConditionExpression: "begins_with(datetime,:d)",
			ExpressionAttributeValues: { ":d": date }
		};
		docClient.get(params, function (err, data) {
			if (err) {
				console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
			} else {
				// parse하기 전에 stringfy 안 하면 에러남... 
				var jsonData = JSON.parse(JSON.stringify(data));
				if (JSON.stringify(jsonData) === JSON.stringify({})) {
					console.log('Not Found Data : ', JSON.stringify(jsonData));
					res.status(404).send('Not Found Data');
				} else {
					console.log('return json : ', JSON.stringify(jsonData));
					res.json(jsonData);
				}
			}
		});
	}
});

// item insert -> return uid
app.post('/items', function (req, res) {
	var docClient = new AWS.DynamoDB.DocumentClient();
    // uuid4에서 -를 제외하고 3,2,1,4,5순으로 조합하면 AutoIncrement와 같은 인덱싱 성능을 보장
    var tokens = uuid4().split('-');
    var uid = tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
    var today = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    var param = {
        TableName: "TEST",
        Item: {
            uid: uid,
            datetime: today,
            testdata: { title : 'ydh' } // data로 넣으려고 했지만, dynamoDB에서 쓰는 예약어라서 나중에 Update 불가
        }
    };

    docClient.put(param, function (err, data) {
        if (err) {
			console.error("Unable to add data : ", uid, ". Error JSON : ", JSON.stringify(err, null, 2));
			res.json({ uid : '' });
        } else {
			console.log("put item succeeded : ", uid, "when : ", today);
			res.json({ uid : uid });
        }
    });
});

// update item -> return message
app.put('/items/:id', function (req, res) {
	var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "TEST",
        Key: { "uid": req.params.id },
        UpdateExpression: "set testdata.title = :t",
        ExpressionAttributeValues: { ":t": "new ydh" },
        ReturnValues: "UPDATED_NEW"
    };
    docClient.update(params, function (err, data) {
        if (err) {
			console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
			res.send('Update Fail');
        } else {
			console.log('Update item succeeded :', JSON.stringify(data, null, 2));
			res.send('Update Succeed');
        }
    });
});

// delete item -> return message
// ★Tombstone 뭔 소린지 모르겠음............... 걍 삭제
app.delete('/items/:id', function (req, res) {
	var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "TEST",
        Key: { "uid": req.params.id },
        ConditionExpression: "uid = :u",
        ExpressionAttributeValues: { ":u": req.params.id }
    };
    docClient.delete(params, function (err, data) {
        if (err) {
			console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
			res.send('Delete Fail');
        } else {
			console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
			res.send('Delete Succeed');
        }
    });
});


var ip = '127.0.0.1';
var port = 3000;
app.listen(port, ip, function () {
	console.log('Server Running at YDH (' + ip + ':' + port + ')');
});
