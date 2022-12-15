import express from "express";
import url from 'url'
import msal from '@azure/msal-node'
import { config } from '../config/config.js'
import asyncWrapper from "../middlewares/async.js";
import { cachePlugin } from "../config/cachePlugin.js";

const router = express.Router();

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: msal.LogLevel.Verbose,
}

const clientConfig = {
    auth: config.authOptions,
    // cache: {
    //     cachePlugin
    // },
    // Uncomment the code below to enable the MSAL logger
    system: {
        loggerOptions: loggerOptions
    }

};

const msalInstance = new msal.ConfidentialClientApplication(clientConfig);
const cryptoProvider = new msal.CryptoProvider();
const POST_LOGOUT_REDIRECT_URI = "https://sahcocareers.com/index.html"
const requestConfig = config.request;

/**
 * Prepares the auth code request parameters and initiates the first leg of auth code flow
 * @param req: Express request object
 * @param res: Express response object
 * @param next: Express next function
 * @param authCodeUrlRequestParams: parameters for requesting an auth code url
 * @param authCodeRequestParams: parameters for requesting tokens using auth code
 */

router.get('/signout', function (req, res) {
    /**
     * Construct a logout URI and redirect the user to end the
     * session with Azure AD. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
     */
    const logoutUri = `${config.authOptions.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${POST_LOGOUT_REDIRECT_URI}`;

    req.session.destroy(() => {
        res.redirect(logoutUri);
    });
});

router.get("/signin", (req, res) => {
    // if redirectUri is set to the main route "/", redirect to "/redirect" route for handling authZ code
    if (req.query.code ) return res.redirect(url.format({pathname: "/redirect", query: req.query}));

    const { authCodeUrlParameters } = requestConfig;

    if (req.query) {
        // Check for the state parameter

        req.session.csrfToken = cryptoProvider.createNewGuid();
        authCodeUrlParameters.state = req.query.state ? req.query.state : cryptoProvider.createNewGuid();
        // Check for nonce parameter

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
    req.session.isAuthenticated = true
    
   msalInstance.getAuthCodeUrl(authCodeUrlParameters).then((authCodeUrl) => {
       res.redirect(authCodeUrl);
    }).catch((error) => console.log(JSON.stringify(error)));
});

router.get("/acquireToken", (req, res) => {
    const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code, state:req.session.state };
    const authCodeResponse = { 
        nonce: req.session.nonce, 
        code: req.query.code,
        state: req.session.state
    };

    msalInstance.acquireTokenByCode(tokenRequest, authCodeResponse).then((response) => {
        console.log("Successfully acquired token using Authorization Code.");
        req.session.account = response.account
        req.session.accessToken = response.accessToken
        req.session.isAuthenticated = true
        res.status(200).json(response);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

export default router