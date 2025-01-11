const express = require("express");
const ServerlessHttp = require("serverless-http");

const app = express();

app.get('/.netlify/functions/api', (req, res) => {
    return res.json({
        messages: "hello world! 466565656"
    });
});

const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
    const result = await handler(event, context);
    return result;
};
