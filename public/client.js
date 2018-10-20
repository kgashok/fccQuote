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
      responses.forEach(function(response) {
        //$('<li></li>').text(response).appendTo('ul#responses');
        addQuoteToDisplay(response);
      });      
    }
    /*
     * this is not required for now...
    else {
       $('<li></li>').text(responses[0]).appendTo('ul#responses');
    }
    */
  });


  // function that is invoked when the "Get Quote" button 
  // is pressed
  $('form').submit(function(event) {
    console.log ("Inside submit");
    event.preventDefault();
    
    // We need to figure out two arguments to make 
    // the POST call 
    // Step 1 - prepare the knowledge URL to send query 
    // Step 2 - get the Question for which we want to find answers
    var fullRoute = "/generate?"; 
    //var params = {"uNumber": "457653"};
    var randomSeed = $("#uNumber").val() !== "" ? $("#uNumber").val() : $("#uNumber").attr("placeholder");
    console.log("**** randomSeed ", randomSeed);
    var args = {"rnumber": randomSeed};
    console.log("***** Params: ", args);
    fullRoute += $.param(args);
    // prepare the POST request to the server
    $.post(fullRoute,function funcInvokedAfterPOST(postInfo){
      // this is the callback function which gets
      // called after the server is done serving the request
      // Before we can "refresh" to get the results,
      // we invoke a setTimeOut with a callback function
      console.log ("Back from Server call: ", postInfo);
      window.setTimeout(function afterTimeOut(){
        // reloads and displays answer + previous answers
        // there must be a more efficient way of doing this
        // location = location;
        //location.reload(true);
        $.get("/responses", function (responses) {
          // this is very expensive...
          // why not pick the last added quote and display that alone? 
          //
          console.log(responses);
          $("ul#responses").empty();
          responses.forEach(function(response) {
            addQuoteToDisplay(response);
          });
          // $("#responses").html(data);
        });
        $("#quoteButton").focus();
      },1500);  // some arbitrary value - may not be sufficient
      console.log ("*** Reaching end of POST call");
    }) // end of post call
    .fail(function(response){
      // https://stackoverflow.com/a/11820453/307454
      console.log(response);
      console.log("***Server returns error", response.status, response.responseText);
    });
    
    console.log ("*** Reaching end of Submit call");
  }); // end of submit call

});

function clearTheBox () { 
  console.log ("inside clear the box!");
  $("ul#responses").empty(); 
  // but does not clear the actual quote list...
  // So, it is not a deep clean! 
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

