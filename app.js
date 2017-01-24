var express = require('express');
var request = require('request');
var app = express();
var port = process.env.PORT || 3000;
var connect = require('connect');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var json = require('json');
var mongoose = require("mongoose");
var mongodb = require('mongodb');
var fs = require('fs');
var screenshotlist = require('/home/ubuntu/screenshot/screenshot_list');
var descriptionlist = require('/home/ubuntu/screenshot/description_list');
var projectlist = require('/home/ubuntu/screenshot/project_list');

let CanvasImage = require('./canvasImage')
let Field = require('./field')

var http_protocol = 'http://';
var server_address = '52.79.155.110:3000';
var img_write_path = '/public/images/';
var img_access_path = '/static/images/';

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function () {
  // CONNECTED TO MONGODB SERVER
  console.log("Connected to mongod server");
});


mongoose.connect('mongodb://localhost/proj5');

var allowCORS = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Access-Control-Allow-Origin, Access-Control-Allow-Methods');
  (req.method === 'OPTIONS') ?
  res.sendStatus(200) :
  next();
};

// 이 부분은 app.use(router) 전에 추가하도록 하자
app.use(allowCORS);

// Configuration
app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public'));
//app.use(bodyParser());
app.use(bodyParser({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.set('views', __dirname + '/views')
// app.set('view engine', 'ejs')
// app.engine('html', require('ejs').renderFile)

var server = app.listen(port);
console.log('The App runs on port ' + port);

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// app.get('/', function (req, res) {
//   screenshotlist.find(function (err, shots) {
//     for(let i = 0; i< shots.length; i++){
//       console.log(shots[i].imgURL)
//     }
//     res.render('index', {
//       screenshotList: shots
//     })
//   })
// })

app.get('/searchSkill/:queryString', function(req, res) {
  let queryString = req.params.queryString
  console.log(queryString)
  let descCodeList = []
  let descTimelineList = []
  descriptionlist.find({"codes.code": new RegExp(queryString, 'i')}, {skillID: true}, function (err, list) {
    if(err){
      console.log(err)
    } else {

      descCodeList = list
      descriptionlist.find({"timeline": new RegExp(queryString, 'i')}, {skillID: true}, function (err, list) {
        if(err){
          console.log(err)
        } else {
          descTimelineList = list
          let skillIDs = descCodeList.concat(descTimelineList)
          console.log(skillIDs)
          let skillIDList = skillIDs.filter(function(item, pos) {
            return skillIDs.indexOf(item) == pos
          })
          console.log(skillIDList)

          let skillIDNameList = []
          for(let i = 0; i< skillIDList.length; i++) {
            console.log(skillIDList[i].skillID)
            Field.findOne({"skills._id": skillIDList[i].skillID }, {'skills.$' : 1}, function (err, item) {
              console.log(item.skills[0])
              skillIDNameList.push(item.skills[0])
              if(skillIDNameList.length == skillIDList.length) {
                res.send(skillIDNameList)
              }
            })
          }
          
        }
      }.bind(this))
    }
  }.bind(this))
})

app.get('/getFields', function (req, res) {
  Field.find(function(err, fields) {
    res.send(fields)
  })
})

app.get('/getProjects', function (req, res) {
  projectlist.find(function(err, projects) {
    res.send(projects)
  })
})

app.post('/addCode', function (req, res) {
  console.log(req.body);
  projectlist.findOne({_id : req.body.projectID}, function(err, project) {
    if(err){
      console.log(err);
    }
    else {
      if(req.body.newTitle != "" ){
        project.Codes.push({title: req.body.newTitle, code: req.body.newCode})
      }
      project.Codes = project.Codes.concat(req.body.codeUploads)
      project.save(function(err) {
        if(err){
          console.log('save failed')
          res.send({result: 'failed'})
        } else {
          console.log('skill saved')
          res.send({result: 'success', project: project})
        }
      })
    }
  })
})

app.post('/createSkill', function (req, res) {
  let fieldName = req.body.fieldName
  Field.findOne({name: fieldName}, function(err, field) {
    if(err){
      console.log(err);
    }
    else if(!field){
      var newField = new Field({
        name : fieldName,
        skills: [{name : req.body.skillName}]
      })
      newField.save(function(err){
        if(err){
          console.log('save failed')
          res.send({result: 'failed'})
        } else {
          console.log('skill saved')
          res.send({result: 'success'})
        }
        return;
      })
    }
    else {
      field.skills.push({ name: req.body.skillName })
      field.save(function(err) {
        if(err){
          console.log('save failed')
          res.send({result: 'failed'})
        } else {
          console.log('skill saved')
          res.send({resutl: 'success'})
        }
      })
    }
  })
})

app.post('/createProject', function (req, res) {
  let projectName = req.body.name
  var newProject = new projectlist({
    Name : projectName,
    Codes: []
  })
  newProject.save(function(err){
    if(err){
      console.log('save failed')
      res.send({result: 'failed'})
    } else {
      console.log('project saved')
      res.send({result: 'success', project : newProject})
    }
    return;
  })
})

app.get('/getScreenShotLists', function(req, res){
  console.log('entered');
  screenshotlist.find(function(err, shots){
    res.send(shots);
  });
});

app.post('/uploadImage', function (req, res) {
  var json = req.body;
  console.log(json);
  var url = saveImageSync(json.image);
  console.log(url);
  var screenshot = new screenshotlist({
    reference: json.ref,
    imgURL: url
    
  });
  screenshot.save(function(err){
    if(err) console.log('some error occured..' + err);
    else{
      console.log('successfully saved screenshot!');
      res.send({result : 'success', imgURL: url});
    }
  });
});

app.post('/submitDescription', function (req, res) {
  var json = req.body;
  var description = new descriptionlist(json);
  descriptionlist.findOneAndUpdate({skillID : json.skillID}, {cardlist : json.cardlist, timeline : json.timeline, codes : json.codes}, function(err){
    console.log("wtf");
    if(err) console.log(err);
    else{
      res.send({result: 'success'});
    }
  })

});

app.post('/getDescription', function (req, res) {
  var json = req.body;
  console.log(json);
  descriptionlist.findOne({skillID : json.skillID}, function(err, des){
    if(err) console.log(err);
    else if(des == null){
      console.log("wtf");
      var newdescription = new descriptionlist({
        skillID: json.skillID,
        cardlist: [],
        timeline: "",
        codes: []
      });
      newdescription.save(function(err){
        if(err) console.log(err);
        else{
          res.send({description : newdescription});
        }
      });
    }
    else{
      console.log("hi");
      res.send({description : des});
    }
  })

});


app.post('/savePosition/:imgURL', function(req, res) {
  let ci = new CanvasImage({
    imgURL: decodeURIComponent(req.params.imgURL),
    posX: req.body.posX,
    posY: req.body.posY,
    width: req.body.width,
    height: req.body.height,
    skillID: req.body.skillID,
    description: ''
  })
  ci.save(function(err){
    if(err){
      console.log('save failed')
      res.send({result: 'failed'})
    } else {
      console.log('position save successful')
      res.send({result: 'success'})
    }
  })
})

app.put('/updatePosition/:imgURL', function (req, res) {
  CanvasImage.findOneAndUpdate(
  {
    imgURL: decodeURIComponent(req.params.imgURL)
  },
  {
    posX: req.body.posX,
    posY: req.body.posY
  }, 
  function (err) {
    if (err) {
      console.log('save failed')
      res.send({ result: 'failed' })
    } else {
      console.log('position save successful')
      res.send({result: 'success'})
    }
  }
  )
})

app.put('/updateSize/:imgURL', function (req, res) {
  CanvasImage.findOneAndUpdate(
  {
    imgURL: decodeURIComponent(req.params.imgURL)
  },
  {
    width: req.body.width,
    height: req.body.height
  }, 
  function (err) {
    if (err) {
      console.log('save failed')
      res.send({ result: 'failed' })
    } else {
      console.log('position save successful')
      res.send({result: 'success'})
    }
  }
  )
})

app.put('/updateDescription/:imgURL', function (req, res) {
  CanvasImage.findOneAndUpdate(
  {
    imgURL: decodeURIComponent(req.params.imgURL)
  },
  {
    description: req.body.description
  }, 
  function (err) {
    if (err) {
      console.log('save failed')
      res.send({ result: 'failed' })
    } else {
      console.log(req.body.description)
      res.send({result: 'success'})
    }
  }
  )
})

app.delete('/deletePosition/:imgURL', function (req, res) {
  CanvasImage.remove(
  {
    imgURL: decodeURIComponent(req.params.imgURL)
  },
  function (err) {
    if (err) {
      console.log('remove failed')
      res.send({ result: 'failed' })
    } else {
      console.log('position save successful')
      res.send({result: 'success'})
    }
  }
  )
})

app.get('/getPosition/:skillID', function(req, res) {
  console.log(req.header)
  CanvasImage.find({ skillID : req.params.skillID }, function (err, list) {
    if (err) {
      console.log(err)
      return res.status(500).json({error: 'database failure'});
    }
    if(!list){
      console.log(err);
      return res.status(500).json({error: 'cannot query'});
    }
    let newList = list.map(function (item) {
      return {
        imgURL: encodeURIComponent(item.imgURL),
        posX: item.posX,
        posY: item.posY,
        width: item.width,
        height: item.height,
        skillID: item.skillID,
        description: item.description
      }
    })
    // res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
    // res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    // res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
    console.log(newList)
    res.json(newList)
  })
})

// app.options('/getPosition', function(req, res) {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
//   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
//   res.sendStatus(200)
// })

function decodeBase64Image(dataString) {
  var response = {};

  response.data = new Buffer(dataString, 'base64');

  return response;
}


function saveImageSync(base64Data) {
  console.log('BASE64DATA : ' + base64Data)

  var imageBuffer = decodeBase64Image(base64Data.toString());
  var filename = "img_" + Date.now() + ".jpg";
  var filepath = __dirname + img_write_path + filename;
  console.log(filepath);
  console.log(decodeBase64Image(base64Data).data);
  fs.writeFileSync(filepath, imageBuffer.data);
  console.log('D');
  var url = http_protocol + server_address + img_access_path + filename;

  return url;
}
