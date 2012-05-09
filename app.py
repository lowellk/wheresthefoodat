import os, flask
from werkzeug import SharedDataMiddleware
from flask import Flask, jsonify

app = Flask(__name__)

# http://stackoverflow.com/questions/4239825/static-files-in-flask-robot-txt-sitemap-xml-mod-wsgi
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/': os.path.join(os.path.dirname(__file__), 'static')
})

# NOTE: routes should have trailing slashes

@app.route('/')
def hello():
    return flask.redirect('index.html')


@app.route('/yelp-keys')
def yelp_keys():
    return jsonify(app.config['YELP_KEYS'])

class ProductionConfig(object):
    DEBUG = False
    # key from main yelp account
    YELP_KEYS = {
        'consumerKey': '4ZUyLz2rIvU5cIzCHnnkbA',
        'consumerSecret': 'sWo_pi77q5WBYGP5k8pP4Cwgxgw',
        'accessToken': 'MEeF_C_-hc9xzejfJhY7gVE55vFEV61Q',
        # This example is a proof of concept, for how to use the Yelp v2 API with javascript.
        # You wouldn't actually want to expose your access token secret like this in a real application.
        'accessTokenSecret': 'XBs_ZfB8VDvJZqL1t8pju7gpWvk'
    }

class DevelopmentConfig(object):
    DEBUG = True
    # key from yelp account with lowellk+test@gmail.com
    YELP_KEYS = {
        'consumerKey': 'V8ZL9dmLpBcirFe4WwGoWQ',
        'consumerSecret': 'bcz7q17KzeWRscTw7x0AInvFHhg',
        'accessToken': 'EDZPMzRb_hbgCUPRlbREZASgCqZgpiVK',
        'accessTokenSecret': 'rxOjyQyAjC0bJPFyxwG0RecLEGU'
    }

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', False)
    app.config.from_object(DevelopmentConfig)
    app.run(host='0.0.0.0', port=port)
