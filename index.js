const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const https = require("https");
const imageinfo = require('imageinfo')

const OSS = require('ali-oss');


const http = require('http')

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));




// 生成唯一编码
function createRandomId() {
	return (Math.random() * 10000000).toString(16).substr(0, 4) + '_' + (new Date()).getTime() + '_' + Math.random().toString().substr(2, 5);

}
const sisyphus = function (host, json) {
	const config = json.config.clientRequest
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

					let client = new OSS({
						region: config.region,
						accessKeyId: 'LTAIOstXfKeQplLk',
						accessKeySecret: 'R5OCVKuXXtYppFFaByc4eoh4vDLhY1',
						bucket: config.bucket
					});

					const info = imageinfo(data)
					
					async function putBuffer() {
						try {
							let result = await client.put(config.SystemOssChannelName+'/'+createRandomId() + '.' + info.format, data);
							resolve(result.url)
						} catch (e) {
							console.log(e);
						}
					}

					putBuffer();

					
				});
			});
			req.on('error', function (e) {
				reject('problem with request: ' + e.message);
			});
			req.end();
		})
	}

	let promises = []
	json.src.forEach((item) => {
		promises.push(new Promise((resolve, reject) => {
			getbase64Img(item).then(base64 => {
				console.log(base64);
				resolve(base64)
			})
		}))
	})
	return promises

}



app.post('/catchimage', (req, res) => {
	req.rawBody = '';//添加接收变量
	let json = {};
	req.on('data', function (chunk) {
		req.rawBody += chunk;
	});
	req.on('end', function () {
		json = req.rawBody.toString()
		json = JSON.parse(json)
		Promise.all(sisyphus(json.host, json)).then(subres => {
			res.json(subres)
		})
	})
})

app.listen(3004, () => {
	console.log('正在监听端口3004');
})