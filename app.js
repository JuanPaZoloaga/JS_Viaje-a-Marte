require("dotenv").config({ path: "./env/.env" });

//1 - Invocamos a express
const express = require("express");
const app = express();

//2 - seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//3 - Invocar a dotenv
const dotenv = require("dotenv");
const { request } = require("express");
dotenv.config({ path: ".env/.env" });

//4 - el directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

//5 - establecer el motor de plantillas ejs
app.set("view engine", "ejs");

//6 - Invocar a bcryptjs
const bcryptjs = require("bcryptjs");

//7 - Var. de session
const sessions = require("express-session");
app.use(
  sessions({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

//8 - Invocamos al modulo de conexion de la DB
const connection = require("./database/db");

//9 - Estableciendo las rutas
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

//10 - registracion
app.post("/register", async (req, res) => {
  const user = req.body.user;
  const name = req.body.name;
  const rol = req.body.rol;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  connection.query(
    "INSERT INTO users SET ?",
    {
      user: user,
      name: name,
      rol: rol,
      pass: passwordHaash,
    },
    async (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.render("register.ejs", {
          alert: true,
          alertTitle: "Registration",
          alertMessage: "¡Succesful Registration!",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: "",
        });
      }
    }
  );
});

//11 - Authentication
app.post("/auth", async (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  if (user && pass) {
    connection.query(
      "SELECT * FROM users WHERE user = ?",
      [user],
      async (error, results) => {
        if (
          results.length == 0 ||
          !(await bcryptjs.compare(pass, results[0].pass))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o password incorrectas",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.name = results[0].name;
          res.render("login", {
            alert: true,
            alertTitle: "Conexion exitosa!",
            alertMessage: "¡LOGIN CORRECTO!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: "",
          });
        }
        res.end();
      }
    );
  } else {
    res.render("login", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "¡Por favor ingrese un usuario y/o password!",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }
});

//12 - Metodo para controla que esta auth en todas las paginas
app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("index", {
      login: true,
      name: req.session.name,
    });
  } else {
    res.render("index", {
      login: false,
      name: "Debe iniciar sesion",
    });
  }
  res.end();
});

//funcion para limpiar la cache luego de el logout
app.use(function (req, res, next) {
  if (!req.user)
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
});

//Logout
//Destruye la sesion
app.get("/logout", function (req, res) {
  req.session.destroy(() => {
    res.redirect("/"); //siempre se ejecutra despues de que se destruya la sesion
  });
});

app.listen(3000, (req, res) => {
  console.log("SERVER RUNNING IN http://localhost:3000");
});
