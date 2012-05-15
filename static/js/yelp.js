/**
 * @constructor
 */
function Yelp() {
}


Yelp.KEY_USE_YELP = 'use_yelp';


Yelp.prototype.getUseYelp = function () {
  return $.jStorage.get(Yelp.KEY_USE_YELP, true);
};


Yelp.prototype.setUseYelp = function (b) {
  return $.jStorage.set(Yelp.KEY_USE_YELP, b);
};


/**
 * Get nearby places
 */
Yelp.prototype.getPlaces = function (auth, coords, callback) {
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

  // TODO: using jsonp so can't attach an error handler. Proxy instead of using jsonp.
  $.ajax({
    url: message.action,
    data: parameterMap,
    cache: true,
    dataType: 'jsonp',
    jsonpCallback: 'cb',
    success: function (data) {
      callback(data.businesses, coords);
    }
  });
};


