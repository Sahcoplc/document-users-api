import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({
    message: `Hello from SAHCO DOCS Authentication. Check the API specification for further guidiance and next steps.`,
    isAuthenticated: req.session.isAuthenticated,
    username: req?.session?.account?.username,
    success: 1,
  });
});

export default router;