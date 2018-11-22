const express = require ('express');
const app = express ();
const bodyparser = require ('body-parser');
const controller = require ('./controller.js');

app.param ('image', controller.checkParams);

app.get (/\/thumbnail\.(jpg|png)/, controller.createImage);

app.post (
  '/uploads/:image',
  bodyparser.raw ({
    limit: '10mb',
    type: 'image/*',
  }),
  controller.uploadImage
);

app.head ('/uploads/:image', controller.checkImage);

app.get ('/uploads/:image', controller.downloadImage);

app.listen (3000, () => console.log ('ready'));
