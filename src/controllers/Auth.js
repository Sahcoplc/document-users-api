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
            await this.authService.auth(req.body)
            // console.log(user)

            // if (user) {
            //     res.status(200).json({
            //       message: "Login Successful",
            //       data: user,
            //       success: 1,
            //     });
                
            // }
            res.status(400).json({
              message: "Login failed",
              success: 0,
            });

        } catch (error) {
            console.log(error)
        }
    })
}

export default AuthController