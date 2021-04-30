const express = require('express');
const app = express();

require('./src/myserver').setup(app);

