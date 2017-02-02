/* After a lot of back and forth, this has been achieved.  */ 


window.fbAsyncInit = function() {
  FB.init({
    appId      : '1129771820404590',
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();

  FB.getLoginStatus(function(response){
    // fbApiInit = true;
    if (response.status === 'connected') {
      console.log('Logged in.');
    }
    else {
      FB.login({scope: 'user_friends,user_likes,email'});
    }
    
    FB.api(
      '/me',  // 10152759836492400
      'GET',
      {"fields":"id,name,email,friends,likes"},
      function(response) {
        // Insert your code here
        if (response && !response.error) {
          console.log ("success");
          var res = JSON.stringify(response);
          console.log (res);
          $('<h2></h2>').text(response.name).appendTo('ul#whoami');
          $('<h3></h3>').text(response.email).appendTo('ul#whoami');
          var likes = response.likes.data;
          for (var i=0; i < likes.length; i++)
            $('<li></li>').text(JSON.stringify(likes[i])).appendTo('ul#dreams');
        }
        else {
          console.log ("failure"); 
          console.log (response.error);
        }
      }
    );
  });
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));
 

