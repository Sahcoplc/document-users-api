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
async function redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams) {

    // Generate PKCE Codes before starting the authorization flow
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Set generated PKCE codes and method as session vars
    req.session.pkceCodes = {
        challengeMethod: 'S256',
        verifier: verifier,
        challenge: challenge,
    };

    /**
     * By manipulating the request objects below before each request, we can obtain
     * auth artifacts with desired claims. For more information, visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
     **/

    req.session.authCodeUrlRequest = {
        redirectUri: config.request.authCodeUrlParameters.redirectUri,
        responseMode: 'form_post', // recommended for confidential clients
        codeChallenge: req.session.pkceCodes.challenge,
        codeChallengeMethod: req.session.pkceCodes.challengeMethod,
        ...authCodeUrlRequestParams,
    };

    req.session.authCodeRequest = {
        redirectUri: config.request.authCodeUrlParameters.redirectUri,
        code: "",
        ...authCodeRequestParams,
    };

    // Get url to sign user in and consent to scopes needed for application
    try {
        const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
        res.redirect(authCodeUrlResponse);
    } catch (error) {
        next(error);
    }
};

// router.get('/acquireToken', asyncWrapper( async (req, res, next) => {

//     // create a GUID for csrf
//     req.session.csrfToken = cryptoProvider.createNewGuid();

//     // encode the state param
//     const state = cryptoProvider.base64Encode(
//         JSON.stringify({
//             csrfToken: req.session.csrfToken,
//             redirectTo: config.request.authCodeUrlParameters.redirectUri
//         })
//     );

//     const authCodeUrlRequestParams = {
//         state: state,
//         scopes: config.request.authCodeUrlParameters.scopes,
//     };

//     const authCodeRequestParams = {
//         scopes: config.request.authCodeUrlParameters.scopes,
//     };

//     // trigger the first leg of auth code flow
//     return redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams)
// }));

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
        req.session.csrfToken = cryptoProvider.createNewGuid();
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
    req.session.isAuthenticated = true
    console.log(req.session)
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
        console.log("Successfully acquired token using Authorization Code.", response);
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