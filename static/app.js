
var SORT_TYPE = {
  distance: 1
};

var mapWidth = 200;
var mapHeight = 100;
var mapZoom = 14;

function toRad(angle) {
  return angle * Math.PI / 180;
}

function urlForDirections(start, end) {
  var template = "http://maps.google.com/?saddr={start_lat},{start_lng}&daddr={end_lat},{end_lng}";
  return template.replace('{start_lat}', start.latitude)
    .replace('{start_lng}', start.longitude)
    .replace('{end_lat}', end.latitude)
    .replace('{end_lng}', end.longitude)
}

function urlForMap(latitude, longitude) {
  var latLng = [latitude, longitude].join(',');
  var template = 'http://maps.googleapis.com/maps/api/staticmap?center={latLng}' +
    '&zoom={zoom}&size={width}x{height}&sensor=false&markers=color:red%7C{latLng}';
  // yes, I know it's inefficient ;-)
  return template.
    replace(/{latLng}/g, latLng).
    replace(/{width}/g, mapWidth).
    replace(/{height}/g, mapHeight).
    replace(/{zoom}/g, mapZoom);
}

/**
 * http://www.movable-type.co.uk/scripts/latlong.html
 * @param here
 * @param there
 * @return {Number}
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
  accessToken: "cFcqGdyz8zpfO3NLTDJwK3vhT2eKLm_7",
  // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
  // You wouldn't actually want to expose your access token secret like this in a real application.
  accessTokenSecret: "3qVfLwOMxyBOtRaI4e5gPGcpHf4",
  serviceProvider: {
    signatureMethod: "HMAC-SHA1"
  }
};

// TODO: rename
function hitApi(latitude, longitude, accuracy) {
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
      //['location', 'San+Francisco'],
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

  $.ajax({
    'url': message.action,
    'data': parameterMap,
    'cache': true,
    'dataType': 'jsonp',
    'jsonpCallback': 'cb',
    'success': function (data, textStats, XMLHttpRequest) {
      console.log('data', data);

      var start = {latitude: latitude, longitude: longitude};

      $(".businesses").html('');

      _.each(data.businesses, function (business) {
        var prettyCategories = _.map(business.categories,
          function (category) {
            return category[0];
          }).join(', ');

        var distance = getDistance(start, business.location.coordinate);

        var templateData = _.extend({}, business, {
          pretty_categories: prettyCategories,
          distance: distance,
          directions_url: urlForDirections(start, business.location.coordinate),
          map_url: urlForMap(business.location.coordinate.latitude, business.location.coordinate.longitude)
        });

        $(".businesses").append(ich.tpl_business(templateData))
      });
    }
  });
}

navigator.geolocation.getCurrentPosition(function (location) {
  hitApi(location.coords.latitude, location.coords.longitude, location.coords.accuracy);
}, function () {
  // TODO: show something to the user
  console.error('could not get current location');
});

//$('body').delegate('.business', 'click', function() {
//  $(this).find('.extended-info').toggle();
//});