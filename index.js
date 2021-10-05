const http = require('http');
const express = require('express');
const path = require('path');
const session = require('express-session')

const app = express();
const hbs = require('hbs');

const authRoute = require('./routes/auth')

const dbConnection = require('./connection/db')

app.use(express.static('express'));
app.use(express.urlencoded({ extended: false }));

// static
app.use('/static', express.static(path.join(__dirname, 'public')))

// set views location to app
app.set('views', path.join(__dirname, 'views'));

// set engine
app.set('view engine', 'hbs');

// register views partials
hbs.registerPartials(path.join(__dirname, 'views','partials'))

//register views songs
hbs.registerPartials(path.join(__dirname, 'views','songs'))

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
    const query = "SELECT tb_music.title, tb_artist.name, tb_artist.artist_id FROM tb_music INNER JOIN tb_artist ON tb_music.artist_id=tb_artist.artist_id ORDER BY artist_id DESC"
  
    dbConnection.getConnection((err, conn) => {
      if (err) throw err;
  
      conn.query(query, (err, results) => {
        if (err) throw err;
  
        let songs = [];
  
        for (let result of results) {
          songs.push(result);
        }

        res.render("index", { title: "Music App", isLogin: req.session.isLogin, songs });
      });
  
      conn.release();
    });
  });

// use auth route
app.use('/', authRoute);

// render upload page
app.get('/upload', (req, res) => {
    res.render('songs/upload', {title: "Upload your song", isLogin: true})
})

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`server running on port: ${PORT}`))