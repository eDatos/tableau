Tableau

## Arrancar proyecto en local

1. **mvn clean install** para instalar la versión de node y npm correspondientes. Se está usando el plugin de maven [frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin). (*lanzar desde la carpeta raíz del proyecto*)
2. **npm run start** preparar la carpeta build con watchs y **npm run serve** en una terminal distinta levanta el proyecto.  (*lanzar desde src/main/resources/*)
3. **npm run build** es el comando que se lanza para construir el proyecto
4. **npm run serve:simulator** levanta el simulador de Tableau que permite depurar más fácil los métodos del conector

Las APIs que queramos consumir deben soportar CORS. Si no lo soportan, temporalmente para desarrollo podemos servir los JSON desde una subcarpeta de simulator, a través del live-server que, tiene activado CORS