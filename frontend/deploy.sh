set -e

# Uncommited file, contains "foo@bar.com/path/to/dir"
source secrets


scp -q public/* $SSHHOST

echo "Deploy done"
