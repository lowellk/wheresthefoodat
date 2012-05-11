//TODO: make some functions private

/**
 * @constructor
 */
function SettingsPage() {
  // TODO: externalize?
  this.foursquareClientId = 'AX52AH1M1OSZAQBVN0DBBWNDFSIT44QRHBLHWPTN1ZDPQ30R';
  this.callbackUrl = window.location.href; // this page
  this.settingsAccess = new SettingsAccess();
}


SettingsPage.prototype.authWithFoursquare = function () {
  window.location.href = 'https://foursquare.com/oauth2/authenticate?client_id=' + this.foursquareClientId
    + '&response_type=token&redirect_uri=' + this.callbackUrl;
};


SettingsPage.prototype.parseHash = function () {
  var matches = /(\w+)=(\w+)/.exec(window.location.hash.substring(1));
  if (!matches) {
    return null;
  }
  var ret = {};
  ret[matches[1]] = matches[2];
  return ret;
};


SettingsPage.prototype.init = function () {
  var parsedHash = this.parseHash();
  if (parsedHash) {
    if ('error' in parsedHash) {
      // TODO: chop off the error hash -> redirect to window.location.pathname
      alert('There was an error: ' + parsedHash['error']);
    }
    else if ('access_token' in parsedHash) {
      var accessToken = parsedHash['access_token'];
      this.setFoursquareToken(accessToken);
      this.setUseFoursquare(true);
    }
    else {
      console.error('Unknown hash:', parsedHash)
    }
  }
  this.setupUI();
};


SettingsPage.prototype.printFoursquarePlaces = function () {
  navigator.geolocation.getCurrentPosition(_.bind(this.getNearbyFoodTrucks, this));
};


// TODO: make replaceAll(string, {key, value}) method
// TODO: sort by distance
SettingsPage.prototype.getNearbyFoodTrucks = function (position) {
  var latLng = position.coords.latitude + ',' + position.coords.longitude;
  var urlTemplate = 'https://api.foursquare.com/v2/venues/search?categoryId={categoryId}&ll={latLng}&oauth_token={oauthToken}&v=20120509';
  var categoryId = '4bf58dd8d48988d1cb941735'; // TODO: is this stable?
  var url = urlTemplate
    .replace('{oauthToken}', this.settingsAccess.getFoursquareToken())
    .replace('{latLng}', latLng)
    .replace('{categoryId}', categoryId);
  // TODO: error handling
  $.getJSON(url, {}, function (data) {
    var trucks = data.response.venues;
    _.each(trucks, function (truck) {
      var categoryIds = _.pluck(truck.categories, 'id');
      if (!_.include(categoryIds, categoryId)) {
        //console.warn('ignoring due to categories:', _.pluck(truck.categories, 'name'));
        return;
      }
      console.info(truck.name, truck);
    });
  });
};

// TODO: more elegant approach
SettingsPage.prototype.setupUI = function () {
  var that = this;
  var settingsAccess = this.settingsAccess;

  $('.js-yelp-checkbox').attr('checked', settingsAccess.getUseYelp());
  $('.js-yelp-checkbox').click(function () {
    settingsAccess.setUseYelp($(this).is(':checked'));
  });

  $('.js-foursquare-checkbox').attr('checked', settingsAccess.getUseFoursquare());
  $('.js-foursquare-checkbox').click(function () {
    if (!settingsAccess.isAuthedWithFoursquare() && $(this).is(':checked')) {
      if (window.confirm('You must login with your Foursquare account to use their data. OK?')) {
        that.authWithFoursquare();
      }
      return false;
    }
    settingsAccess.setUseFoursquare($(this).is(':checked'));
  });
};

