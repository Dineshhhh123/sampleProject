require('dotenv').config();
const jwt = require('jsonwebtoken');
const Ilostuser = require('../models/userSchema')
const bcrypt = require('bcrypt');


class userController {

  loginOrRegister = async (req, res) => {
    try {
      const { emailAddress } = req.body;

      const existingUser = await Ilostuser.findOne({ emailAddress });
      //register
      if (!existingUser) {
        const { password, confirmPassword } = req.body;
        if (password === confirmPassword) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = new Ilostuser({ emailAddress, password: hashedPassword });
          await user.save();
          res.status(200).json([{ message: 'user registered successfully' }]);
        }
        else {
          res.status(400).json({ message: "confirmpassword and password doesn't match" })
        }
      }
      //login
      else {
        const { password } = req.body;
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Password incorrect' });
        }
        const token = jwt.sign({ userId: existingUser._id }, process.env.USER_KEY);
        res.status(200).json([{ message: 'login successfully' }, { token }]);

      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' })
    }
  }

}

module.exports = new userController();
