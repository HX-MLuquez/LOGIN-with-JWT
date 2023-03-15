const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const pg = require("pg");

const app = express();
const port = 3000;

app.use(express.json());

// const pool = new pg.Pool({
//   connectionString: 'postgres://postgres:1234@localhost:5432/demo_jwt'
// });

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "demo_jwt",
  password: "1234",
  port: 5432,
});


//--- Este middleware lo realizamos al final pero lo agregamos por encima de las rutas, aquí mismo ----------------------------------------------------------------------------------------
// Middleware para verificar el token JWT en las solicitudes protegidas
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "No se proporcionó un token." });
  }

  try {
    const decodedToken = jwt.verify(token, "mi_firma_secreta");
    req.userId = decodedToken.userId;
    next();
    // // Versión con variable de entorno
    //     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    //     if (err) return res.sendStatus(403);
    //     req.user = user;
    //     next();
    //   })
  } catch (error) {
    return res.status(401).send({ message: "Token inválido." });
  }
}

app.use("/protected", verifyToken);
//-----------------------------------------------------------------------------------------

// Endpoint para crear un usuario
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar que el correo electrónico no existe en la base de datos
    const emailExist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailExist.rows.length > 0) {
      // console.log("01. ---emailExist---> ", emailExist) 
      return res
        .status(400)
        .send({ message: "El correo electrónico ya está registrado." });
    }

    // Hashear la contraseña y dicho hasheo es el que guardamos en la db como password
    const saltRounds = 10;
    // El params password es la contraseña que el usuario ingresó al registrarse en la aplicación.
    // El params saltRounds es el número de veces que se aplicará una función de hashing criptográfica 
    // para generar una cadena aleatoria y única de bytes (salt). Esta cadena se agrega a la contraseña 
    // del usuario antes de aplicar la función hash, lo que mejora la seguridad del hash.
    const hashedPassword = await bcrypt.hash(password, saltRounds); 

    // Guardar el correo electrónico y la contraseña hasheada en la base de datos
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    const userId = newUser.rows[0].id;

    // Crear y firmar un JWT que contenga el ID del usuario
    // El primer parámetro { userId } es el objeto de carga útil (payload) que se incluirá en el token. 
    // El segundo parámetro "mi_secreto" es la clave secreta (secret key) que se utilizará para firmar el token. 
    // La firma se utiliza para garantizar que el token no ha sido modificado o falsificado durante su transmisión. 
    // Por lo tanto, es importante que la clave secreta sea segura y privada.
    const token = jwt.sign({ userId }, "mi_firma_secreta");

    // // Y con mas datos creados como el name y los queremos ver y también ocultar el JWT_SECRET que con el se realiza la firma

    // const user = result.rows[0];
    // const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);

    res.json({ token });
    /*
    La respuesta del token debe ser almacenada por el cliente (por ejemplo, un navegador web o una 
    aplicación móvil) en un lugar seguro, como el almacenamiento local o una cookie, para que pueda 
    ser utilizada en futuras solicitudes.

    El cliente debe enviar el token en la cabecera Authorization de todas las solicitudes protegidas 
    que realice al servidor. Por ejemplo:

    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0Ijox
    */
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Endpoint para iniciar sesión y obtener un token JWT
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar que el correo electrónico exista en la base de datos
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(401).send({ message: "Credenciales inválidas." });
    }

    // Verificar que la contraseña coincida con la contraseña hasheada en la base de datos
    // Durante este proceso, se ejecuta el algoritmo de cifrado varias veces 
    // (el mismo número de veces que se especificó en la función bcrypt.hash() 
    // para crear el hash original) para poder comparar los dos valores.
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).send({ message: "Credenciales inválidas." });
    }

    // Crear y firmar un JWT que contenga el ID del usuario
    const token = jwt.sign({ userId: user.rows[0].id }, "mi_firma_secreta");

    // // Versión usando variable de entorno y mas info
    // const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Endpoint protegido que solo puede ser accedido con un token JWT válido
app.get("/protected", (req, res) => {
  // console.log("03.---req.userId---> ", req.userId)
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "No se proporcionó un token." });
  }

  try {
    const decodedToken = jwt.verify(token, "mi_firma_secreta");
    // console.log("02.---decodedToken---> ",decodedToken)
    res.send({ message: "Solicitud exitosa.", userId: decodedToken.userId });
  } catch (error) {
    return res.status(401).send({ message: "Token inválido." });
  }
});

app.listen(port, () => {
  console.log("in port http://localhost:3000");
});

// Agrega un middleware para verificar la validez del JWT en todas las solicitudes
// y lo agregamos en la parte superior del code por encima de las rutas

/*

Enjoy!!!

Vamos a probar nuestras rutas:
POST a http://localhost:3000/signup
POST a http://localhost:3000/login
GET a http://localhost:3000/protected

*/


/*
EXTRA para modularizar
*/


/*
EXTRA para modularizar

01. 
Los Middelwares y la instancia de express module queda en el archivo server.js
Y al final del code exportamos el app
*/

// module.exports = app;


/*
02. 
Y en este index.js solamente queda el que levanta el servidor
*/
// app.listen(port, () => {
//   console.log("in port http://localhost:3000");
// });

/*
03. 
En server.js 
*/

// var routes = require('./routes/index');
// app.use('/', routes);

/*
04. 
Hacer en carpeta routes index.js 
*/

/*
05. 
Hacer en carpeta routes user.js 
*/

/*
06. 
Hacer en controllers archivo user.js 
*/

/*
07. 
Modularizar el middelware verifyToken en un archivo verifyToken.js
y desde este archivo server lo importamos y aplicamos
*/
// const { verifyToken } = require("./verifyToken")
// app.use("/protected", verifyToken);



/*
CONSOLOGEOS VIEW 

01. ---emailExist--->  
Result {
  command: 'SELECT',
  rowCount: 1,
  oid: null,
  rows: [
    {
      id: 2,
      email: 'jimy@gmail.com',
      password: '$2a$10$hxUkeko.L1ty6wzjJ5kUQOeFyiuYRFAA6osmduLnwxkwQhrZrfa52'  
    }
  ],
  fields: [
    Field {name: 'id', etc...},
    Field {name: 'email', etc...},
    Field {name: 'password', etc...}
  ],
  _parsers: [etc...],
  _types: TypeOverrides {_types: {etc...},text: {},binary: {}},
  RowCtor: null,
  rowAsArray: false
}

02. 
02.---decodedToken--->  { userId: 6, iat: 1678667357 }


03.---req.userId--->  7
Este contiene esa prop userId que guardó el middelware verifyToken(){}

*/