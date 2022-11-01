import asyncWrapper from "../middlewares/async.js";
import AuthService from "../services/Auth.service.js";
import BadRequest from "../utils/error/badRequest.js";


class AuthController {
    authService;

    constructor() {
        this.authService = new AuthService()
    }

    login = asyncWrapper(async (req, res) => {

        try {
            console.log(req.body)
            const user = this.authService.auth(req.body)

            if (user) {

                res.status(200).json({
                  message: "Login Successful",
                  data: user,
                  success: 1,
                });
        
            } else {
        
                throw new BadRequest("Invalid credentials");
        
            }
        } catch (error) {
            console.log(error)
        }
    })
}

export default AuthController