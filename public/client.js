// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

function clearTheBox () { 
  console.log ("inside clear the box!");
  $("ul#responses").empty(); 
}

$(function() {

  // This is invoked to refresh previously asked 
  // questions, if any? 
  $.get('/responses', function funcInvokedAfterGET(responses) {
    // for e.g. https://roomy-plate.gomix.me/responses
    // refresh and update the DOM with 
    // previous Q and As from the same session
    // along with any valid ones post the POST request
    if ($('ul#responses').is(':empty') ){
        
      responses.forEach(function(response) {
        $('<li></li>').text(response).appendTo('ul#responses');
      });
    }
    else {
       $('<li></li>').text(responses[0]).appendTo('ul#responses');
    }
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
    var fullRoute = "/responses?"; 

    // prepare the POST request to the server
    $.post(fullRoute, function funcInvokedAfterPOST(postInfo) {
      // this is the callback function which gets
      // called after the server is done serving the request
      // Before we can "refresh" to get the results,
      // we invoke a setTimeOut with a callback function
      console.log ("Back from Server call: " + postInfo);
      if (postInfo !== "undefined") {

        window.setTimeout(function afterTimeOut(){
          // reloads and displays answer + previous answers
          // there must be a more efficient way of doing this
          // location = location;
          //location.reload(true);
          $.get("/responses", function (responses) {
            $("ul#responses").empty();
            responses.forEach(function(response) {
              //console.log (response.quoteText);
              //console.log (response); 
              /*$('<li></li>').text(response.quoteText 
                                  + "-" 
                                  + response.quoteAuthor).appendTo('ul#responses');
              */
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

            });
            // $("#responses").html(data);  
          });
          $("#quoteButton").focus();
        },1500);  // some arbitrary value - may not be sufficient
        console.log ("*** Reaching end of POST call");    
      }
    }); // end of post call
    console.log ("*** Reaching end of Submit call");

  }); // end of submit call

});
