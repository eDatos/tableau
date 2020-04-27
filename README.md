Tableau

## Arrancar proyecto en local

1. **mvn clean install** para instalar la versión de node y npm correspondientes. Se está usando el plugin de maven [frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin). (*lanzar desde la carpeta raíz del proyecto*)
2. **npm run start** preparar la carpeta build con watchs y **npm run serve** en una terminal distinta levanta el proyecto.  (*lanzar desde src/main/resources/*)
3. **npm run build** es el comando que se lanza para construir el proyecto