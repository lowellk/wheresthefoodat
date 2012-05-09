/**
 * @constructor
 */
function Place(latitude, longitude) {
  this.latitude = latitude;
  this.longitude = longitude;
}

Place.MAP_WIDTH = 220;

Place.MAP_HEIGHT = 100;

Place.MAP_ZOOM = 14;

/**
 * Get url for static map for lat/long
 */
Place.prototype.urlForMap = function () {
  var latLng = [this.latitude, this.longitude].join(',');
  var template = 'http://maps.googleapis.com/maps/api/staticmap?center={latLng}' +
    '&zoom={zoom}&size={width}x{height}&sensor=false&markers=color:red%7C{latLng}';
  // yes, I know it's inefficient ;-)
  return template.
    replace(/{latLng}/g, latLng).
    replace(/{width}/g, Place.MAP_WIDTH).
    replace(/{height}/g, Place.MAP_HEIGHT).
    replace(/{zoom}/g, Place.MAP_ZOOM);
};


/**
 * Get the url for google directions from current location to place
 */
Place.prototype.urlForDirections = function (start) {
  var template = "http://maps.google.com/?saddr={start_lat},{start_lng}&daddr={end_lat},{end_lng}";
  return template.replace('{start_lat}', start.latitude)
    .replace('{start_lng}', start.longitude)
    .replace('{end_lat}', this.latitude)
    .replace('{end_lng}', this.longitude)
};


/**
 * Convert from degrees to radians
 */
Place.prototype.toRad = function (angle) {
  return angle * Math.PI / 180;
};


/**
 * http://www.movable-type.co.uk/scripts/latlong.html
 */
Place.prototype.getDistance = function(here) {
  var R = 6371; // km
  var dLat = this.toRad(this.latitude - here.latitude);
  var dLon = this.toRad(this.longitude - here.longitude);
  var lat1 = this.toRad(here.latitude);
  var lat2 = this.toRad(this.latitude);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
};


/**
 * @constructor
 */
function App() {
}


/**
 * Get nearby places from Yelp and update the DOM
 */
App.prototype.getAndRenderYelpPlaces = function (auth, currentLocation) {
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
      ['ll', [currentLocation.latitude, currentLocation.longitude/*, currentLocation.accuracy*/].join(',')]
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
      that.onSuccessfullyGetYelpPlaces(data.businesses, currentLocation);
    }
  });
};


/**
 * callback for successful ajax request for yelp businesses
 */
App.prototype.onSuccessfullyGetYelpPlaces = function (businesses, currentLocation) {
  $(".spinner, .spacer").remove();

  _.each(businesses, function (business) {
    var prettyCategories = _.map(business.categories,
      function (category) {
        return category[0];
      }).join(', ');

    //var neighbourhood = business.location.neighborhoods && business.location.neighborhoods[0];
    var address = business.location.address && business.location.address[0];
    //var prettyLocation = _.compact([neighbourhood, address]).join(' - ');

    var place = new Place(business.location.coordinate.latitude, business.location.coordinate.longitude);

    // TODO: don't extend business
    var templateData = _.extend({}, business, {
      pretty_categories: prettyCategories,
      pretty_location: address,
      distance: place.getDistance(currentLocation),
      directions_url: place.urlForDirections(currentLocation),
      map_url: place.urlForMap()
    });

    $(".businesses").append(ich.tpl_business(templateData))
  });
};


/**
 * start the app
 */
App.prototype.init = function () {
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

// TODO: fix this!
// hide the url bar
window.scrollTo(0, 1);

// load scripts in parallel then start the app
$LAB
  .script('jquery.min.js')
  .script('oauth.js')
  .script('sha1.js')
  .script('ICanHaz.js')
  .script('underscore.js')
  .wait(function () {
    $(function () { // wait til dom loaded so ICanHaz can do its thing
      new App().init();
    });
  });
