# Publicar el inventario desde GitHub

La aplicación completa se guarda en el repositorio control-stock de GitHub. GitHub Actions comprueba el código y publica el servidor y las pantallas juntos en Cloudflare Workers; D1 conserva los registros compartidos.

GitHub Pages no ejecuta este servidor. No activar Pages sobre este proyecto: publicar solo dist/client no habilita usuarios, stock compartido ni correo.

## Repositorio
Usar el repositorio control-stock del titular. El repositorio puede ser público porque el stock inicial real y los secretos quedan fuera del código. Subir este proyecto completo, incluyendo .github/workflows/deploy.yml, las migraciones de drizzle y package-lock.json. No subir node_modules, dist, .dev.vars, .wrangler ni .sites-runtime.

## Preparar el alojamiento
En la cuenta de Cloudflare del titular:
1. Crear una base D1 para este inventario y copiar su ID.
2. Crear un token de API con los permisos de publicación de Workers y edición de D1 en esa cuenta.
3. Conservar el ID de la cuenta.

No usar la base, claves ni credenciales internas del alojamiento de Sites: este despliegue es independiente. El inventario inicial se carga al activar la primera cuenta administradora.

## Configurar GitHub
En Settings → Secrets and variables → Actions, cargar estos secrets:
- CLOUDFLARE_API_TOKEN: token de la cuenta de Cloudflare.
- CLOUDFLARE_ACCOUNT_ID: ID de esa misma cuenta.
- APP_SECRET: una cadena aleatoria de al menos 32 caracteres. Mantenerla estable entre despliegues; cambiarla impediría descifrar la conexión de correo ya guardada.
- INITIAL_STOCK_JSON: contenido del archivo privado de inventario inicial. No subir ese archivo como código. Formato: una lista de filas [nombre, categoría, cantidad, unidad, notas].
- SETUP_KEY: otra cadena aleatoria de al menos 32 caracteres, diferente de APP_SECRET. Permite crear la primera cuenta y solo sirve antes de que exista un administrador.

Cargar estas variables:
- CLOUDFLARE_DATABASE_ID: ID real de la base D1.
- CLOUDFLARE_WORKER_NAME: zarpado-stock, u otro nombre elegido por el titular.
- DEPLOY_ENABLED: true, después de cargar la configuración y decidir habilitar las publicaciones automáticas.

No pegar estos valores en archivos del repositorio ni en el chat.

## Primera publicación
Abrir Actions → Verificar y publicar inventario → Run workflow en main. Antes de publicar se ejecutan las verificaciones de tipos, la compilación y las pruebas funcionales contra una base temporal. Si falta configuración, el flujo informa el secreto o variable que falta.

La publicación aplica las migraciones y publica la versión verificada. La dirección real la devuelve Cloudflare al completarse el flujo; no se debe asumir una dirección antes de ese resultado.

Con DEPLOY_ENABLED=true, los próximos cambios en main se publican automáticamente si pasan las verificaciones. Las solicitudes de cambios se prueban, pero no se publican en producción.

## Activar el uso
Abrir la URL publicada con el fragmento /#activar= seguido del valor de SETUP_KEY para crear la cuenta administradora. Ese enlace es solo del titular. Las siguientes personas se registran desde la URL normal y requieren aprobación en Equipo.

En Configuración conectar Resend con remitente verificado para activar las alertas a zarpadomuebles@gmail.com. El destinatario está fijado al correo que pidió el usuario. El servicio de correo es una configuración posterior al alojamiento; sin esa conexión los avisos permanecen pendientes.

## Comprobaciones
El flujo CI verifica acceso anónimo protegido, carga de un inventario ficticio, registro y aprobación, límites de permisos, movimientos duplicados, concurrencia, rechazo de negativos, placas con decimales y cierre de sesión.

La prueba utiliza una base y claves temporales en la máquina de GitHub. No usa datos ni claves reales y no envía correos.

