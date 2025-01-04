let express = require("express");
let bcrypt = require("bcryptjs");
let mysql = require("mysql2");
let cors = require("cors");
let app = express();
let jwt = require("jsonwebtoken");
let mySecerteCode = "qwertyuiop@1234567890";
require("dotenv").config();
app.use(express.json());
let db = mysql.createConnection({
  host:
    process.env.HOST || "database-1.cvyu8oi4e6l2.ap-south-1.rds.amazonaws.com",
  user: process.env.USER || "admin",
  password: process.env.PASSWORD || "12345678",
  database: process.env.DATABASE || "user",
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

db.connect((err) => {
  if (err) {
    process.exit();
  }
  console.log("Connection Sucessful");
});

let authorizationMethod = (req, res, next) => {
  let { authorization } = req.headers;
  if (authorization === undefined) {
    res.status(400).json({ err: "Token Required" });
  } else {
    let token = authorization.split(" ")[1];
    jwt.verify(token, mySecerteCode, (err) => {
      if (err) {
        res.status(400).json({ err: "Token not match" });
      } else {
        next();
      }
    });
  }
};

app.post("/register", async (req, res) => {
  let { username, password } = req.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let signupQuery = `insert into usersinfo(username,hashedpassword) values ('${username}','${hashedPassword}');`;
  let runSignupQuery = () => {
    db.query(signupQuery, (err, result) => {
      if (err) {
        res.status(500).json({ err: err.sqlMessage });
      } else {
        res.status(200).json({ message: "User added sucessfully" });
      }
    });
  };

  await runSignupQuery();
});

app.get('/home',(req,res)=>{
  res.status(200).json({msg:"Hi"})
})

app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  let userExistQuery = `select * from usersinfo where username='${username}'`;
  db.query(userExistQuery, async (err, result) => {
    if (err) {
      res.status(500).json({ err: err.code });
    } else {
      if (result.length === 0) {
        res.status(400).json({ err: "User not Exist" });
      } else {
        let hashedPassword = result[0].hashedpassword;
        let isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (isPasswordValid) {
          let jwtToken = jwt.sign(username, mySecerteCode);
          res.status(200).json({ jwtToken });
        } else {
          res.status(400).json({ err: "Password not matched" });
        }
      }
    }
  });
});

app.get("/", authorizationMethod, (req, res) => {
  let getData = "select * from products";
  db.query(getData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "unable to find data" });
    } else {
      res.status(200).json({ message: result });
    }
  });
});

app.get("/:id", authorizationMethod, (req, res) => {
  let particular = `select * from products where productId=${req.params.id}`;

  db.query(particular, (err, result) => {
    if (err) {
      res.status(400).json({ err });
    } else {
      res.status(200).json({ result });
    }
  });
});

let PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server started ${PORT}`);
});
