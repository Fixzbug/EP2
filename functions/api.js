const express = require("express");
const ServerlessHttp = require("serverless-http");

const app = express();

app.get('/api', (req, res) => {
    return res.json({
        messages: "hello world! GGEZ"
    });
});

const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
    const result = await handler(event, context);
    return result;
};
