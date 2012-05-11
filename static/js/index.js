/**
 * @constructor
 */
function IndexPage() {
}


/**
 * Get nearby places from Yelp and update the DOM
 */
IndexPage.prototype.getAndRenderYelpPlaces = function (auth, currentLocation) {
  var message = {
    'action': 'http://api.yelp.com/v2/search',
    'method': 'GET',
    'parameters': [
      ['term', 'food'],
      ['callback', 'cb'],
      ['oauth_consumer_key', auth.consumerKey],
      ['oauth_consumer_secret', auth.consumerSecret],
      ['oauth_token', auth.accessToken],
      ['oauth_signature_method', 'HMAC-SHA1'],
      ['category_filter', 'streetvendors,foodstands'],
      ['sort', 1],
      // sort by distance
      ['ll', [currentLocation.latitude, currentLocation.longitude].join(',')]
    ]
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, {
    consumerSecret: auth.consumerSecret,
    tokenSecret: auth.accessTokenSecret
  });

  var parameterMap = OAuth.getParameterMap(message.parameters);
  parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

  var that = this;

  // TODO: using jsonp so can't attach an error handler. Proxy instead of using jsonp.
  $.ajax({
    url: message.action,
    data: parameterMap,
    cache: true,
    dataType: 'jsonp',
    jsonpCallback: 'cb',
    success: function (data) {
      that.onSuccessfullyGetYelpBusinesses(data.businesses, currentLocation);
    }
  });
};


/**
 * callback for successful ajax request for yelp businesses
 */
IndexPage.prototype.onSuccessfullyGetYelpBusinesses = function (businesses, currentLocation) {
  $(".spinner, .spacer").remove();

  _.each(businesses, function (business) {
    var place = Place.forYelpBusiness(business);
    var templateData = place.getTemplateData(currentLocation);
    $(".businesses").append(ich.tpl_business(templateData))
  });
};


/**
 * start the app
 */
IndexPage.prototype.init = function () {
  if (!navigator.geolocation && !navigator.geolocation.getCurrentPosition) {
    // TODO: ugly, show a nicer error page with instructions
    alert('Error: this app can only be used in a browser that supports geolocation.');
    return;
  }

  if (!document.addEventListener) {
    // TODO: not an inherent problem. Can patch ICanHaz.js to work with IE < 9
    alert('You are using an old version of Internet Explorer. Please use a modern browser.');
    return;
  }

  var that = this;

  navigator.geolocation.getCurrentPosition(function (location) {
    // TODO: serialized ajax, not optimal performance
    $.getJSON('/yelp-keys', function (auth) {
      that.getAndRenderYelpPlaces(auth, location.coords);
    });
  }, function () {
    // TODO: show a nicer error message/page
    alert('could not get current location');
  });
};

// TODO: fix this, do we need to wrap it in a setTimeout?
// hide the url bar
window.scrollTo(0, 1);

// load scripts then start the app
$LAB
  .script('js/external/jquery.min.js')
  .script('js/external/oauth.js')
  .script('js/external/sha1.js')
  .script('js/external/ICanHaz.js')
  .script('js/external/underscore.js')
  .script('js/place.js')
  .wait(function () {
    $(function () { // wait til dom loaded so ICanHaz can do its thing
      new IndexPage().init();
    });
  });
