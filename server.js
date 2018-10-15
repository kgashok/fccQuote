// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var rest = require('unirest');
/*require(['unirest'], function (unirest) {
    //foo is now loaded.
});*/

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
  // console.log(" POST:::" + request.query.question + " // " + request.query.kid); 

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


/*
 * STEP 1 : Setup the URL to point at the Forismatic API
 * STEP 2 : Build the query with a random number 
 * STEP 3 : Make the Unirest POST call
 */
function getAnswer (query, funcToInvokeAfterUnirestPOST) {
  
  var quoteApi = "http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=json&lang=en";
  // builder = "http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=html&lang=en";
  // STEP 2
  //var payload = "{\"question\":\"Why bother with hashing?\"}";
  //var payload = {"question": "What is hashing?"};
  //console.log("****** Query", query.question);
  //var payload = {"key": query.question, "lang": "en"};
  var payload = {"key": "457653", "lang": "en"};
  //payload = {}; 

  // STEP 3

  rest.get(quoteApi)
    .type('json')
    .send(payload)
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
