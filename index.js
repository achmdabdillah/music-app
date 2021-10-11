const http = require('http');
const express = require('express');
const path = require('path');
const session = require('express-session')
const flash = require("express-flash");

const app = express();
const hbs = require('hbs');

// get the client
const mysql = require('mysql2/promise');

const authRoute = require('./routes/auth')
const musicRoute = require('./routes/music');
const artistRoute = require("./routes/artist")

const dbConnection = require('./connection/db')

app.use(express.static('express'));
app.use(express.urlencoded({ extended: false }));

app.use(flash())

// static
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// set views location to app
app.set('views', path.join(__dirname, 'views'));

// set engine
app.set('view engine', 'hbs');

// register views partials
hbs.registerPartials(path.join(__dirname, 'views','partials'))

//register views songs
hbs.registerPartials(path.join(__dirname, 'views','songs'))

//register views artist
hbs.registerPartials(path.join(__dirname, 'views','artist'))

app.use(
    session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: 'secretValue'
    })
);

// render index page
app.get("/", function (req, res) {
    const query1 = "(SELECT tb_music.title as title, tb_music.music_id, tb_music.music, tb_music.cover_music, tb_artist.name, tb_artist.artist_id, tb_genre.name as genre FROM tb_music JOIN tb_artist ON tb_music.artist_id=tb_artist.artist_id JOIN tb_genre ON tb_genre.genre_id = tb_music.genre_id ORDER BY tb_music.created_at DESC)"
    
    const query2 = "SELECT * FROM tb_genre ORDER BY created_at desc"

    const query3 = "SELECT tb_playlist.playlist_id, tb_playlist.name FROM tb_playlist ORDER BY created_at DESC"

    dbConnection.getConnection((err, conn) => {
      if (err) throw err;
  
      conn.query(query1, (err, allSongs) => {
        conn.query(query2, (err, genres) => {
          conn.query(query3,(err, allPlaylists) => {
            if (err) throw err;
            const playlists = []; 
            const songs = [];

            // limiting the playlist and songs
            for(let i = 0; i < 3; i++){
              playlists.push(allPlaylists[i])
              songs.push(allSongs[i])
            }

            res.render("index", { title: "Music App", isLogin: req.session.isLogin, genres, songs, playlists, allPlaylists});

          })
        })
      });
      conn.release();
    });
  });

// use auth route
app.use('/', authRoute);
app.use('/songs', musicRoute );
app.use('/artist', artistRoute);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`server running on port: ${PORT}`))