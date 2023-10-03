// assumes that you have already run `npm build` and `npm vite build site` to create all the dist files
// noinspection JSVoidFunctionReturnValueUsed

import tar from "tar"
import fs from "fs"

// Create the tarball
tar.c(
    {
        gzip: true,
        file: 'dist.tar.gz',
        cwd: process.cwd()+"/build/",
    },
    ["gbpm"]
).then(() => {
    // Convert the tarball to a Base64 encoded string
    const tarballContent = fs.readFileSync('dist.tar.gz');
    const base64Data = tarballContent.toString('base64');

    // Construct the install.sh content
    const installScriptContent = `
    #!/bin/bash

    set -e
    set -o pipefail
   
    NODE_PATH=$(which node || true)
    CONFIG_PATH=/etc/opt/gbpm/config.json
    OVERWRITE_FLAG=$1
    
    if [ -z "$NODE_PATH" ]; then
        echo "Node.js is not installed. Installation aborted."
        exit 1
    else
        echo "Node.js is installed at $NODE_PATH."
    fi 
   
    # Decode and unpack the application using a heredoc
    echo "Installing Glowbuzzer Process Manager..."
    mkdir -p /opt/gbpm
    base64 -d << EOF | tar -xzf - -C /opt
    ${base64Data}
    EOF
    
    if [ ! -f "$CONFIG_PATH" ] || [ "$OVERWRITE_FLAG" = "overwrite" ]; then
        echo "Creating template configuration file in $CONFIG_PATH"
        mkdir -p /etc/opt/gbpm
        cat > $CONFIG_PATH << EOF
        {
            "gbc": {
                "path": "/path/to/GBC",
                "args": ["-t"]
            },
            "gbem": {
                "path": "/path/to/GBEM",
                "args": ["-c", "-i", "eth0"]
            }
        }
        EOF
    else
        echo "Configuration file $CONFIG_PATH already exists and will not be modified."
    fi    
  
    # Create a systemd service
    echo "Configuring service..."
    echo "[Unit]
    Description=Glowbuzzer Process Manager
    After=network.target
    
    [Service]
    ExecStart=/usr/bin/node /opt/gbpm/server.js /etc/opt/gbpm/config.json
    WorkingDirectory=/opt/gbpm
    StandardOutput=inherit
    StandardError=inherit
    Restart=always
    User=root
    
    [Install]
    WantedBy=multi-user.target" > /etc/systemd/system/gbpm.service
    
    # Reload systemd, enable and start the service
    systemctl daemon-reload
    systemctl enable gbpm.service

    echo "Installation complete!"
    echo ""
    echo "Important: before starting the service, you must edit the configuration file at $CONFIG_PATH"
    echo ""
    echo "To start the service, run: "
    echo ""
    echo "    sudo systemctl start gbpm"
    `.toString().split("\n").map(s => s.trim()).join('\n') + '\n';

    // Write the install.sh file
    fs.mkdirSync('dist', { recursive: true })
    fs.writeFileSync('dist/gbpm-install.sh', installScriptContent);
    console.log("Packaging complete!");
}).catch((error) => {
    console.error("Error packaging app:", error);
});

