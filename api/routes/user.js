var express = require("express");
var router = express.Router();
const { signupUser, loginUser, protectedUser } = require("../controllers/user");

// Endpoint para crear un usuario
router.post("/signup", signupUser);

// Endpoint para iniciar sesión y obtener un token JWT
router.post("/login", loginUser);

// Endpoint protegido que solo puede ser accedido con un token JWT válido
router.get("/protected", protectedUser);

module.exports = router;
