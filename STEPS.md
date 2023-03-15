Solución para el desafío de programación de crear un inicio de sesión con JWT usando Express, PostgreSQL y Thunder Client:

# Solución

```js
function signup(){
 const token = jwt.sign({ userId }, "mi_firma_secreta"); 
}
function login(){
 const token = jwt.sign({ userId }, "mi_firma_secreta"); 
}
// ### Ir al final de este archivo para leer información importante
function verifyToken(){ // como así el get("/protected", (req, res) => {}
 const decodedToken = jwt.verify(token, "mi_firma_secreta");
}
```
```
Como vemos los métodos más importantes de JWT son jwt.sign({},firma_secreta) y jwt.verify(token, "firma_secreta")
Y para cada signup o para cada vez que nos logeamos se generará un token diferente que tiene a su vez
un vencimiento
```

1. Crea una base de datos en PostgreSQL con el nombre "users" y una tabla con el nombre "users". La tabla deberá tener los siguientes campos:

- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- email (VARCHAR(255), UNIQUE, NOT NULL)
- password (VARCHAR(255), NOT NULL)

```sql
CREATE DATABASE users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```
Y podemos probar insertar algún user a modo de ejemplo, pero esto luego se hará desde el server
```sql
INSERT INTO users (email, password) VALUES ('mau@gmail.com', '1234') RETURNING id;
```

2. Iniciamos un package.json e Instalamos los siguientes paquetes npm:

```bash
npm init -y
```

```bash
npm install express pg jsonwebtoken bcryptjs
```

3. Crea un archivo index.js en el directorio raíz de tu proyecto.

4. En el archivo index.js, crea una instancia de Express y configúrala para que use el middleware express.json().

```js
const express = require("express");
const app = express();

const port = 3000;

app.use(express.json());

// Al final o en archivo index.js donde el server con las rutas quedaría en un archivo app.js solo esto para modularizar mediante exportar el app y requerir const app = require('./app')
app.listen(port, () => {
  console.log("in port http://localhost:3000");
});
```

5. Conéctate a la base de datos PostgreSQL utilizando el paquete pg.

```js
const pg = require("pg");
// Otra manera de traer el Pool es con destructuring
// const { Pool } = require("pg");

const pool = new pg.Pool({
  user: "your_username",
  host: "your_host", // "localhost"
  database: "users",
  password: "your_password",
  port: 5432,
});
```

6. Crea dos rutas en tu servidor Express: /signup y /login.

```js
app.post("/signup", (req, res) => {
  // Implementar
});

app.post("/login", (req, res) => {
  // Implementar
});
```

7. En la ruta /signup, crea un endpoint POST que reciba una solicitud con los campos email y password. Verifica que el correo electrónico no exista en la base de datos y, si es así, hasheé la contraseña y guárdala junto con el correo electrónico en la tabla users. Luego, crea y firma un JWT que contenga el ID del usuario y envíalo en la respuesta.

```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar que el correo electrónico no existe en la base de datos
    const emailExist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailExist.rows.length > 0) {
      return res
        .status(400)
        .send({ message: "El correo electrónico ya está registrado." });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    // El params password es la contraseña que el usuario ingresó al registrarse en la aplicación.
    // El params saltRounds es el número de veces que se aplicará una función de hashing criptográfica para generar una cadena aleatoria y única de bytes (salt). Esta cadena se agrega a la contraseña del usuario antes de aplicar la función hash, lo que mejora la seguridad del hash.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Guardar el correo electrónico y la contraseña hasheada en la base de datos
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    const userId = newUser.rows[0].id;

    // Crear y firmar un JWT que contenga el ID del usuario
    // El primer parámetro { userId } es el objeto de carga útil (payload) que se incluirá en el token. 
    // El segundo parámetro "mi_secreto" es la clave secreta (secret key) y se utilizará para firmar el token. 
    // La firma se utiliza para garantizar el token no ha sido modificado o falsificado durante su transmisión. 
    // Por lo tanto, es importante que la clave secreta sea segura y privada.
    const token = jwt.sign({ userId }, "mi_firma_secreta");

    // // Y con mas datos creados como el name y los queremos ver y también ocultar el JWT_SECRET que con el se realiza la firma

    // const user = result.rows[0];
    // const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
```
La respuesta del token debe ser almacenada por el cliente (por ejemplo, un navegador web o una 
aplicación móvil) en un lugar seguro, como el almacenamiento local o una cookie, para que pueda 
ser utilizada en futuras solicitudes.

