const dbConnection = require("../connection/db");
const router = require("express").Router();

// import bcrypt for password hashing
const bcrypt = require("bcrypt");

// render login page
router.get("/login", function (req, res) {
  res.render("auth/login", { title: "Login", isLogin: req.session.isLogin });
});

// render register page
router.get("/register", function (req, res) {
  res.render("auth/register", { title: "Register", isLogin: req.session.isLogin });
});

// login handler
router.post('/login', (req,res) => {
    const {email, password} = req.body;
    const query = "SELECT user_id, email, password FROM tb_user WHERE email = ?"

    if(email == '' || password == ''){
        req.session.message = {
        type: "danger",
        message: "Please fulfill input",
        };
        res.redirect('/login');
        return;
    } else {
        dbConnection.getConnection((err, conn) => {
        if (err) throw err;

        conn.query(query, [email], (err, results) => {
            if (err) throw err;

            const isMatch = bcrypt.compareSync(password, results[0].password);
            if(isMatch){
                req.session.message = {
                    type: "success",
                    message: "Login success",
                    };
                req.session.isLogin = true;
                return res.redirect('/')
            } else {
            req.session.message = {
                type: "danger",
                message: "email or password is incorrect",
                };
                return res.redirect('/login')
                }
            })
        conn.release();
        })
    }
})

// handle register from client
router.post("/register", function (req, res) {
  const { email, password } = req.body;

  const query = "INSERT INTO tb_user(email, password) VALUES (?,?)";

  if (email == "" || password == "") {
    req.session.message = {
      type: "danger",
      message: "Please fulfill input",
    };
    res.redirect("/register");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  dbConnection.getConnection((err, conn) => {
    if (err) throw err;

    // execute query
    conn.query(query, [email, hashedPassword], (err, results) => {
      if (err) throw err;

      req.session.message = {
        type: "success",
        message: "register successfull",
      };
    });
    req.session.isLogin = true;
    res.redirect("/");

    // release connection back to pool
    conn.release();
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;