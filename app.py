import sys
import os, flask
from werkzeug import SharedDataMiddleware
from flask import Flask, jsonify

app = Flask(__name__)

# http://stackoverflow.com/questions/4239825/static-files-in-flask-robot-txt-sitemap-xml-mod-wsgi
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/': os.path.join(os.path.dirname(__file__), 'static')
})

@app.route('/')
def hello():
    return flask.redirect('index.html')


# hack, get rid!
@app.route('/env-foobar-baz')
def env():
    return jsonify(keys=os.environ.keys())


@app.route('/yelp-keys')
def yelp_keys():
    keys = app.config['YELP_KEYS']
    return jsonify(keys)


@app.route('/foursquare-keys')
def foursquare_keys():
    keys = app.config['FOURSQUARE_KEYS']
    return jsonify(keys)


class Config(object):
    YELP_KEYS = {
        'consumerKey': os.environ['YELP_CONSUMER_KEY'],
        'consumerSecret': os.environ['YELP_CONSUMER_SECRET'],
        'accessToken': os.environ['YELP_ACCESS_TOKEN'],
        'accessTokenSecret': os.environ['YELP_ACCESS_TOKEN_SECRET']
    }
    FOURSQUARE_KEYS = {
        'clientId': os.environ['FOURSQUARE_CLIENT_ID']
    }


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


def configure():
    debug = os.environ.get('DEBUG', False)

    if debug:
        config = DevelopmentConfig
    else:
        config = ProductionConfig

    app.config.from_object(config)


# XXX: seems gross to having this sitting here like this
configure()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
