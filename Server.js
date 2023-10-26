const express = require("express");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const Files = require('./models/files');
const connetDB = require("./config/dbConnection");
// const fs = require("fs");
// const path = require('path');
// const { convertImageToPDF } = require("./middlewares/imageToPdf");
const cors = require("cors");

require("dotenv").config()

connetDB()

const app = express()
app.use(cors());

const PORT = process.env.PORT || 3000;

app.listen(PORT , () => {
  console.log(`Server is up and running on PORT ${PORT}`)
})

aws.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY, 
  region: 'ap-south-1'
})


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

const BUCKET = process.env.BUCKET

const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    bucket: BUCKET,
    s3: s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req,file,cb) => {
      console.log(req.body)
      let fileName = req.body.fileName;
      cb(null,Date.now()+'_'+fileName)
    }
  })
})

app.get('/test',(req,res) => {
  console.log(req.fileName)
 res.send("hello world")
})


app.post('/upload', upload.single("file"), async (req,res) => {
  console.log(req.file)
  const file = await Files.create({
    fileName: req.file.key
  })



  res.send("Successfully uploaded"+ file)
})

// app.get('/convert/:filename', async (req,res) => {
//   const filename = req.params.filename;
//   console.log("filename",{filename})
//   let x = await s3.getObject({Bucket : BUCKET, Key:filename}).promise()
//   // console.log(JSON.stringify(x))
//   const jpegData = x.Body;
//   const imagePath = `/tmp/${filename}.jpeg`;
//   fs.writeFileSync(imagePath, jpegData);
//   const pdfPath = await convertImageToPDF(imagePath);
//   const pdfData = fs.readFileSync(pdfPath);

//   let resp = await s3.putObject({
//     Bucket: BUCKET,
//     Key: filename,
//     Body: pdfData,
//     ContentType: 'application/pdf'
// }).promise();

// // Clean up temp PDF file
//   fs.unlinkSync(pdfPath);
//   res.send({resp})

// })

app.get('/list', async (req,res) => {
  const data = await Files.find()
  // console.log({data})
  res.status(200).json(data)
})



app.get('/awslist', async(req,res)=>{
  let r = await s3.listObjectsV2({Bucket:BUCKET}).promise();
  let x = r.Contents.map(item => item.Key)
  res.send(x)
})

app.get("/:filename", async(req,res) => {
  const filename = req.params.filename
  let x = s3.getSignedUrl('getObject',{Bucket : BUCKET, Key:filename})

  // let x = await s3.getObject({Bucket : BUCKET, Key:filename}).promise()
  console.log(x)
  
  res.send(x)
})

app.delete("/delete/:fileId", async (req,res) => {
  console.log("req",req)
  const fileId = req.params.fileId
  const file = await Files.findById(fileId);
  console.log({file})
  if (!file) {
    res.status(404).send("No such file exist")
  } else {
    await Files.deleteOne({_id : fileId })

    await s3.deleteObject({Bucket : BUCKET , Key : file.fileName}).promise()

    res.status(200).send("file deleted successfully")
  }
})
