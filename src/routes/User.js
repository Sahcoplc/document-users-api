import express from "express";
import asyncWrapper from "../middlewares/async.js";
import { fetchProfile } from "../utils/axios.js";

const router = express.Router();

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/api/auth/signin'); // redirect to sign-in route
    }

    next();
};

router.get('/id',
    isAuthenticated, // check if user is authenticated
    asyncWrapper(async (req, res, next) => {
        res.status(200).json({ idTokenClaims: req.session.account.idTokenClaims });
    })
);

router.get('/profile',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        try {
            const user = await fetchProfile(req.session.accessToken)

            res.json(user);
            
        } catch (error) {
            next(error);
        }
    }
);

export default router