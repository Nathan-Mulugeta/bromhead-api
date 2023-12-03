const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router
  .route('/')
  .get(clientController.getAllClients)
  .post(clientController.createNewClient)
  .patch(clientController.updateClient)
  .delete(clientController.deleteClient);

module.exports = router;