const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateAccessToken = (id, username, roles) => {
  return jwt.sign(
    {
      UserInfo: {
        id,
        username,
        roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (res, username) => {
  return jwt.sign({ username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
