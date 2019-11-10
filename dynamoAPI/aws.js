// AWS-SDK Setting
var AWS = require('aws-sdk');

/* 
// 방법 1. c:/user/user/.aws/credential 있을 때, 사용
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // credentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
      console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
    }
});
*/ 
/* 
// 방법 2. 하드코딩
AWS.config.update({
    accessKeyId: "dsfasfsadfa",
    secretAccessKey: "asdfdsfasdfasdfasdf",
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});
*/
// 방법 3. json파일 로드
AWS.config.loadFromPath(__dirname + '/awsconfig.json')

module.exports = AWS;