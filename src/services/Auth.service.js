import ActiveDirectory from "activedirectory";
import UnauthenticatedError from "../utils/error/unauthenticated.js";

class AuthService {
    constructor() {
        this.url = 'ldap://sahcoplc.sahcoplc.com'
        this.baseDN = 'dc=sahcoplc,dc=com'
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
            url: this.url,
            baseDN: this.baseDN,
            username: this.username,
            password: this.password
        }

        try {
            
            const ad = new ActiveDirectory(config);

            ad.authenticate(user.username, user.password, function(err, authUser) {

                if(err) {
                    console.log('Auth error: ', err)
                    // throw new UnauthenticatedError(err.description)
                    return err.description
                }

                if(authUser) {
                    
                    console.log('Auth user: ', authUser)
                    return authUser
                    
                }
            })


        } catch (error) {
            console.log(error)
        }

    }
}

export default AuthService;