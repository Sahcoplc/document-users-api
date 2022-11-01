import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).send({
      message: `Welcome to Skyway Aviation Handling Company Budget Management Application API. Check the API specification for further guidiance and next steps.`,
      success: 1,
    });
});

export default router;