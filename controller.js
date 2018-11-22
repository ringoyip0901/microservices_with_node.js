const sharp = require ('sharp');
const svg2img = require ('svg2img');
const path = require ('path');
const fs = require ('fs');
const controller = {};

controller.checkParams = (req, res, next, image) => {
  if (!image.match (/\.(png|jpg)$/i)) {
    return res.status (req.method == 'POST' ? 403 : 404).end ();
  }
  req.image = image;
  req.localpath = path.join (__dirname, 'uploads', req.image);
  return next ();
};

controller.createImage = (req, res, next) => {
  let format = req.params[0] == 'png' ? 'png' : 'jpeg';
  let width = 500;
  let height = 300;
  let border = 5;
  let bgcolor = '#fcfcfc';
  let fgcolor = '#ddd';
  let textcolor = '#aaa';
  let textsize = 24;

  //an empty image
  let image = sharp ({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: {r: 0, g: 0, b: 0},
    },
  });

  //an SVG
  const svg = `<svg width="${width} height="${height}">
  <rect 
    x="0" y="0"
    width="${width}" height="${height}"
    fill="${fgcolor}" />
  <rect 
    x="${width}" y="${height}"
    width="${width - border * 2}" height="${height - border * 2}"
    fill="${bgcolor}" />
  <line 
    x1="${border * 2}" y1="${border * 2}"
    x2="${width - border * 2}" y2="${height - border * 2}"
    stroke-width="${border}" stroke=""${fgcolor}/>
  <line 
    x1="${width - border * 2}" y1="${border * 2}"
    x2="${border * 2}" y2="${height - border * 2}"
    stroke-width="${border}" stroke=""${fgcolor}/>
  <rect 
    x="${border}" y="${(height - textsize) / 2}"
    width="${width - border * 2}" height="${textsize}"
    fill="${bgcolor}" />
  <text 
    x="${width / 2}" y="${height / 2}" dy="8"
    font-family="Helvetica" font-size="${textsize}"
    fill="${bgcolor}" text-anchor="middle">${width} x ${height}</text>
</svg>`;
  // const thumbnail = Buffer.from (svg);
  // sharp (thumbnail).toBuffer ().then (data => console.log (data));

  let img_buffer = '';
  svg2img (svg, (err, buf) => {
    img_buffer = buf;
    image.overlayWith (img_buffer)[format] ().pipe (res);
  });
};

controller.uploadImage = (req, res) => {
  // let image = req.params.image.toLowerCase ();
  // if (!image.match (/\.(png|jpg)$/)) {
  //   return res.status (403).end ();
  // }
  let len = req.body.length;
  let fd = fs.createWriteStream (req.localpath, {
    flags: 'w+',
    encoding: 'binary',
  });

  // fd.write (req.body);
  fd.end (req.body);

  fd.on ('close', () => {
    res.send ({status: 'ok', size: len});
  });
};

controller.checkImage = (req, res) => {
  fs.access (
    req.locapath,
    fs.constants.R_OK, //check if the file is readable/accessible
    err => {
      res.status (err ? 404 : 200).end ();
    }
  );
};

controller.downloadImage = (req, res) => {
  let ext = path.extname (req.image); //to check the file extension
  // if (!ext.match (/^\.(png|jpg)$/)) {
  //   console.log (ext);
  //   return res.status (404).end ();
  // }
  let fd = fs.createReadStream (req.localpath);

  fd.on ('error', e => {
    // if (e.code == 'ENOENT') {
    //   return res.status (404).end ();
    // }
    // res.status (500).end ();
    res.status (e.code == 'ENOENT' ? 404 : 500).end ();
  });
  res.setHeader ('Content-Type', 'image/' + ext.substr (1)); //use the extension name to define the content type returned to the user
  fd.pipe (res); //piiping the file to the response
};

module.exports = controller;
