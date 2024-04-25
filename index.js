require("dotenv").config({ path: ".env" });
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { ApolloServer, gql } = require("apollo-server-express");
const { sameSiteCookieMiddleware } = require("express-samesite-default");
const cors = require("cors");
const http = require("http");
const path = require("path");
const GraphQLTypes = require("./graphql/typeDefs");
const GraphQLResolvers = require("./graphql/resolvers");
const fileCatcher = require("./fileCatcher");
const dateResolve = require("./dateResolve");
const app = express();
const momenttz = require('moment-timezone');


const PORT = process.env.PORT || 4000;

app.enable("trust proxy");
app.use(sameSiteCookieMiddleware());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.disable("x-powered-by");

const corsOptions = {
  origin: true,
  credentials: true,
  enablePreflight: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Methods",
    "Access-Control-Request-Headers",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.options("*/*", cors(corsOptions));



const server = new ApolloServer({
  typeDefs: GraphQLTypes,
  resolvers: GraphQLResolvers,
  subscriptions: {
    keepAlive: 10000,
    onConnect: (connectionParams, webSocket, context) => {
      // Handle WebSocket connection here
    },
    onDisconnect: (webSocket, context) => {
      // Handle WebSocket disconnection here
    },
    path: "/graphql",
  },
  context: ({ req, res }) => ({
    req,
    res,
    resolver: GraphQLResolvers

  }),
});

server.applyMiddleware({
  app: app,
  path: "/graphql",
  cors: false,
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});
async function fetchFoldersPath() {
  const { data } = await server.executeOperation({
    schema: server.schema,
    contextValue: server.context,
    query: gql`
        query {
          get_folders_path {
            id
            path
            folder_name
          }
        }
      `,

  });

  return data.get_folders_path;
}

async function fetchTodayFiles(folderId) {
  const { data } = await server.executeOperation({
    schema: server.schema,
    contextValue: server.context,

    query: gql`
      query ($folderId: String!) {
        get_today_files(folderId: $folderId){
          id
          preview
          filename
          createdAt
          extension
          truncatedTranscriptionText
          folder{
            id
            path
            folder_name
          }
          moreInfo
          deleted
          size
        }
      }
    `,
    variables: {
      folderId: folderId, // Replace with the desired variable values
    },

  });

  return data.get_today_files;

}

async function forceFolderToRefreshAll() {
  await server.executeOperation({
    schema: server.schema,
    contextValue: server.context,
    query: gql`
      query {
        force_folder_to_refresh_all{
        success
        error
        result
        }
      }
    `

  });

}

global.files = {};
getDirFiles();


let currentDate = dateResolve.getMomentDate();
async function getDirFiles() {


  const foldersPath = await fetchFoldersPath();

  if(foldersPath){
  for (const item of foldersPath) {
    global.files["id" + item.id] = await fetchTodayFiles(item.id);

  }
  startFileCatcher();
}else{
  await new Promise((resolve) => setTimeout(resolve, 5000));
 await getDirFiles();
}
}


async function startFileCatcher() {
 
 
  try {
    const foldersPath = await fetchFoldersPath();
    for (const item of foldersPath) {
      try{
      await fileCatcher.scanDirectory(item.folder_name, "id" + item.id, item.path, server);
      console.log(dateResolve.getMomentDate().format('(YYYY-MM-DD hh:mm:ss a) ') + "Listening folder ------- ",item.path)
      }catch(directoryScanError){
        
        if(directoryScanError.errno == -4058){
          console.log("* " + dateResolve.getMomentDate().format('(YYYY-MM-DD hh:mm:ss a) ') +"Folder not found ------- ",item.path)
        }else
        throw directoryScanError;
      }
 
      app.use(`/${ path.basename(item.path).replace(/\s+/g, '')}`, express.static(item.path));
    }
  }
  catch (error) {
   
    console.error("Error:", error);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const newDate = dateResolve.getMomentDate();
    if (newDate.date() !== currentDate.date()) {

      currentDate = newDate;
      forceFolderToRefreshAll();
      global.files = {};
      getDirFiles();
    } else {

      startFileCatcher();
    }
  }
}

