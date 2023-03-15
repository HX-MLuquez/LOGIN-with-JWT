// Endpoint para crear un usuario
export const signupUser = async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Guardar el correo electrónico y la contraseña hasheada en la base de datos
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    const userId = newUser.rows[0].id;

    // Crear y firmar un JWT que contenga el ID del usuario
    const token = jwt.sign({ userId }, "mi_secreto");

    // // Y con mas datos creados como el name y los queremos ver y también ocultar el JWT_SECRET que con el se realiza la firma

    // const user = result.rows[0];
    // const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Endpoint para iniciar sesión y obtener un token JWT
export const loginUser = async (req, res) => {
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
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).send({ message: "Credenciales inválidas." });
    }

    // Crear y firmar un JWT que contenga el ID del usuario
    const token = jwt.sign({ userId: user.rows[0].id }, "mi_secreto");

    // // Versión usando variable de entorno y mas info
    // const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Endpoint protegido que solo puede ser accedido con un token JWT válido
// ###
export const protectedUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "No se proporcionó un token." });
  }
  try {
    const decodedToken = await jwt.verify(token, "mi_secreto");
    res.send({ message: "Solicitud exitosa.", userId: decodedToken.userId });
  } catch (error) {
    return res.status(401).send({ message: "Token inválido." });
  }
};

module.exports = {
  signupUser,
  loginUser,
  protectedUser,
};


/*
###
La función protectedUser debe ser asincrónica ya que la llamada a jwt.verify es una operación asíncrona. 
La excepción generada por jwt.verify puede detener el flujo de ejecución y bloquear la respuesta del servidor.

Para hacer que la función sea asincrónica, usaremos async y await.
De esta manera, la función esperará la resolución de la operación asíncrona antes de continuar 
con el resto del código.

*/
