import ActiveDirectory from "activedirectory";
import UnauthenticatedError from "../utils/error/unauthenticated.js";
import passport from "passport";
import PassportAD from 'passport-activedirectory'

// LDAP
import ldap from 'ldapjs'


class AuthService {
    constructor() {
        this.url = 'ldap://sahcol.local'
        this.baseDN = 'DC=sahcol,DC=local'
        this.username = process.env.LDAP_USERNAME,
        this.password = process.env.LDAP_PASSWORD
    }

    /**
     * * auth: Authenticate user
     * ! TO DO: Get authorized user details to fetch users from active directory.
     * ! TO DO: Fetch user's data from Microsoft Nav when user is authenticated
     * @param {Object} user 
     */
    
    auth = async (user) => {

        const config = {
            url: 'ldap://sahcol.local',
            baseDN:'DC=sahcol,DC=local',
            username: process.env.LDAP_USERNAME,
            password: process.env.LDAP_PASSWORD,
            includeMembership: ['user', 'group'],
            secure: true,
        }

        try {
    
            const ad = ActiveDirectory(config);

            ad.authenticate(user.staff_email, user.pass_word, function(err, auth) {

                if(err) {
                    console.log('AD Auth error: ', err)
                    // throw new UnauthenticatedError(err.description)
                    return
                }

                if(auth) {
                    
                    console.log('Auth user: ', auth)
                    return authUser
                    
                } else {
                    console.log('Authentication failed!');
                }
            })

            return;

        } catch (error) {
            console.log(error)
        }

    }

    // To log the call back events for testing
    callBack(err, res) {
        if(err) {
            console.log('=== ERROR! ===');
            console.error(err);
            return;
        }
        
        console.log('=== Located Data ===');
        console.log(res);
    };

    // ADDED - I wasn't sure how you had this setup, so I made a simple function to wrap the code in
    // auth(options, callback) {
    //     this.options = options;
    //     this.adSuffix = "OU=Users,DC=domain,DC=local";
        
    //     const searchOptions = {
    //         scope: "sub",
    //         filter: `(userPrincipalName=${this.options.staff_email})`, // ALTERED - Changed to UPN since this was easier for my AD query
    //         // attributes: 'memberOf' // just get memberOf to optimise. 
    //     };

    //     // Create client and bind to AD
    //     const client = ldap.createClient({
    //         url: `ldap://sahcol.local`, // REMOVED - 389 port is set by the ldap protocal at front instead of ldaps
    //         reconnect: true,
    //         idleTimeout: 3000 // ALTERED - To make testing this easier
    //     });

    //     // ADDED - Listen for errors
    //     client.on('error', error => {
    //         callback(err);
    //     });

    //     client.bind(this.options.staff_email, this.options.pass_word, err => {
    //         if (err) {
    //             this.callback(err);
    //             return;
    //         }

    //         // MOVED - Inside bind, only want to query if bind was sucess
    //         client.search(this.adSuffix, searchOptions, (err, res) => {
    //             if (err) {
    //                 this.callback(err);
    //             } else {
    //                 let memberOf = [];
    //                 res.on('error', err => {
    //                     this.callback(err);
    //                 });
    //                 res.on('searchEntry', entry => {
    //                     memberOf = entry.object.memberOf;
    //                 });
    //                 res.on('end', result => {
    //                     this.callback(null, memberOf);
    //                     client.destroy();
    //                 });
    //             };
    //         });
    //     });
    // }
}

export default AuthService;