// server.js
// where your node app starts

var rest = require('unirest');
/*require(['unirest'], function (unirest) {
    //foo is now loaded.
});*/

// init project
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/responses", function (request, response) {
  response.send(quoteList);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/responses", function (request, response) {
  //dreams.push(request.query.dream);
  //console.log (response); 
  console.log(" POST:::" + request.query.question + " // " + request.query.kid); 

  getAnswer(request.query, function funcToInvokeAfterUnirestPOST(resp) {
    // console.log (resp.request); 
    console.log("PATH:: " + resp.request.path); 
    console.log("resp.body: " + resp.body);
    var responseQA = resp.body;
    quoteList.unshift(responseQA);
    console.log(quoteList);
    // response.send(request.query.dream + ":("+ resp.body.score +")" + resp.body.answer);
    //response.send(resp.request.path + " :("+ resp.body.score +")" + resp.body.answer);
    // response.send ("junk");
  
  });
  //response.sendStatus(200);
  response.send(quoteList[quoteList.length-1]);
});

var lookup = {
  "cse": "8c59a93f-1622-4ce3-b848-dcc56f10f2b0",
  "ds" : "b693c8be-313c-434d-b3a7-dad2d4656039",
  "cpp": "ed3f0ded-b71e-43ff-93c6-a34454702b64"
}

/*
 * STEP 1 : Setup the URL to point at the Microsoft Q&A service
 * STEP 2 : Build the query 
 * STEP 3 : Make the Unirest POST call
 */
function getAnswer (query, funcToInvokeAfterUnirestPOST) {
  
  var builder = "http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=json&lang=en";
  // builder = "http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=html&lang=en";
  // STEP 2
  //var payload = "{\"question\":\"Why bother with hashing?\"}";
  //var payload = {"question": "What is hashing?"};
  var payload = {"question": query.question};
  payload = {}; 

  // STEP 3
  rest.get(builder)
    .end(function funcToInvokeAfterQandA (responseFromQandA) {  
      if (funcToInvokeAfterUnirestPOST)  // Was a callback function specified? 
        funcToInvokeAfterUnirestPOST(responseFromQandA);
      else  // otherwise send the response to the console 
        console.log(responseFromQandA.body);
    });
  
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
