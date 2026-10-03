const fs = require('fs');
const jwt = require('jsonwebtoken');

const privateKey = fs.readFileSync('/Users/katohitomi/Downloads/AuthKey_UV2BM5956A.p8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: 'WNC632HNY5',
  subject: 'com.stampsapp.app.signin',
  keyid: 'UV2BM5956A',
});

console.log(token);


