const multer = require("multer");

module.exports = (music, cover_music) => {
  // create destination to store file
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads");
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  // file filter so only music are allowed
  const fileFilter = function (req, file, cb) {
    if (file.fieldname === music) {
      if (!file.originalname.match(/\.(MP3|mp3)$/)) {
        req.fileValidationError = {
          message: "Only mp3 files are allowed",
        };

        return cb(new Error("Only mp3 files are allowed", false));
      }
    }
    if(file.fieldname === cover_music) {
      if(!file.originalname.match(/\.(jpg|JPG|png|PNG|svg|SVG)$/)) {
        req.fileValidationError = {
          message: "Only image files are allowed",
        };

        return cb(new Error("Only image files are allowed", false));
      }
    }
    
    cb(null, true);
  };

  // max file size in MB
  const sizeMB = 10;
  const maxSize = sizeMB * 1024 * 1024;

  //upload function
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  }).fields(
    [
        {
            name: 'music', maxCount:1
        },
        {
            name: 'cover_music', maxCount:1
        },
        {
            name: 'photo', maxCount:1
        }
    ]
);

  return (req, res, next) => {
    upload(req, res, function (err) {
      if (err) {
        if (err.code == "LIMIT_FILE_SIZE") {
          req.session.message = {
            type: "danger",
            message: "Error, max file size is 10MB",
          };
          return res.redirect(req.originalUrl);
        }

        req.session.message = {
          type: "danger",
          message: "upload file error",
        };
        return res.redirect(req.originalUrl);
      }
      return next();
    });
  };
};