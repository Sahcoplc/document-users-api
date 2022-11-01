// UNHANDLE ROUTE RESPONSE
const notFound = (req, res) => {
    res.status(404).send({
      message: `OOPs!! Server can't find ${req.originalUrl}.This could be a typographical issue.Check the API specification for further guidance`,
      success: 0,
    });
};
  
export default notFound;