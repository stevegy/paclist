"use strict"

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const config = require('./config');


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Routes
const proxyPACRouters = require('./routers/proxyPAC');
app.use('/proxy', proxyPACRouters);


// Start Server
const port = config.srvport || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
}); 