El cliente debe enviar el token en la cabecera Authorization de todas las solicitudes protegidas 
que realice al servidor. Por ejemplo:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0Ijox
```

8. En la ruta /login, crea un endpoint POST que reciba una solicitud con los campos email y password. Verifica que el correo electrónico exista en la base de datos y que la contraseña proporcionada coincida con la contraseña hasheada en la base de datos. Si es así, crea y firma un JWT que contenga el ID del usuario y envíalo en la respuesta.

```js
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
```

9. En la ruta /protected, crea un endpoint GET que requiera un JWT válido en la cabecera Authorization. Verifica y decodifica el JWT, y si es válido, devuelve un mensaje de éxito. Si no es válido, devuelve un mensaje de error.

```js
app.get("/protected", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "No se proporcionó un token." });
  }

  try {
    const decodedToken = await jwt.verify(token, "mi_firma_secreta");
    res.send({ message: "Solicitud exitosa.", userId: decodedToken.userId });
  } catch (error) {
    return res.status(401).send({ message: "Token inválido." });
  }
});
```

10. Agrega un middleware para verificar la validez del JWT en todas las solicitudes a la ruta /protected. Este middleware deberá verificar que la cabecera Authorization contenga un JWT válido y, si no es así, devolver un mensaje de error.

```js
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "No se proporcionó un token." });
  }

  try {
    const decodedToken = jwt.verify(token, "mi_secreto");
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
```
*** IMPORTANTE *** 
Recordar de que los middleware queden arriba de las rutas por las cuales serán usados

11. Levanta el servidor con node, de preferir setea el script en el package.json
```json
"start": "nodemon index.js"
``` 
12. Abre Thunder Client en tu navegador y realiza las siguientes solicitudes para probar el inicio de sesión con JWT:

- POST a http://localhost:3000/signup con los campos email y password.
- POST a http://localhost:3000/login con los mismos campos email y password que usaste en la solicitud anterior. El servidor deberá devolver un token JWT en la respuesta. Copia este token.
- GET a http://localhost:3000/protected con la cabecera Authorization que contenga el token JWT copiado en la solicitud anterior. El servidor deberá devolver un mensaje de éxito que incluya el ID del usuario correspondiente al token.
```bash
Ejemplo:
Se envía el JWT en encabezado Auth
Authorization: Bearer XXXXXXXXXX
El token se pasa sin las comillas que nos brinda el json
```

Aquí hay un ejemplo de cómo realizar estas solicitudes en Thunder Client:

### Ejemplo de solicitudes en Thunder Client

```
The image you are
requesting does not exist
or is no longer available

imgur.com
```

Si todo funciona correctamente, deberías ver una respuesta similar a la siguiente para la solicitud a /protected:

```json
{
  "message": "Solicitud exitosa.",
  "userId": 1
}
```

En cambio, si proporcionas un token inválido o no proporcionas un token en absoluto, deberías ver una respuesta similar a la siguiente:

```json
{
  "message": "Token inválido."
}
```

¡Listo! Ahora deberías tener una implementación funcional de un inicio de sesión con JWT en Express, PostgreSQL y Thunder Client. Espero que esto haya sido útil para ti.

### ¡Buena suerte con tus futuros proyectos de programación!

## EXTRA

- Usar variables de entorno

```bash
npm install dotenv
```

Ejemplo de implementación:

```js
//...
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json());

//...
```

Al utilizar la biblioteca dotenv para cargar las variables de entorno desde un archivo .env. Debemos asegurar de crear un archivo .env en la raíz de tu proyecto y configurar las siguientes variables:

```makefile
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mydatabase
DB_PASSWORD=mysecretpassword
DB_PORT=5432
JWT_SECRET=myjwtsecret
```

Y reemplazar los valores de las variables con tus propias credenciales de base de datos y una cadena secreta para el token JWT.

Enjoy!!!


## Info de utilidad en cuanto a la función que verifica el token y la firma

Si bien la función en la ruta GET también verifica el token, se recomienda tener un middleware separado 
para la verificación del token para una mejor organización y reutilización de código. Además, en caso de 
que se necesite actualizar o cambiar la verificación del token en el futuro, solo será necesario modificar 
el middleware.

Es necesario tener un middleware que verifique el token de autorización para las rutas que requieren autenticación y protección de acceso, como en este caso la ruta "/protected".

El middleware "verifyToken" se ejecutará antes de la ruta "/protected", lo que garantiza que solo los usuarios autenticados puedan acceder a ella. Además, al incluirlo como middleware en la aplicación, cualquier ruta que necesite autenticación y protección de acceso puede utilizarlo simplemente incluyéndolo en su ruta.


