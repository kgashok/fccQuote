# Table of Contents

[TOC]


# Source Files


## index.html  
```html 
<!-- This is a static file -->
<!-- served from your routes in server.js -->

<!-- You might want to try something fancier: -->
<!-- html/nunjucks docs: http://mozilla.github.io/nunjucks/ -->
<!-- jade: http://jade-lang.com/ -->
<!-- haml: http://haml.info/tutorial.html -->
<!-- hbs(handlebars): http://handlebarsjs.com/expressions.html -->

<!DOCTYPE html>
<html>
  <head>
    <title> CSE_Knowledge Bot!</title>
    <meta name="description" content="A cool thing made with HyperDev">
    <link id="favicon" rel="icon" href="http://bit.ly/geniusIcon" type="image/x-icon">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <header>
      <h1>
        Questions, questions galore. 
      </h1>
      
    </header>

    <fb:login-button scope="public_profile,user_friends" autologoutlink="true" onlogin="OnRequestPermission();">  
    </fb:login-button>
    
    <div id="fb-root"></div>

    <main>
      
      <section class="whoami">
        <ul id="whoami">
        </ul>
      </section>
      <p class="bold">Oh, hello there!</p>
      <div>
        <il>1. Choose a knowledge base (default is 'cse') between 'cse, 'ds' (data structures) or 'cpp' (C++).</il><br>
        <il>2. Enter your question in the dialog below and press <b>[ENTER]</b></il><br>
        <il>3. Wait for 1-2 seconds. If the answer does not appear, press Ctrl-R to refresh! </il><br>
      </div>
      <form>
        <label> Knowledge base</label>
        <input id="kid"   type="text" maxlength="100" placeholder="cse">
        <label> Question</label>
        <input id="query" type="text" maxlength="100" placeholder="Queries!">
        <button type="submit">Get Answer!</button>
      </form>
      <p>
          <a href="https://github.com/kgashok/shiny-waffle/issues/new" target="_">Want to give App feedback? </a>
          or is it an <a href="https://github.com/kgashok/shiny-waffle/issues/8" target="_">incorrect response?</a>
          or <a href="https://saythanks.io/to/kgashok">
              <button class="button"> Say Thanks! </button>
            </a>
      </p>
      <div class="three columns">
      </div>
      <section class="responses">
        <ul id="responses">
        </ul>
      </section>
    </main>

    <div
      class="fb-like"
      data-share="true"
      data-width="450"
      data-show-faces="true">
    </div>

    <footer>
      <a href="https://hyperdev.com">
        Remix this in HyperDev
      </a>
    </footer>

    <!-- Your web-app is https, so your scripts need to be too -->
    <script src="https://code.jquery.com/jquery-2.2.1.min.js"
            integrity="sha256-gvQgAFzTH6trSrAWoH1iPo9Xc96QxSZ3feW6kem+O00="
            crossorigin="anonymous"></script>
    <script src="/client.js"></script>
    <script src="/fbg.js"></script>

  </body>
</html>

```

## client.js 
```javascript 
// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {

  // This is invoked to refresh previously asked 
  // questions, if any? 
  $.get('/responses', function funcInvokedAfterGET(responses) {
    // for e.g. https://roomy-plate.gomix.me/responses
    // refresh and update the DOM with 
    // previous Q and As from the same session
    // along with any valid ones post the POST request
    responses.forEach(function(response) {
      $('<li></li>').text(response).appendTo('ul#responses');
    });
  });

  // This is invoked when the question has been entered 
  // and the "Get Answer!" button is clicked
  $('form').submit(function(event) {
    console.log ("Inside submit");
    event.preventDefault();
    
    // We need to figure out two arguments to make 
    // the POST call 
    // Step 1 - prepare the knowledge URL to send query 
    var kid = $("#kid").val();
    // Step 2 - get the Question for which we want to find answers
    var question = $("#query").val();
    if (question.length === 0)
      return;
    var args = {"question": question, "kid": kid};
    var fullRoute = "/responses?" + $.param(args); 
    // console.log (fullRoute);
    // for e.g.
    //   https://roomy-plate.gomix.me/response?questions=algorithm&kid=cse
    
    // prepare the POST request to the server
    $.post(fullRoute, function funcInvokedAfterPOST() {
      // this is the callback function which gets
      // called after the server is done serving the request
      // Before we can "refresh" to get the results,
      // we invoke a setTimeOut with a callback function
      window.setTimeout(function afterTimeOut(){
        // reloads and displays answer + previous answers
        // there must be a more efficient way of doing this
        location = location;
        //location.reload(true);
        //$('input').val('');
        $("#query").val('');  // clear out the query text dialog
        $("#query").focus();
      },1500);  // some arbitrary value - may not be sufficient
      
    }); // end of post call
  }); // end of submit call

});

```
## server.js 
```javascript 

// server.js
// where your node app starts

var rest = require('unirest');
/*require(['unirest'], function (unirest) {
    //foo is now loaded.
});*/

/*
 * STEP 1 : Setup the URL to point at the Microsoft Q&A service
 * STEP 2 : Build the query 
 * STEP 3 : Make the Unirest POST call
 */
var lookup = {
  "cse": "8c59a93f-1622-4ce3-b848-dcc56f10f2b0",
  "ds" : "b693c8be-313c-434d-b3a7-dad2d4656039",
  "cpp": "ed3f0ded-b71e-43ff-93c6-a34454702b64"
}

function getAnswer (query, funcToInvokeAfterUnirestPOST) {
  if (query.kid === "")
    query.kid = "cse"; 
  
  // STEP 1 
  var kbase = lookup[query.kid.toLowerCase()];
  var qnamakerUriBase = "https://westus.api.cognitive.microsoft.com/qnamaker/v1.0";
  var knowledgebaseId = kbase;
  var builder = qnamakerUriBase + "/knowledgebases/" + knowledgebaseId + "/generateAnswer";
  
  var qnamakerSubscriptionKey = "a6fbd18b9b2e45b59f2ce4f73a56e1e4";
  var headers = {
      "ocp-apim-subscription-key": qnamakerSubscriptionKey,
      "content-type": "application/json",
      "cache-control": "no-cache",
  };
  
  // STEP 2
  //var payload = "{\"question\":\"Why bother with hashing?\"}";
  //var payload = {"question": "What is hashing?"};
  var payload = {"question": query.question};

  // STEP 3
  rest.post(builder)
    .headers(headers)
    .send(payload)
    .end(function funcToInvokeAfterQandA (responseFromQandA) {  
      if (funcToInvokeAfterUnirestPOST)  // Was a callback function specified? 
        funcToInvokeAfterUnirestPOST(responseFromQandA);
      else  // otherwise send the response to the console 
        console.log(responseFromQandA.body);
    });
}


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
  response.send(respondList);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/responses", function (request, response) {
  //dreams.push(request.query.dream);
  console.log(" POST:::" + request.query.question + " // " + request.query.kid); 
  
  getAnswer(request.query, function funcToInvokeAfterUnirestPOST(resp) {
    console.log(resp.request.path, resp.request.body); 
    console.log(resp.body.answer);
    console.log("confidence: " + resp.body.score);
    var responseQA = request.query.question + ":("+ resp.body.score +"%) " 
      + resp.body.answer;
    respondList.unshift(responseQA);
    console.log(respondList);
  });
  //response.send(request.query.dream + ":("+ resp.body.score +")" + resp.body.answer);
  response.sendStatus(200);
});

// Simple in-memory store for now
var respondList = [
  "What is a data structure?",
  "What is a linked list?",
  "Is linked list non-linear?"
  ];


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

```