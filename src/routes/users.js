const express = require('express')
const router = express.Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res, next) => {
  //유저데이터를 저장
  try {
    const user = new User(req.body)
    await user.save()
    return res.sendStatus(200)
  }catch (error) {
    next(error)
  }
})

router.post('/login', async(req, res, next) => {
  try{
    //존재하는 유저인지 체크
    const user = await User.findOne({email: req.body.email})
    
    if(!user) {
      return res.status(400).send('Auth failed, email not found')
    }

    //비밀번호가 일치하는지 체크
    const isMatch = await user.comparePassword(req.body.password)

    if(!isMatch) {
      return res.status(400).send('Wrong password')
    }

    //token 생성
    const payload = {
      userId: user._id.toHexString()
    }
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'})

    console.log('히히', user, accessToken)
    return res.json({user, accessToken})
    
  }catch(error) {
    next(error)
  }
})

module.exports = router