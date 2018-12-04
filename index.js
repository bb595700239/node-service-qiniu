const express = require('express');
const app = express();
const moment = require('moment')


const http = require('http')

const cors = require('cors');
app.use(cors());


var getFn = function (subres, bucket, limit, marker, authorization) {
	var resData = [];
	var req = http.request({
		host: "rsf.qbox.me",
		port: 80,
		method: 'GET',
		path: '/list?bucket=' + bucket + '&limit=' + limit + '&marker=' + marker,
		headers: {"Authorization": authorization}
	}, function (res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			resData.push(chunk)
		});
		res.on("end", function () {
			items = JSON.parse(resData.join(""));
			subres.json(items)
		});
	});
	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});
	req.end();
}


app.get('/list', (req, res) => {
	const bucket = req.query.bucket
	const limit = req.query.limit
	const marker = req.query.marker
	const authorization = req.headers.authorization
	getFn(res, bucket, limit, marker, authorization)
})

app.listen(3001, () => {
	console.log('正在监听端口3001');
})