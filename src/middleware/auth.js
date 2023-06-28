const jwt = require('jsonwebtoken');
const User = require('../models/User')

let auth = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if(token === null) return res.sendStatus(401)

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findOne({'_id': decode.userId})
    if(!user) {
      return res.status(400).send('없는유저입니다')
    }
    req.user = user
    next()
  }catch (error) {
    next(error)
  }
}

module.exports = auth


/* process.env.JWT_SECRET 이렇게 
앞에 process.env 붙이는거는 기존 환경변수 사용법이고
import.meta.env.VITE_SERVER_URL 이렇게 
앞에 import.meta.en 붙이는거는 vite에서의 환경변수 사용법
그래서 앞에 VITE_ 안붙인 변수명은 검색안되서 사용불가
*/