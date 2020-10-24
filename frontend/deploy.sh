set -e

# Uncommited file, contains "export SSHHOST=foo@bar.com/path/to/dir"
source secrets


scp -q public/* $SSHHOST

echo "Deploy done"
