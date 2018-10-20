// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  // This is invoked to refresh previously received
  // quotations, if any 
  $.get('/responses', function funcInvokedAfterGET(responses) {
    console.log("**** Inside get() call ");
    if ($('ul#responses').children().length == 0){
      displayAllQuotes(responses);
    }
  });


  // function that is invoked when the "Get Quote" button 
  // is pressed
  $('form').submit(function(event) {
    console.log ("Inside submit");
    event.preventDefault();
    
    // We need to figure out two arguments to make 
    // the POST call 
    // Step 1 - prepare the random number to send as query 
    // Step 2 - get the Quote from the forismatic API
    
    var fullRoute = "/generate?"; 
    //var params = {"uNumber": "457653"};
    var randomSeed = $("#uNumber").val() !== "" ? $("#uNumber").val() : $("#uNumber").attr("placeholder");
    console.log("**** randomSeed ", randomSeed);
    var args = {"rnumber": randomSeed};
    console.log("***** Params: ", args);
    fullRoute += $.param(args);
    
    // STEP 2 - prepare the POST request to the server
    $.post(fullRoute,function funcInvokedAfterPOST(postInfo){
      // this is the callback function which gets
      // called after the server is done serving the request
      // Before we can "refresh" to get the results,
      // we invoke a setTimeOut with a callback function
      console.log ("Back from Server call: ", postInfo);
      window.setTimeout(function afterTimeOut(){
        $.get("/responses", function (responses) {
          // this is very expensive...
          // why not pick the last added quote and display that alone? 
          $("ul#responses").empty();
          displayAllQuotes(responses);
        });
        $("#quoteButton").focus();
      },1500);  // some arbitrary value - may not be sufficient
      console.log ("*** Reaching end of POST call");
    }) // end of post call
    .fail(response => reportError(response));
  
    console.log ("*** Reaching end of Submit call");
  }); // end of submit call

});

function reportError(response) { 
    // https://stackoverflow.com/a/11820453/307454
    // console.log(response);
    console.log("***Server returns error", response.status, response.responseText);
}

function clearTheBox () { 
  console.log ("inside clear the box!");
  $("ul#responses").empty(); 
  // but does not clear the actual quote list...
  // So, it is not a deep clean! 
}


function displayAllQuotes (quotes) { 
  console.log(quotes);
  quotes.forEach(function(quote) {
    //$('<li></li>').text(response).appendTo('ul#responses');
    addQuoteToDisplay(quote);
  });
  // $("#responses").html(data);
}

function addQuoteToDisplay (response) {
    // console.log (response.quoteText);
  //if (response.quoteText !== undefined) {            
    var tweeter = '<div id=\"share\">\
      <a target=\"_blank\" id=\"t\" href=\"http://twitter.com/home?status=';
    tweeter = tweeter + response.quoteText; 
    tweeter = tweeter + ' @lifebalance" title=\"Write\"></a></div>';
    var responseHTML = tweeter + '\
      <blockquote class="quote">\
        <strong><cite>\
          <a target=\"_blank\" id = "quote" href=\"'+response.quoteLink+'\">\
            '+response.quoteText+'</a>\
        </cite></strong><br/>\
        <small>\
          <a target="_blank" href="http://en.wikipedia.org/wiki/'+response.quoteAuthor+'\">\
            '+response.quoteAuthor+'</a>\
        </small>\
      </blockquote>';

    //console.log (responseHTML);
    $('<ul></ul>').html(responseHTML).appendTo('ul#responses');
  //}
}

