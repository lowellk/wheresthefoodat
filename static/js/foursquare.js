/**
 * @constructor
 */
function Foursquare() {
  this.categoryId = '4bf58dd8d48988d1cb941735'; // category where "name" is "Food Truck"
}


Foursquare.KEY_FOURSQUARE_TOKEN = 'foursquare_access_token';


Foursquare.KEY_USE_FOURSQUARE = 'use_foursquare';


Foursquare.prototype.setClientId = function (clientId) {
  this.clientId = clientId;
};


Foursquare.prototype.doAuth = function () {
  var onHaveClientId = _.bind(function () {
    window.location.href = 'https://foursquare.com/oauth2/authenticate?client_id=' + this.clientId
      + '&response_type=token&redirect_uri=' + window.location.href;
  }, this);

  if (this.clientId) {
    onHaveClientId();
    return;
  }
  var that = this;
  $.getJSON('/foursquare-keys', function (auth) {
    that.setClientId(auth.clientId);
    onHaveClientId();
  });
};


Foursquare.prototype.isAuthedWithFoursquare = function () {
  return !!$.jStorage.get(Foursquare.KEY_FOURSQUARE_TOKEN);
};


Foursquare.prototype.getFoursquareToken = function () {
  return $.jStorage.get(Foursquare.KEY_FOURSQUARE_TOKEN);
};


Foursquare.prototype.setFoursquareToken = function (value) {
  $.jStorage.set(Foursquare.KEY_FOURSQUARE_TOKEN, value);
};


Foursquare.prototype.getUseFoursquare = function () {
  return $.jStorage.get(Foursquare.KEY_USE_FOURSQUARE, false);
};


Foursquare.prototype.setUseFoursquare = function (b) {
  return $.jStorage.set(Foursquare.KEY_USE_FOURSQUARE, b);
};


Foursquare.prototype.getPlaces = function (currentCoords, callback) {
  var latLng = currentCoords.latitude + ',' + currentCoords.longitude;
  var urlTemplate = 'https://api.foursquare.com/v2/venues/search?categoryId={categoryId}&ll={latLng}&oauth_token={oauthToken}&v=20120509';
  var url = urlTemplate
    .replace('{oauthToken}', this.getFoursquareToken())
    .replace('{latLng}', latLng)
    .replace('{categoryId}', this.categoryId);

  var categoryFilter = _.bind(this.hadCorrectCategory, this);

  // TODO: error handling
  $.getJSON(url, {}, function (data) {
    var venues = _.filter(data.response.venues, categoryFilter);
    callback(venues, currentCoords);
  });
};


Foursquare.prototype.hadCorrectCategory = function (venue) {
  var categoryIds = _(venue.categories).pluck('id');
  return _(categoryIds).include(this.categoryId);
};
