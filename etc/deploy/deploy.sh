#!/bin/sh

HOME_PATH=tableau
TRANSFER_PATH=$HOME_PATH/tmp
DEPLOY_TARGET_PATH=/servers/estadisticas/tableau

scp target/*.jar deploy@estadisticas.arte-consultores.com:$TRANSFER_PATH/tableau.jar
ssh deploy@estadisticas.arte-consultores.com <<EOF

	cd $TRANSFER_PATH
    sudo unzip -o tableau.jar
    sudo cp -R public/* $DEPLOY_TARGET_PATH
    sudo rm -Rf public/ META-INF/
    sudo rm tableau.jar
    sudo chown -R www-data:www-data /servers/estadisticas/tableau 
	
	echo "Finished deploy"
EOF
