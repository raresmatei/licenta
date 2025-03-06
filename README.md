/client: React app
cd client
npm run start

-------------------------------------------------------

netlify-functions/: Contains all your serverless functions.
netlify.toml: Configures Netlify to build your frontend from the client/ folder and deploy functions from the netlify-functions/ folder.

Run backend server: netlify dev from the path containing netlify.toml file !!!