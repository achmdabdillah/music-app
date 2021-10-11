const router = require("express").Router();
// import db connection
const dbConnection = require("../connection/db");
const uploadFile = require("../middlewares/uploadFile");
const pathFile = "http://localhost:5000/uploads/";

// render songs page
router.get("/", (req, res) => {
  const query = "SELECT tb_music.music_id, tb_music.title, tb_music.cover_music, tb_music.music, tb_artist.name, tb_artist.artist_id FROM tb_artist INNER JOIN tb_music ON tb_artist.artist_id = tb_music.artist_id ORDER BY tb_music.created_at DESC"

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;
    
      conn.query(query, (err, songs) => {
        if (err) throw err;
            
            res.render("song/songs", { title: "All songs", isLogin: req.session.isLogin, songs});
      });
    conn.release();
  });
})

// render upload songs page
router.get("/upload", function (req, res) {
  const query1 = "SELECT tb_genre.genre_id, tb_genre.name FROM tb_genre ORDER BY created_at DESC"

  const query2 = "SELECT tb_artist.artist_id, tb_artist.name FROM tb_artist ORDER BY artist_id DESC"

    dbConnection.getConnection((err, conn) => {
      if (err) throw err;
      
      conn.query(query1, (err, genres) => {
        conn.query(query2, (err, artists) => {
          // console.log(artists)
          if (err) throw err;
              
              res.render("song/upload", { title: "Upload songs", isLogin: req.session.isLogin, genres, artists});
        });
      })
      conn.release();
  });
});

// Add songs
router.post("/upload", uploadFile("music","cover_music"), function (req, res) {
    let {genre_id, artist_id, title} = req.body;
    let music = req.files.music[0].filename
    let cover_music = req.files.cover_music[0].filename

    const query = "INSERT INTO tb_music (genre_id, artist_id, title, music, cover_music) VALUES (?,?,?,?,?)"
  
    dbConnection.getConnection((err, conn) => {
      if (err) throw err;
  
      conn.query(query, [genre_id, artist_id, title, music, cover_music], (err, result) => {
        if (err) {
          req.session.message = {
            type: "danger",
            message: "server error",
          };
          res.redirect("/songs/upload");
        } else {
          req.session.message = {
            type: "success",
            message: "songs added successfully",
          };
  
          res.redirect(`/`);
        }
      });
      conn.release()
    });
  });

// render edit songs page 
router.get('/edit/:id', (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM tb_music WHERE music_id = ?"

  dbConnection.getConnection((err, conn) => {

    conn.query(query, [id], (err, results) => {
      if (err) throw err;

      const music = {
        ...results[0],
        photo: pathFile + results[0].photo,
      };

      res.render("song/edit-songs", { title: "Edit song info", isLogin: req.session.isLogin, music});
    })
    conn.release()
  })
})

// edit songs
router.post("/edit/:id", uploadFile("music", "cover_music"), function (req, res) {
  let { music_id, title, oldImage } = req.body;
  
  let photo = req.files.cover_music[0].filename
  
  if (!req.files) {
    photo = oldImage.replace(pathFile, "");
  }

  const query = "UPDATE tb_music SET title = ?, cover_music = ? WHERE music_id = ?";

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;

    conn.query(query, [title, photo, music_id], (err, results) => {

      if (err) {
        console.log(err);
      }
      res.redirect(`/songs`);
    });

    conn.release();
  });
});

// handle delete songs
router.get("/delete/:id", function (req, res) {
  const { id } = req.params;

  const query = "DELETE FROM tb_music WHERE music_id = ?";

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
        message: "songs successfully deleted",
      };
      res.redirect("/songs");
    });

    conn.release();
  });
});

// render playlists page
router.get("/playlists", (req, res) => {

  const query1 = "SELECT tb_playlist.playlist_id, tb_playlist.name FROM tb_playlist ORDER BY created_at DESC"

  dbConnection.getConnection((err, conn) => {
    if (err) throw err; 

      conn.query(query1, (err, playlists) => {

        async function getData(){
          const pool = require('../connection/db');
          const promisePool = pool.promise()
          let songs = []
          const ids = playlists.map(item => item.playlist_id);
          const querys = [];
          for(let i = 0; i < ids.length; i++){
            querys.push(`SELECT tb_playlist.playlist_id, tb_playlist.name, tb_music.title FROM tb_playlist INNER JOIN music_playlist ON tb_playlist.playlist_id = music_playlist.playlist_id INNER JOIN tb_music ON music_playlist.music_id = tb_music.music_id WHERE tb_playlist.playlist_id = ${ids[i]} ORDER BY tb_playlist.created_at DESC`)
          }
          // console.log(querys)
          for (let elm in querys){
              const [rows,fields] = await promisePool.query(querys[elm]);
              songs.push(rows)
          }
          // console.log(songs)
          res.render("song/playlists", { title: "All playlist", isLogin: req.session.isLogin, playlists, songs});
      }
      getData()

    conn.release();
    });
  })
})

// render detail playlist
router.get("/playlist/:id", (req, res) => {
  const { id } = req.params;

  const query1 = "SELECT tb_playlist.playlist_id, tb_playlist.name FROM tb_playlist WHERE playlist_id = ? ORDER BY created_at DESC"

  const query2 = "SELECT tb_playlist.playlist_id, tb_music.music_id, tb_music.title, tb_music.cover_music, tb_music.music, tb_artist.artist_id, tb_artist.name FROM tb_playlist INNER JOIN music_playlist ON tb_playlist.playlist_id = music_playlist.playlist_id INNER JOIN tb_music ON music_playlist.music_id = tb_music.music_id JOIN tb_artist ON tb_artist.artist_id = tb_music.artist_id WHERE tb_playlist.playlist_id = ?"

  dbConnection.getConnection((err, conn) => {
    if (err) throw err; 

      conn.query(query1, [id], (err, playlists) => {
        conn.query(query2, [id], (err, songs) => {
          if (err) throw err;

          // console.log(playlists, songs)
              
          res.render("song/detail-playlist", { title: "Playlist", isLogin: req.session.isLogin, playlists, songs});
        })
      });
    conn.release();
  })
})

// render genre's song
router.get("/genres/:id", (req, res) => {

  const { id } = req.params

  const query = "SELECT tb_music.music_id, tb_music.genre_id, tb_music.title, tb_music.cover_music, tb_music.music, tb_artist.name, tb_artist.artist_id FROM tb_artist INNER JOIN tb_music ON tb_artist.artist_id = tb_music.artist_id WHERE tb_music.genre_id = ? ORDER BY tb_music.created_at DESC"

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;
    
      conn.query(query, [id], (err, songs) => {
        if (err) throw err;
            
            res.render("song/genres", { title: "Genres", isLogin: req.session.isLogin, songs});
      });
    conn.release();
  });
})

module.exports = router;