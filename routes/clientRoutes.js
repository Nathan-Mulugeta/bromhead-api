const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router
  .route('/')
  .get(clientController.getAllClients)
  .post(clientController.createNewClient)
  .patch(clientController.updateClient)
  .delete(clientController.deleteClient);

module.exports = router;
