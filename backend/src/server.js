// <getDependencies>
// Express.js app server
import express from 'express';
import 'isomorphic-fetch';
import sql from 'mssql';

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// import { sql, Pool } from './db.js';
import { sortJson, prettyJson } from './sortJson.js';


// Uncomment for the app->app->graph tutorial
import { getGraphProfile } from './with-graph/graph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');
config({ path: envPath });

// import {Connection, Request} from "tedious";

// const config = {
//   authentication: {
//     options: {
//       userName: process.env.DB_DEV_USERNAME, // update me
//       password: process.env.DB_DEV_PASSOWRD // update me
//     },
//     type: "default"
//   },
//   server: "sqlserver753.database.windows.net", // update me
//   options: {
//     database: "sqldb753", //update me
//     encrypt: true
//   }
// };



const dbConfig = {
  // user: process.env.DB_DEV_USERNAME,
  // password: process.env.DB_DEV_PASSOWRD,
  // server: process.env.DB_DEV_SERVER,
  // database: process.env.DB_DEV_DATEBASE,

  user: "azureuser",
  password: "aprkwhs12#$56",
  server: "sqlserver753.database.windows.net",
  database: "sqldb753",
};



// </getDependencies>

// <create>
export const create = async () => {
  // Create express app
  const app = express();
  app.use(express.json());

  // Get root
  app.get('/debug', async (req, res) => {

    res.send(
      prettyJson(
        sortJson({
          route: 'debug',
          headers: sortJson(req.headers),
          env: sortJson(process.env),
        })
      )
    );
  });

  

  app.get('/view-data', async (req,res) => {
    console.log("view-data requested");
    try {
      await sql.connect(dbConfig);

      // SQL 쿼리 실행 (예: 사용자 데이터 조회)
      const result = await sql.query('SELECT * FROM TEST');

      // 쿼리 결과를 JSON 형식으로 반환
      return res.status(200).json(result.recordset);
    } catch(error) {
      res.status(500);
      res.send(error.message);
    }
  });

  // Get Profile and return to client
  app.get('/get-profile', async (req, res) => {

    console.log('/get-profile requested');

    try {

      const profile = {
        "displayName": "John Doe",

        // return true if we have an access token
        "withAuthentication": false
      }
      let profileFromGraph=false;
      //let graphProfile={};

      const bearerToken = req.headers['Authorization'] || req.headers['authorization'];
      console.log(`backend server.js bearerToken ${!!bearerToken ? 'found' : 'not found'}`);

      if (bearerToken) {
        const accessToken = bearerToken.split(' ')[1];
        

        if (!accessToken || accessToken === 'undefined' || accessToken === 'null' || accessToken.length === 0){
          console.log(`backend server.js accessToken: 'not found'}`);
          return res.status(401).json({ error: 'No access token found' });
        } else {
          console.log(`backend server.js accessToken: 'found' ${accessToken}}`);
          profile.withAuthentication = true;
        }

        // TODO: get profile from Graph API
        // Uncomment for the app->app->graph tutorial

        // where did the profile come from
        //profileFromGraph=true;

        // get the profile from Microsoft Graph
        //graphProfile = await getGraphProfile(accessToken);

        // log the profile for debugging
        // console.log(`profile: ${JSON.stringify(graphProfile)}`);
      }

      const dataToReturn = {
        route: '/profile success',
        profile: (profileFromGraph) ? { authentication: true, ...graphProfile }: {...profile},
        headers: req.headers,
        bearerToken,
        env: process.env,
        error: null,
      }
      console.log(`backend server.js profile: ${JSON.stringify(profile)}`)

      return res.status(200).json(dataToReturn);

    } catch (err) {
      const dataToReturn = {
        error: {
          route: '/profile error',
          profile: 'error',
          server_response: err,
          message: err.message,
        },
      }
      console.log(`backend server.js err message: ${err.message}`)

      // Return 200 so error displays in browser for debugging
      // Don't do this in production
      return res.status(200).json(dataToReturn);
    }
  });

  // Route for inserting data into SQL Server
  app.post('/send-data', async (req, res) => {
    try {
      // Connect to SQL Server
      await sql.connect(dbConfig);

      // Extract data from the request body
      const { name, email } = req.body;

      // Execute SQL query to insert data (customize the query as needed)
      const query = "INSERT INTO TEST (name, email) VALUES ("+name+", "+email+");";
      const result = await sql.query(query, {
        name,
        email,
      });

      // Send a success response
      res.json({ message: 'Data inserted successfully' });
    } catch (error) {
      console.error('SQL Insert Error:', error);
      res.status(500).json({ error: 'An error occurred while inserting data into the database.' });
    } finally {
      // Close the SQL connection
      sql.close();
    }
  });

  // instead of 404 - just return home page
  app.get('*', (_, res) => {
    res.json({ status: 'unknown url request' });
  });

  return app;
};
// </create>
