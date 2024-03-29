const express = require('express');
const usersController = require('../controllers/userController');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

router.use(verifyJWT);

router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createNewUser)
  .patch(usersController.updateUser)
  .delete(checkRole, usersController.deleteUser);

module.exports = router;
