# UPGRADE - Proceso de actualización entre versiones

*Para actualizar de una versión a otra es suficiente con actualizar el WAR a la última versión. El siguiente listado presenta aquellos cambios de versión en los que no es suficiente con actualizar y que requieren por parte del instalador tener más cosas en cuenta. Si el cambio de versión engloba varios cambios de versión del listado, estos han de ejecutarse en orden de más antiguo a más reciente.*

*De esta forma, si tuviéramos una instalación en una versión **A.B.C** y quisieramos actualizar a una versión posterior **X.Y.Z** para la cual existan versiones anteriores que incluyan cambios listados en este documento, se deberá realizar la actualización pasando por todas estas versiones antes de poder llegar a la versión deseada.*

*EJEMPLO: Queremos actualizar desde la versión 1.0.0 a la 3.0.0 y existe un cambio en la base de datos en la actualización de la versión 1.0.0 a la 2.0.0.*

*Se deberá realizar primero la actualización de la versión 1.0.0 a la 2.0.0 y luego desde la 2.0.0 a la 3.0.0*

## 2.2.4 a 2.3.0
* Se han realizado cambios que implican que, previo al despliegue de esta versión en cualquier entorno, se debe actualizar el fichero de propiedades properties.json para añadir dos nuevas claves necesarias para la internacionalización (la cookie de idioma y los idiomas del dropdown).  Se debe añadir la siguiente entrada justo antes de la clave "metadata"

~~~
        "cookie": {
            "metadataKey": "metamac.internationalization.cookieId"
        },
        "languages": {
            "metadataKey": "metamac.edition.languages"
        },
~~~

## 2.2.0 a 2.2.1

## 0.0.0 a 2.2.0
* El proceso de actualizaciones entre versiones para versiones anteriores a la 2.2.0 está definido en "Metamac - Manual de instalación.doc"
