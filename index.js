const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const https = require("https");


const http = require('http')

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const getFn = function (subres, bucket, limit, marker, authorization) {
	let resData = [];
	const req = http.request({
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

const sisyphus = function (host, src, authorization) {

	const getbase64Img = function (url) {
		let protocol = http
		if (url.indexOf('https:') > -1) {
			protocol = https
		} else {
			protocol = http
		}
		return new Promise(function (resolve, reject) {
			let req = protocol.get(url, function (res) {
				let chunks = []; //用于保存网络请求不断加载传输的缓冲数据
				let size = 0;　　 //保存缓冲数据的总长度
				res.on('data', function (chunk) {
					chunks.push(chunk);
					//累加缓冲数据的长度
					size += chunk.length;
				});
				res.on('end', function (err) {
					//Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
					var data = Buffer.concat(chunks, size);
					//将Buffer对象转换为字符串并以base64编码格式显示
					const base64Img = data.toString('base64');
					//进入终端terminal,然后进入index.js所在的目录，
					resolve(base64Img)
				});
			});
			req.on('error', function (e) {
				reject('problem with request: ' + e.message);
			});
			req.end();
		})
	}

	let promises = []
	src.forEach((item) => {
		console.log(item)
		promises.push(new Promise((resolve, reject) => {
			getbase64Img(item).then(base64 => {
				let req = http.request({
					host: host,
					port: 80,
					method: 'POST',
					path: '/putb64/-1',
					headers: {"Authorization": authorization, "Content-Type": "application/octet-stream"}
				}, function (res) {
					let resData = [];
					console.log('STATUS: ' + res.statusCode);
					console.log('HEADERS: ' + JSON.stringify(res.headers));
					res.setEncoding('utf8');
					res.on('data', function (chunk) {
						resData.push(chunk)
					});
					res.on("end", function () {
						items = JSON.parse(resData.join(""));
						//subres.json(items)
						resolve(items)
					});
				});
				req.write(base64);
				req.on('error', function (e) {
					console.log('problem with request: ' + e.message);
				});
				req.end();
			})
		}))
	})
	return promises

}


app.get('/list', (req, res) => {
	const bucket = req.query.bucket
	const limit = req.query.limit
	const marker = req.query.marker
	const authorization = req.headers.authorization
	getFn(res, bucket, limit, marker, authorization)
})

app.post('/catchimage', (req, res) => {
	req.rawBody = '';//添加接收变量
	let json = {};
	req.on('data', function (chunk) {
		req.rawBody += chunk;
	});
	req.on('end', function () {
		json = req.rawBody.toString()
		json = JSON.parse(json)
		const authorization = req.headers.authorization
		Promise.all(sisyphus(json.host, json.src, authorization)).then(subres => {
			res.json(subres)
		})
	})
})

app.listen(3001, () => {
	console.log('正在监听端口3001');
})