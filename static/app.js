var App = function () {

  var SORT_TYPE = {
    distance: 1
  };

  var MAP_WIDTH = 220;
  var MAP_HEIGHT = 100;
  var MAP_ZOOM = 14;

  /**
   * Convert from degrees to radians
   */
  function toRad(angle) {
    return angle * Math.PI / 180;
  }

  /**
   * Get the url for google directions from start to end
   */
  function urlForDirections(start, end) {
    var template = "http://maps.google.com/?saddr={start_lat},{start_lng}&daddr={end_lat},{end_lng}";
    return template.replace('{start_lat}', start.latitude)
      .replace('{start_lng}', start.longitude)
      .replace('{end_lat}', end.latitude)
      .replace('{end_lng}', end.longitude)
  }

  /**
   * Get url for static map for lat/long
   */
  function urlForMap(latitude, longitude) {
    var latLng = [latitude, longitude].join(',');
    var template = 'http://maps.googleapis.com/maps/api/staticmap?center={latLng}' +
      '&zoom={zoom}&size={width}x{height}&sensor=false&markers=color:red%7C{latLng}';
    // yes, I know it's inefficient ;-)
    return template.
      replace(/{latLng}/g, latLng).
      replace(/{width}/g, MAP_WIDTH).
      replace(/{height}/g, MAP_HEIGHT).
      replace(/{zoom}/g, MAP_ZOOM);
  }

  /**
   * http://www.movable-type.co.uk/scripts/latlong.html
   */
  function getDistance(here, there) {
    var R = 6371; // km
    var dLat = toRad(there.latitude - here.latitude);
    var dLon = toRad(there.longitude - here.longitude);
    var lat1 = toRad(here.latitude);
    var lat2 = toRad(there.latitude);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d * 10) / 10; // 1 decimal place
  }

  var auth = {
    consumerKey: "4ZUyLz2rIvU5cIzCHnnkbA",
    consumerSecret: "sWo_pi77q5WBYGP5k8pP4Cwgxgw",
    accessToken: "MEeF_C_-hc9xzejfJhY7gVE55vFEV61Q",
    // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
    // You wouldn't actually want to expose your access token secret like this in a real application.
    accessTokenSecret: "XBs_ZfB8VDvJZqL1t8pju7gpWvk",
    serviceProvider: {
      signatureMethod: "HMAC-SHA1"
    }
  };

  /**
   * Get nearby places from Yelp and update the DOM
   */
  function getAndRenderYelpPlaces(latitude, longitude, accuracy) {
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
        ['sort', SORT_TYPE.distance],
        ['ll', [latitude, longitude, accuracy].join(',')]
      ]
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
      consumerSecret: auth.consumerSecret,
      tokenSecret: auth.accessTokenSecret
    });

    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

    // TODO: using jsonp so can't attach an error handler. Proxy instead of using jsonp.
    $.jsonp({
      url: message.action,
      data: parameterMap,
      cache: true,
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      error: function(xhr, exception) {
        alert('We have hit the daily limit for hitting Yelp\'s API. We are looking into getting out limit increased');
      },
      success: function (data, textStats, XMLHttpRequest) {
        var start = {latitude: latitude, longitude: longitude};

        $(".spinner, .spacer").remove();

        _.each(data.businesses, function (business) {
          var prettyCategories = _.map(business.categories,
            function (category) {
              return category[0];
            }).join(', ');

          //var neighbourhood = business.location.neighborhoods && business.location.neighborhoods[0];
          var address = business.location.address && business.location.address[0];
          //var prettyLocation = _.compact([neighbourhood, address]).join(' - ');

          var distance = getDistance(start, business.location.coordinate);

          var templateData = _.extend({}, business, {
            pretty_categories: prettyCategories,
            pretty_location: address,
            distance: distance,
            directions_url: urlForDirections(start, business.location.coordinate),
            map_url: urlForMap(business.location.coordinate.latitude, business.location.coordinate.longitude)
          });

          $(".businesses").append(ich.tpl_business(templateData))
        });
      }
    });
  }

  return {
    init: function () {
      navigator.geolocation.getCurrentPosition(function (location) {
        getAndRenderYelpPlaces(location.coords.latitude, location.coords.longitude, location.coords.accuracy);
      }, function () {
        // TODO: show a nicer error message/page
        alert('could not get current location');
      });
    }
  }

};

if (!navigator.geolocation && !navigator.geolocation.getCurrentPosition) {
  // TODO: ugly, show a nicer error page with instructions
  alert('Error: this app can only be used in a browser that supports geolocation.');
}
else if (!document.addEventListener) {
  // TODO: not an inherent problem. Should path ICanHaz to work with IE < 9
  alert('You are using an old version of Internet Explorer. Please use a modern browser.');
}
else {
  // hide the url bar
  window.scrollTo(0, 1);

  // load scripts in parallel then start the app
  $LAB
    .script('jquery.min.js')
    .script('oauth.js')
    .script('sha1.js')
    .script('ICanHaz.js')
    .script('underscore.js')
    .wait()
    .script('jquery.jsonp-2.3.0.min.js')
    .wait(function () {
      $(function() { // wait til dom loaded so ICanHaz can do its thing
        new App().init();
      });
    });
}
