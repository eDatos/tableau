#!/bin/sh

HOME_PATH=tableau
TRANSFER_PATH=$HOME_PATH/tmp
DEPLOY_TARGET_PATH=/servers/estadisticas/tableau

scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" target/*.jar deploy@estadisticas.arte.internal:$TRANSFER_PATH/tableau.jar
ssh -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" deploy@estadisticas.arte.internal <<EOF

	cd $TRANSFER_PATH
    sudo unzip -o tableau.jar
    sudo cp -R public/* $DEPLOY_TARGET_PATH
    sudo rm -Rf public/ META-INF/
    sudo rm tableau.jar
    sudo chown -R www-data:www-data /servers/estadisticas/tableau 
	
	echo "Finished deploy"
EOF
