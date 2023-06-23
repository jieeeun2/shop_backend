const express = require('express')
const path = require('path')
const app = express() //익스프레스 앱 생성
const cors = require('cors')
const port = 4000

const mongoose = require('mongoose')
const dotenv = require('dotenv') //.env에서 설정해놓은 환경변수 이용하기위해 dotenv필요 
dotenv.config()

app.use(cors())
app.use(express.json()) //이거쓰면 json형태의 req.body를 받을경우 undefine가 생기는 문제 해결가넝
//근데 애초에 왜 이런 문제가 일어나는건데

mongoose.connect(process.env.MONGO_URI)
  .then( ()=> {
    console.log('연결완료')
  })
  .catch(err => {
    console.log(err)
  })

/* app.get('/', (req, res) => {
  throw new Error('it is an Error') //1. 이렇게만 쓰면 원래는 에러메세지가 뜨고 서버가 다운이 됨
  //express는 에러가나면 에러처리기로 해결을 해주는데 에러처리기가 없어서 이런거임
}) */
/* app.get('/', (req, res) => {
  setImmediate(() => {throw new Error('it is an Error')})
}) */
app.get('/', (req, res, next) => {
  setImmediate(() => {next(new Error('it is an Error'))})
})


app.post('/', (req, res) => {
  console.log(req.body)
  res.json(req.body)
})

app.use((error, req, res, next) => { //2. 에러는 에러처리기로 와서 res.send하면 클라이언트로 전달
  res.status(err.status || 500)
  res.send(error.message || '서버에서 에러가 났습니다') 
})

app.use(express.static(path.join(__dirname, '../uploads')))
//터미널에서 어떤경로에서 실행하든 똑같은 결과가 나와야하니깐
//절대경로로 해야함

app.listen(4000, () => { //익스프레스 앱 실행
  console.log(`${port}번에서 실행이 되었습니다`)
})  