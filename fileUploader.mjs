import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import https from "https";
class FileUploader {
    options = {
        method: 'POST',
        hostname: 'tinypng.com',
        path: '/backend/opt/shrink',
        headers: {
            rejectUnauthorized: false,
            'Postman-Token': Date.now(),
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }
    }
    static getRandomIP() {
        return Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.')
    }
    outputDir='./';
    constructor(outputDir='./') {
        this.outputDir = outputDir;
    }
    progress=0;
    doUpload(imgPath) {
        return new Promise((resolve, reject) => {
            // 通过 X-Forwarded-For 头部伪造客户端IP
            this.options.headers['X-Forwarded-For'] = FileUploader.getRandomIP();
            this.options.headers['Postman-Token'] = Date.now();
            this.options.headers['Content-Type'] = "application/x-www-form-urlencoded";

            const req = https.request(this.options, (res) => {
                // console.log(res);
                res.on('data', async buf => {

                    let obj = JSON.parse(buf.toString());
                    if (obj.error) {
                        console.error(`fail:[${imgPath}]：压缩失败！报错：${obj.message}`);
                        reject(obj);
                    } else {
                        try{
                            await this.fileOutput(imgPath, obj);
                            resolve({
                                imgPath,
                                res: obj
                            })
                        }catch (e) {
                            console.error('导出图片到目录失败：', e);
                            reject(e);
                        }
                    }
                });
            });

            req.write(fs.readFileSync(imgPath), 'binary');
            req.on('error', e => {
                console.error('图片上传出错：', e);
                reject(e);
            });
            req.end();
        });
    }
    fileOutput(imgPath, res){
        return new Promise((resolve, reject) => {
            const outputDir = this.outputDir;
            imgPath = path.join(outputDir, imgPath.substring(imgPath.lastIndexOf('/')));
            if(!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            let options = new URL(res.output.url);
            let req = https.request(options, res => {
                let body = '';
                res.setEncoding('binary');
                res.on('data', function(data) {
                    body += data;
                });

                res.on('end', function() {
                    fs.writeFile(imgPath, body, 'binary', err => {
                        if (err) return console.error(err);
                        resolve({
                            imgPath,
                            res
                        });
                    });
                });
            });
            req.on('error', e => {
                console.error('图片保存出错', e);
                reject(e);
            });
            req.end();
        });
    }

}

export default FileUploader;