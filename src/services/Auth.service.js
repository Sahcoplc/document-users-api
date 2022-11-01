import ActiveDirectory from "activedirectory";
import { promisify } from 'util';

class AuthService {
    constructor() {
        this.url = 'ldap://sahcoplc.sahcoplc.com'
        this.baseDN = 'dc=sahcoplc,dc=com'
        this.username = process.env.LDAP_USERNAME,
        this.password = process.env.LDAP_PASSWORD
    }
    
    auth = async (user) => {
        const config = {
            url: this.url,
            baseDN: this.baseDN,
            username: this.username,
            password: this.password
        }

        try {
            
            const ad = new ActiveDirectory(config);
    
            const activedirectory = promisify(ad)
            const user = await activedirectory.authenticate(user.username, user.password)
            console.log(user)

            return user

        } catch (error) {
            console.log(error)
        }

    }
}

export default AuthService;