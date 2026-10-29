# Zarpado Mueble · Stock de fábrica

Aplicación para celulares y computadoras con registro por correo y contraseña, aprobación de empleados, inventario compartido, altas de materiales, entradas, salidas y recuentos. Historial con persona, fecha y motivo.

El código está preparado para GitHub y despliegue completo mediante GitHub Actions. Ver [PUBLICAR-GITHUB.md](PUBLICAR-GITHUB.md) para configurar el servidor y la base de datos. La web requiere un servidor; GitHub Pages por sí solo no ejecuta estas funciones.

## Stock inicial privado
El inventario real se carga desde INITIAL_STOCK_JSON, un secreto del servidor. Las cantidades reales no se publican en este repositorio. Las pruebas automáticas utilizan artículos ficticios. El titular recibe el archivo de carga inicial por un canal privado.

Menos de 10: crítico. Entre 10 y 12 inclusive: aviso previo. Más de 12: disponible. Los límites son ajustables por artículo. Se envía un aviso cuando un artículo entra en un estado de reposición; las variaciones dentro del mismo estado no generan avisos nuevos.

## Acceso y correo
El titular crea la primera cuenta con su enlace de activación. Cada empleado se registra y espera aprobación. El administrador puede suspender cuentas y restablecer contraseñas.

Las alertas tienen como destino zarpadomuebles@gmail.com. Desde Configuración se puede conectar Brevo con un correo remitente verificado (sin dominio propio usa temporalmente un remitente compartido), o Resend con dominio verificado. Se necesita la clave de la cuenta del servicio. La clave se guarda cifrada y no se expone al navegador. Los avisos sin conexión permanecen pendientes; guardar la conexión no confirma la entrega.

## Verificación
GitHub Actions compila y verifica el proyecto y ejecuta pruebas funcionales con datos temporales. Los cambios simultáneos se protegen por versión y las operaciones repetidas no descuentan dos veces.

## Desarrollo
Node.js 22.13 o superior. Instalar componentes con npm ci y construir con npm run build. El servidor local inicia con npm run dev. La base local debe tener aplicadas las migraciones de drizzle. Las variables locales se guardan exclusivamente en .dev.vars, excluido de Git.

No se incluyen claves de producción, archivos de configuración local, usuarios de prueba ni registros reales del alojamiento anterior.

