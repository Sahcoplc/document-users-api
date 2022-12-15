import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import morgan from 'morgan'


//Import routes
import homeRoutes from './src/routes/home.js'
import authRoutes from './src/routes/Auth.js'
import userRoutes from './src/routes/User.js'
import notFound from "./src/middlewares/notFound.js";
import { config } from "./src/config/config.js";

dotenv.config('.');

const sessionConfig = {
  secret: config.authOptions.clientSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set this to true on production
  }
}

// Port
let PORT =  process.env.PORT || process.env.DEV_PORT;

const app = express()

app.use(session(sessionConfig));

app.use(morgan('dev'));
app.use(express.json());
// app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

const apiPath = "/api";
app.use(apiPath + "/", homeRoutes);
app.use(apiPath + "/user", userRoutes);
app.use(apiPath + "/auth", authRoutes);


app.use(notFound);
/**
 * HANDLING UNCAUGHT EXCEPTION ERRORS
 * Process.traceDeprecation = true;
 */
process.on("uncaughtException", (err) => {
  console.log(
    `UNCAUGHT EXCEPTION! Server Shutting down...\n
      ${err.name} \n ${err.message} \n ${err.stack}`
  );
  process.exit(1);
});


// Create and start server
const server_start = async () => {
  try {

    app.listen(PORT, () =>
      console.log(`Server is listening on port ${PORT}...`)
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
  
server_start();
