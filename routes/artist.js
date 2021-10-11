const router = require("express").Router();
// import db connection
const dbConnection = require("../connection/db");
const uploadFile = require("../middlewares/uploadFile");
const pathFile = "http://localhost:5000/uploads/";

// render add artist page
router.get("/add", function (req, res) {
    res.render("artist/add-artist", {
      title: "Add Artist",
      isLogin: req.session.isLogin,
    });
});

// add artist
router.post("/add", uploadFile("music", "cover_music"), function (req, res) {
    let {name, start_career, about} = req.body;
    let photo = req.files.cover_music[0].filename

    const query = "INSERT INTO tb_artist (name, start_career, photo, about) VALUES (?,?,?,?)"

    dbConnection.getConnection((err, conn) => {
        if (err) throw err;
    
        conn.query(query, [name, start_career, photo, about], (err, result) => {

          if (err) {
            req.session.message = {
              type: "danger",
              message: "server error",
            };
            res.redirect("/artist/add");
          } else {
            req.session.message = {
              type: "success",
              message: "add artist successfully",
            };
    
            res.redirect(`/songs/upload`);
          }
        });
    conn.release()
    });
});

// render detail artist
router.get('/:id', (req, res) => {
    const {id} = req.params

    const query1 = "SELECT * from tb_artist WHERE artist_id = ?"
    const query2 = "SELECT * from tb_music WHERE tb_music.artist_id = ?"

    dbConnection.getConnection((err, conn) => {
        if (err) throw err;

        conn.query(query1, [id], (err, artist) => {
          conn.query(query2, [id], (err, songs) => {
            
            res.render("artist/artist", { 
              title: "About artist", 
              isLogin: req.session.isLogin, 
              artist,
              songs
            });
          })
          conn.release()
        })
    })
})

// render edit artist
router.get('/edit/:id', (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM tb_artist WHERE artist_id = ?"

  dbConnection.getConnection((err, conn) => {

    conn.query(query, [id], (err, results) => {
      if (err) throw err;

      const artist = {
        ...results[0],
        photo: pathFile + results[0].photo,
      };

      res.render('artist/edit-artist', {
        title: "Edit artist info",
        isLogin: req.session.isLogin,
        artist
      })
    })
    conn.release()
  })
})

// edit artist
router.post("/edit/:id", uploadFile("music", "cover_music"), function (req, res) {
  let { artist_id, about, oldImage } = req.body;
  
  console.log(req.files)

  let photo = '';
  
  if (!req.files) {
    photo = oldImage.replace(pathFile, "");
  } else {

    photo = req.files.cover_music[0].filename
  }
  
  

  const query = "UPDATE tb_artist SET about = ?, photo = ? WHERE artist_id = ?";

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;

    conn.query(query, [about, photo, artist_id], (err, results) => {

      if (err) {
        console.log(err);
      }
      res.redirect(`/artist/${artist_id}`);
    });

    conn.release();
  });
});

// handle delete artist
router.get("/delete/:id", function (req, res) {
  const { id } = req.params;

  const query = "DELETE FROM tb_artist WHERE artist_id = ?";

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;

    conn.query(query, [id], (err, results) => {
      if (err) {
        req.session.message = {
          type: "danger",
          message: err.message,
        };
        res.redirect("/");
      }

      req.session.message = {
        type: "success",
        message: "article successfully deleted",
      };
      res.redirect("/");
    });

    conn.release();
  });
});

module.exports = router;