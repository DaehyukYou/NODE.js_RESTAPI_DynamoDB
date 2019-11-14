var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var dynamoDB = require('./dynamoAPI/dynamoDB');
// table delete, create는 주석 풀어서 사용
//dynamoDB.deleteTable();
//dynamoDB.createTable();


// select all
app.get('/items', function (req, res) {
	dynamoDB.selectAll().then(function(data){
		if (data['Count'] === 0) {
			res.status(404).send({ "errorMessage": "Not Found Data" });
			console.log("Not Found");
		} else {
			res.json(data.Items);
			console.log("Select All Item");
		}
	}).catch(function(err){
		res.json(err);
		console.log("Unable to select All Item");
	});
});

// select Item from Id
app.get('/items/:id', function (req, res) {
	dynamoDB.selectFromId(req.params.id).then(function (data) {
		if (data['Count'] === 0) { 
			res.status(404).send({ "errorMessage": "Not Found Data" });
			console.log("Not Found");
		} else {
			res.json(data.Items);	
			console.log("Select item from uid = ", req.params.id);
		}
	}).catch(function (err) {
		res.json(err);
		console.log("Unable to select item from uid = ", req.params.id);
	});
});

// select Item from Id and date
app.get('/items/:id/date/:date', function (req, res) {
	dynamoDB.selectFromId(req.params.id,req.params.date).then(function(data){
		if (data['Count'] === 0) { 
			res.status(404).send({ "errorMessage": "Not Found Data" });
			console.log("Not Found");
		} else {
			res.json(data.Items);
			console.log("Select item from uid = ", req.params.id, ', date = ', req.params.date);
		}
	}).catch(function(err){
		res.json(err);
		console.log("Unable to select item from uid = ", req.params.id, ', date = ', req.params.date);
	});
});

// Item insert 
app.post('/items', function (req, res) {
	// callback으로 구현
	/*
	dynamoDB.insertData({title : 'ydh'}, function (err, data, uid) {
        console.log('put s');
        if (err) {
            res.json({ uid : '' });
            console.error("Unable to add data : ", uid, ". Error JSON : ", JSON.stringify(err, null, 2));
        } else {
            res.json({ uid : uid });
            console.log("put item succeeded : ", uid, "when : 2019");
		}
	});
	*/
	// promise로 구현
	dynamoDB.insertData({title : 'ydh'}).then(function(uid){
		res.json({ uid : uid });
		console.log("put item succeeded uid : ", uid);
	}).catch(function(uid) {
		res.status(404).json({ 'errorMessage' : 'Insert Fail' });
		console.error("Unable to add uid : ", uid, ". Error JSON : ");
	});
});

// update Item 
app.put('/items/:id', function (req, res) {
	var uid = req.params.id;
	dynamoDB.updateData(uid).then(function(data){
		res.json({ uid : uid });
		console.log("update item succeeded uid : ", uid, ". data : ", data);
	}).catch(function(err) {
		res.status(404).json({ 'errorMessage' : 'Not Found' });
		console.error("Unable to update uid :  ", uid, ". Error JSON : ", JSON.stringify(err,null,2));
	});
});

// delete Item 
app.delete('/items/:id', function (req, res) {
	dynamoDB.deleteData(req.params.id).then(function(uid){
		res.json({ uid : uid });
		console.log("delete item succeeded uid : ", uid);
	}).catch(function(uid) {
		res.status(404).json({ 'errorMessage' : 'Not Found' });
		console.error("Unable to delete uid :  ", uid, ". Error JSON : ");
	});
});

var ip = '127.0.0.1';
var port = 3000;
app.listen(port, ip, function () {
	console.log('Server Running at YDH (' + ip + ':' + port + ')');
});
