#!/bin/sh

HOME_PATH=tableau
TRANSFER_PATH=$HOME_PATH/tmp
ENV_CONF=$HOME_PATH/env
DEPLOY_TARGET_PATH=/servers/estadisticas/tableau

scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" -r etc/deploy/config/demo/* deploy@estadisticas.arte.internal:$ENV_CONF
scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" -r target/tableau-*.jar deploy@estadisticas.arte.internal:$TRANSFER_PATH/tableau.jar
ssh -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" deploy@estadisticas.arte.internal <<EOF

    ###
    # TABLEAU
    ###
    
    # Update Process
    sudo rm -Rf $DEPLOY_TARGET_PATH/*
    sudo unzip -o $TRANSFER_PATH/tableau.jar -d $TRANSFER_PATH
    sudo mv $TRANSFER_PATH/public/* $DEPLOY_TARGET_PATH
    
    # Restore Configuration
    sudo cp -rf $ENV_CONF/* $DEPLOY_TARGET_PATH

    sudo chown -R www-data:www-data $DEPLOY_TARGET_PATH
    sudo rm -rf $TRANSFER_PATH/*
    sudo rm -rf $ENV_CONF/*
	
	echo "Finished deploy"
	
EOF
