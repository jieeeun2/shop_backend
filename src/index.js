const express = require('express')
const app = express()

const path = require('path')

const cors = require('cors')
const port = 4000

const mongoose = require('mongoose')
const dotenv = require('dotenv')  
dotenv.config()

app.use(cors()) //모든 도메인에서 제한 없이 통신가넝
app.use(express.json()) //이거쓰면 json형태의 req.body를 받을경우 undefine가 생기는 문제 해결가넝
//근데 애초에 왜 이런 문제가 일어나는건데

mongoose.connect(process.env.MONGO_URI)
  .then( ()=> {
    console.log('연결완료')
  })
  .catch(err => {
    console.log('에러에러', err)
  })


app.get('/', (req, res, next) => {
  setImmediate(() => {
    next(new Error('it is an Error'))
  })
})

app.post('/', (req, res) => {
  console.log(req.body)
  res.json(req.body)
})

app.use((err, req, res, next) => { //2. 에러는 에러처리기로 와서 res.send하면 클라이언트로 전달
  res.status(err.status || 500)
  res.send(err.message || '서버에서 에러가 났습니다') 
})

app.use(express.static(path.join(__dirname, '../uploads')))
//터미널에서 어떤경로에서 실행하든 똑같은 결과가 나와야하니깐
//절대경로로 해야함

app.listen(port, () => { //익스프레스 앱 실행
  console.log(`${port}번에서 실행이 되었습니다`)
})  








app.use('/users', require('./routes/users'))
app.use('/products', require('./routes/products'))