// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var redis = require("redis");
//var redisClient = redis.createClient();

var rest = require('unirest');
//var $ = require('jquery'); 
          
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use("/generate", function(req, res, next) {
  //console.log(req);
  var rnumber = req.query.rnumber;
  if (rnumber === undefined || rnumber > 999999) { 
    console.log("Bad random seed!", rnumber);
    //https://stackoverflow.com/a/38158081/307454
    //res.sendStatus(500);
    res.status(500).send("Bad random seed: " + rnumber);
  }
  else 
    next();
});


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/responses", function (request, response) {
  response.send(quoteList);
});


// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.get("/generate", function (request, response) {
  //console.log(request);
  //dreams.push(request.query.dream);
  //console.log (response); 
  //console.log(" POST:::" + request.query.question + " // " + request.query.kid); 
  //console.log(" POST:::", request); //.query.question + " // " + request.query.kid); 
  console.log("inside app post"); 
  getQuote(request.query, function funcToInvokeAfterUnirestPOST(resp) {
    //console.log (resp.request); 
    //console.log("PATH:: " + resp.request.path); 
    //console.log("resp.body: ", resp.body);
    var responseQA = resp.body;
    
    if (typeof responseQA === "string" || responseQA instanceof String) {
      console.log("**** received string instead of Object!"); 
      //responseQA = responseQA.replace('/u005c','\u005c\u005c');
      responseQA = responseQA.replace(/\\'/g, "'");
      try {
        responseQA = JSON.parse(responseQA);
      } catch (e) { 
        console.log("Bad JSON string", responseQA);
        // need to return with a response
        // otherwise, a "undefined" will show up
      }
    }
      
    quoteList.unshift(responseQA);
    //console.log(quoteList);
    // response.send(request.query.dream + ":("+ resp.body.score +")" + resp.body.answer);
    //response.send(resp.request.path + " :("+ resp.body.score +")" + resp.body.answer);
    // response.send ("junk");
  
  });
  response.sendStatus(200);
  //response.send(quoteList[quoteList.length-1]);
});


/*
 * STEP 1 : Setup the URL to point at the Forismatic API
 * STEP 2 : Build the query with a random number 
 * STEP 3 : Make the Unirest POST call
 */
function getQuote (query, funcToInvokeAfterUnirestPOST) {
  var quoteApi = "http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en";

  // STEP 2
  console.log("****** rnumber", query.rnumber);
  //var payload = {"key": query.question, "lang": "en"};
  var payload = {"key": query.rnumber, "lang": "en"};

  // STEP 3
  rest.post(quoteApi)
    .type('json')
    .send(payload)
    .end(function funcToInvokeAfterQandA (responseFromQandA) {  
      if (funcToInvokeAfterUnirestPOST)  // Was a callback function specified? 
        funcToInvokeAfterUnirestPOST(responseFromQandA);
      else  // otherwise send the response to the console 
        console.log(responseFromQandA.body);
    });
}

function isJsonObject(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    console.log("bad JSON string" + str);
    return false;
  }
  console.log("good JSON string" + str); 
  return true;
}


// Simple in-memory store for now
var quoteList = [];


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

/*
function getHTML(url, next) {
  var unirest = require('unirest');
  unirest.get(url)
    .end(function(response) {
      var body = response.body;
      if (next) next(body);
    });
}

getHTML('http://purple.com/', function(html) {
  console.log(html);
});
*/
