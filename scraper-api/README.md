# scraper-api
A node.js api wich wich starts fetching twitter api and getting data about 4 topics
Tramp, isis, esports and Lady Gaga once it was startded

# running the aplication
before running the aplication add environmental variable MONGO_ENDPOINT
set it your local mongo endpoint

# run locally
npm start

# build and run via docker
npm run docker:build:start

# build docker container
npm run docker:build

# start via builded docker container
npm run docker:start