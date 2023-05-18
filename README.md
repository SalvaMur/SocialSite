# Social Networking Site

## Setup Instructions

+ Use 'npm install' in directory of 'package.json' to install necessary node modules.

+ After that, create a '.env' file and insert the credentials for the database, as well
as the hostname that the client will be hosted on. The key names of the credentials in
the '.env' file are HOST, USER, PASSWORD, DATABASE, and CLIENTHOST. 

+ If working with React's development server, comment out line 54 in 'server.js' as to avoid side effects.

+ Make sure to run 'npm run begin' as to create the needed tables for the database.