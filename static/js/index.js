/**
 * @constructor
 */
function IndexPage() {
  this.settingsAccess = new SettingsAccess();
}


/**
 * Get nearby places from Yelp and update the DOM
 */
IndexPage.prototype.getAndRenderYelpPlaces = function (auth, coords) {
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
      ['ll', [coords.latitude, coords.longitude].join(',')]
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
      that.onSuccessfullyGetYelpBusinesses(data.businesses, coords);
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


// TODO: make replaceAll(string, {key, value}) method
// TODO: sort by distance?
IndexPage.prototype.onSuccessfullyGetFoursquareVenues = function(venues, currentCoords, categoryId) {
  $(".spinner, .spacer").remove();

  _.each(venues, function (venue) {
    var categoryIds = _(venue.categories).pluck('id');
    if (!_(categoryIds).include(categoryId)) {
      //console.warn('ignoring due to categories:', _(venue.categories).pluck('name'));
      return;
    }
    var place = Place.forFoursquareVenue(venue);
    console.info(venue.name, venue);
    var templateData = place.getTemplateData(currentCoords);
    $(".businesses").append(ich.tpl_business(templateData))
  });
};


IndexPage.prototype.getAndRenderFoursquarePlaces = function (currentCoords) {
  var categoryId = '4bf58dd8d48988d1cb941735'; // TODO: is this stable?
  var latLng = currentCoords.latitude + ',' + currentCoords.longitude;
  var urlTemplate = 'https://api.foursquare.com/v2/venues/search?categoryId={categoryId}&ll={latLng}&oauth_token={oauthToken}&v=20120509';
  var url = urlTemplate
    .replace('{oauthToken}', this.settingsAccess.getFoursquareToken())
    .replace('{latLng}', latLng)
    .replace('{categoryId}', categoryId);
  var that = this;

  // TODO: error handling
  $.getJSON(url, {}, function (data) {
    var venues = data.response.venues;
    that.onSuccessfullyGetFoursquareVenues(venues, currentCoords, categoryId);
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
  .script('js/external/jstorage.js')
  .script('js/place.js')
  .script('js/settings-access.js')
  .wait(function () {
    $(function () { // wait til dom loaded so ICanHaz can do its thing
      var indexPage = new IndexPage();
      indexPage.init();
    });
  });
