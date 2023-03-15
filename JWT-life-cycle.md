# Típico del ciclo de vida de JWT:

1. POST/login con usuario y contraseña. El usuario inicia sesión en una aplicación web o móvil proporcionando sus credenciales de inicio de sesión, como nombre de usuario y contraseña.

2. Se crea el token JWT con el secreto. El servidor de la aplicación autentica al usuario y genera un JWT que contiene información de identidad del usuario y cualquier otra información relevante, como roles y permisos.

3. Se devuelve el JWT. El servidor devuelve el JWT al cliente, que lo almacena, por ejemplo, en una cookie o en el almacenamiento local del navegador.

4. En las solicitudes posteriores a la aplicación, el cliente incluye el JWT como un encabezado de autorización. El servidor valida el JWT y utiliza la información del usuario para autorizar la solicitud.
```
Ejemplo:

Se envía el JWT en encabezado

Authorization: Bearer XXXXXXXXXX
```
5. Se comprueba la firma del token, se obtiene el recurso. Cuando el JWT expira o el usuario cierra la sesión, el cliente elimina el JWT de su almacenamiento local. El servidor también puede invalidar el JWT si detecta actividad sospechosa o si se revoca el acceso del usuario.

6. Se responde con el recurso protegido. Si el usuario desea iniciar sesión nuevamente, debe proporcionar sus credenciales de inicio de sesión y repetir el proceso.

En resumen, el ciclo de vida de JWT implica la generación, distribución, validación y eliminación del token en función de las acciones del usuario y del servidor.