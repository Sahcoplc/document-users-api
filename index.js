import express from "express";
import dotenv from "dotenv";
dotenv.config('.');

import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import notFound from "./src/middlewares/notFound.js";

// Import routes
import homeRoutes from './src/routes/home.js'
import authRoutes from './src/routes/Auth.js'
import errorHandlerMiddleware from "./src/middlewares/errorHandler.js";

// Configure app
const app = express();

app.use(helmet())
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

// Port
let PORT =  process.env.PORT || process.env.DEV_PORT;

// Routes
const apiPath = "/api";
app.use(apiPath + "/", homeRoutes);
app.use(apiPath + '/auth', authRoutes)


// Use middlewares
app.use(notFound);
app.use(errorHandlerMiddleware)

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

const server_start = async () => {
    try {
        // Open Mysql Connection

        // AppDataSource.initialize()
        // .then(() => {
        //         // here you can start to work with your database
        //         console.log('Database initialized')
        // })
        // .catch((error) => console.log(error))

        if (PORT == '' || PORT == null) {
            PORT = 8002
        }
        app.listen(PORT, ()=> {
            console.log(`Server is running on port ${PORT}`)
        })

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

server_start()