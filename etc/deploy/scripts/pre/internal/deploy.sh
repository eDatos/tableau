#!/bin/sh

HOME_PATH=tableau
TRANSFER_PATH=$HOME_PATH/tmp
ENV_CONF=$HOME_PATH/env
DEPLOY_TARGET_PATH=/servers/static/istac/tableau-data-connector

scp -o "StrictHostKeyChecking=no" -r etc/deploy/config/pre/* deploy@mgcarta.gobiernodecanarias.net:$ENV_CONF
scp -o "StrictHostKeyChecking=no" -r target/tableau-*.jar deploy@mgcarta.gobiernodecanarias.net:$TRANSFER_PATH/tableau.jar
ssh -o "StrictHostKeyChecking=no" deploy@mgcarta.gobiernodecanarias.net <<EOF

    ###
    # TABLEAU
    ###
    
    # Update Process
    sudo rm -Rf $DEPLOY_TARGET_PATH/*
    sudo unzip -o $TRANSFER_PATH/tableau.jar -d $TRANSFER_PATH
    sudo mv $TRANSFER_PATH/public/* $DEPLOY_TARGET_PATH
    
    # Restore Configuration
    sudo cp -rf $ENV_CONF/* $DEPLOY_TARGET_PATH

    sudo chown -R apache:apache $DEPLOY_TARGET_PATH
    sudo rm -rf $TRANSFER_PATH/*
    sudo rm -rf $ENV_CONF/*
	
	echo "Finished deploy"
	
EOF
