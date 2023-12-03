const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

router.use(verifyJWT);

router
  .route('/')
  .get(clientController.getAllClients)
  .post(checkRole, clientController.createNewClient)
  .patch(checkRole, clientController.updateClient)
  .delete(checkRole, clientController.deleteClient);

module.exports = router;
