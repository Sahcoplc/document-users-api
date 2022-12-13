import express, { request } from "express";
import msal from '@azure/msal-node'
import dotenv from "dotenv";
import url from 'url'
import session from "express-session";
import { config } from './src/config/config.js'
import { cachePlugin } from "./src/config/cachePlugin.js";

dotenv.config('.');

const sessionConfig = {
    secret: process.env.DOCS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}

// Port
let PORT =  process.env.PORT || process.env.DEV_PORT;

// Sample Application Code
// The application code is exported so it can be executed in automation environments
const getTokenAuthCode = function (scenarioConfig, clientApplication, port) {

    // Set the port that the express server will listen on
    const serverPort = port || PORT;

    // Create Express App and Routes
    const app = express();

    app.use(session(sessionConfig))

    const requestConfig = scenarioConfig.request;

    app.get("/", (req, res) => {
        // if redirectUri is set to the main route "/", redirect to "/redirect" route for handling authZ code
        if (req.query.code ) return res.redirect(url.format({pathname: "/redirect", query: req.query}));

        const { authCodeUrlParameters } = requestConfig;

        const cryptoProvider = new msal.CryptoProvider()

        if (req.query) {
            // Check for the state parameter
             /**
             * MSAL Node supports the OAuth2.0 state parameter which is used to prevent CSRF attacks.
             * The CryptoProvider class provided by MSAL exposes the createNewGuid() API that generates random GUID
             * used to populate the state value if none is provided.
             * 
             * The generated state is then cached and passed as part of authCodeUrlParameters during authentication request.
             * The cached state must then be passed as part of authCodeResponse in ClientApplicaiton.acquireTokenByCode API call, 
             * to be validated before the authorization code is sent to the server in exchange for an access token.
             * 
             * For more information about state,
             * visit https://datatracker.ietf.org/doc/html/rfc6819#section-3.6
             */
            authCodeUrlParameters.state = req.query.state ? req.query.state : cryptoProvider.createNewGuid();
            // Check for nonce parameter
            /**
             * MSAL Node supports the OIDC nonce feature which is used to protect against token replay.
             * The CryptoProvider class provided by MSAL exposes the createNewGuid() API that generates random GUID
             * used to populate the nonce value if none is provided.
             *
             * The generated nonce is then cached and passed as part of authCodeUrlParameters during authentication request.
             *
             * For more information about nonce,
             * visit https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-4.5.3.2
             */

            authCodeUrlParameters.nonce = req.query.nonce ? req.query.nonce : cryptoProvider.createNewGuid();

            // Check for the prompt parameter
            if (req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

            // Check for the loginHint parameter
            if (req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

            // Check for the domainHint parameter
            if (req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
        }

        req.session.nonce = authCodeUrlParameters.nonce //switch to a more persistent storage method.
        req.session.state = authCodeUrlParameters.state
        
        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplicaiton.getAuthCodeUrl API.
         *
         * Authorization Code Grant: First Leg
         *
         * In this code block, the application uses MSAL to obtain an authorization code request URL. Once the URL is
         * returned by MSAL, the express application is redirected to said request URL, concluding the first leg of the
         * Authorization Code Grant flow.
         */
        clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((authCodeUrl) => {
            res.redirect(authCodeUrl);
        }).catch((error) => console.log(JSON.stringify(error)));
    });

    app.get("/redirect", (req, res) => {
        const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code, state:req.query.state };
        const authCodeResponse = { 
            nonce: req.session.nonce, 
            code: req.query.code,
            state: req.session.state
        };

        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenByCode API.
         *
         * Authorization Code Grant: Second Leg
         *
         * In this code block, the application uses MSAL to obtain an Access Token from the configured authentication service.
         * The cached nonce is passed in authCodeResponse object and shall later be validated by MSAL once the Access Token and ID
         * token are returned.
         * The response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
         * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
         */

        clientApplication.acquireTokenByCode(tokenRequest, authCodeResponse).then((response) => {
            console.log("Successfully acquired token using Authorization Code.");
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    return app.listen(serverPort, () => console.log(`Msal Node Auth Code Sample app listening on port ${serverPort}!`));
}



/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a PublicClientApplication object
 * and execute the sample application.
 */
 if(process.env.SERVER_FILE === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
            piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    }

    // Build MSAL ClientApplication Configuration object
    const clientConfig = {
        auth: config.authOptions,
        cache: {
            cachePlugin
        },
        // Uncomment the code below to enable the MSAL logger
        
        system: {
            loggerOptions: loggerOptions
        }
        
    };

    // Create an MSAL PublicClientApplication object
    const confidentialClientApplication = new msal.ConfidentialClientApplication(clientConfig);
    
    // Execute sample application with the configured MSAL PublicClientApplication
    getTokenAuthCode(config, confidentialClientApplication, null);
    
}
