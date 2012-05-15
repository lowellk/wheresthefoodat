/**
 * @constructor
 */
function IndexPage() {
  this.yelp = new Yelp;
  this.foursquare = new Foursquare;
  this.initLogger();
}


IndexPage.prototype.log = function () {
  // do nothing unless there is a console.log function
};


/**
 * setup a logger if console.log is defined
 */
IndexPage.prototype.initLogger = function () {
  if (typeof console != 'undefined' && console.log) {
    this.log = function () {
      console.log.apply(console, arguments);
    };
  }
};


/**
 * start the app
 */
IndexPage.prototype.init = function () {
  this.log('init');

  if (/^www/.test(window.location.hostname)) {
    // foursquare redirect tied to exact url, so redirect
    window.location.href = window.location.href.replace('www.', '');
    return; // not strictly needed
  }

  if (!navigator.geolocation && !navigator.geolocation.getCurrentPosition) {
    alert('Error: this app can only be used in a browser that supports geolocation.');
    return;
  }

  if (!document.addEventListener) {
    // XXX: not an inherent problem. Can patch ICanHaz.js to work with IE < 9
    alert('You are using an old version of Internet Explorer. Please use a modern browser.');
    return;
  }

  this.processHash();

  this.setupUI();

  navigator.geolocation.getCurrentPosition(
    _.bind(this.onGeolocationSuccess, this),
    _.bind(this.onGeolocationError, this));
};


IndexPage.prototype.maybeHideUrlBar = function () {
  if (true) {
    // TODO: doesn't feel like it's working well right now.
    return;
  }
  if (this._hidUrlBar) {
    return;
  }
  window.scrollTo(0, 0);
  this._hidUrlBar = true;
};


IndexPage.prototype.onGeolocationSuccess = function (location) {
  if (this.foursquare.getUseFoursquare()) {
    this.foursquare.getPlaces(location.coords, _.bind(this.onSuccessfullyGetFoursquareVenues, this));
  }
  if (this.yelp.getUseYelp()) {
    $.getJSON('/yelp-keys', _.bind(function (auth) {
      this.yelp.getPlaces(auth, location.coords, _.bind(this.onSuccessfullyGetYelpBusinesses, this));
    }, this));
  }
};


IndexPage.prototype.onGeolocationError = function () {
  // coords come from http://geocoder.ca/?locate=market+st+and+van+ness+st%2C+san+francisco%2C+ca%2C+usa&geoit=GeoCode+it%21
  this.onGeolocationSuccess({
    coords: {
      latitude: 37.775147,
      longitude: -122.419256
    }
  });

  alert('This app works much better when you allow it to use your current location. ' +
    'Until then, you will be shown places near the center of San Francisco, instead ' +
    'of places near you.');
};


/**
 * callback for successful ajax request for yelp businesses
 */
IndexPage.prototype.onSuccessfullyGetYelpBusinesses = function (businesses, currentLocation) {
  this.log('got yelp businesses:', businesses);

  $(".yelp-businesses .spinner").remove();

  _.each(businesses, function (business) {
    var place = Place.forYelpBusiness(business);
    var templateData = place.getTemplateData(currentLocation);
    $(".yelp-businesses .businesses").append(ich.tpl_business(templateData))
  });

  this.maybeHideUrlBar();
};


IndexPage.prototype.parseHash = function () {
  this.log('parsing hash:', window.location.hash);

  var matches = /(\w+)=(\w+)/.exec(window.location.hash.substring(1));
  if (!matches) {
    return null;
  }
  var ret = {};
  ret[matches[1]] = matches[2];
  return ret;
};


IndexPage.prototype.processHash = function () {
  this.log('processing hash');

  var parsedHash = this.parseHash();
  if (parsedHash) {
    // XXX: might want better messages based on https://developer.foursquare.com/overview/responses
    if ('error' in parsedHash) {
      // access_denied means the user meant to deny access
      if (parsedHash.error !== 'access_denied') {
        alert('There was an error: ' + parsedHash['error']);
      }
    }
    else if ('access_token' in parsedHash) {
      var accessToken = parsedHash['access_token'];
      this.foursquare.setFoursquareToken(accessToken);
      this.foursquare.setUseFoursquare(true);
    }
    else {
      console.error('Unknown hash:', parsedHash)
    }
    // chop off the hash
    window.location.href = window.location.pathname;
  }
};


IndexPage.prototype.onSuccessfullyGetFoursquareVenues = function (venues, currentCoords) {
  this.log('got foursquare venues:', venues);

  $(".foursquare-businesses .spinner").remove();

  _.each(venues, function (venue) {
    var place = Place.forFoursquareVenue(venue);
    var templateData = place.getTemplateData(currentCoords);
    $(".foursquare-businesses .businesses").append(ich.tpl_business(templateData))
  });

  this.maybeHideUrlBar();
};


// TODO: more elegant approach
IndexPage.prototype.setupUI = function () {
  this.log('setting up UI');

  var that = this;

  var useYelp = this.yelp.getUseYelp();
  if (useYelp) {
    $('.yelp-businesses').show();
  }
  $('.js-yelp-checkbox').attr('checked', useYelp);
  $('.js-yelp-checkbox').click(function () {
    var isChecked = $(this).is(':checked');
    that.yelp.setUseYelp(isChecked);
    if (isChecked) {
      window.location.reload();
    }
  });

  var useFoursquare = this.foursquare.getUseFoursquare();
  if (useFoursquare) {
    $('.foursquare-businesses').show();
  }
  $('.js-foursquare-checkbox').attr('checked', useFoursquare);
  $('.js-foursquare-checkbox').click(function () {
    var isChecked = $(this).is(':checked');
    if (!that.foursquare.isAuthedWithFoursquare() && isChecked) {
      if (window.confirm('You must login with your Foursquare account to use their data. OK?')) {
        that.foursquare.doAuth();
      }
      return false;
    }
    that.foursquare.setUseFoursquare(isChecked);
    if (isChecked) {
      window.location.reload();
    }
  });

  if (!useYelp && !useFoursquare) {
    $('.datasources').yellowFade();
  }
};
