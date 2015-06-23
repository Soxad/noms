@echo off
set /p username="What is the username of the person whose comment you want to delete?\n"
echo "\n"
set /p comment="What is the beginning of the offending comment?\n"
echo "\n"

curl -X POST \
-H "X-Parse-Application-Id: lp7KkFHgqW9yVe17Zjfm1K5Txmq5AK7JuYcDSHkP" \
  -H "X-Parse-REST-API-Key: eJmb8UryS07m7MwDOP2WrN5aoC5mUiSPzbHZRqpH" \
  -H "Content-Type: application/json" \
  -G \
  -d '{"user":%username%,"commentText":%comment%}' \
  https://api.parse.com/1/functions/deleteComment
  
echo "Request sent- This black box will now self destruct.\n"
TIMEOUT 5