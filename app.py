import os
from werkzeug import SharedDataMiddleware
from flask import Flask
import flask

app = Flask(__name__)#, static_folder='static', static_url_path='/')
# http://stackoverflow.com/questions/4239825/static-files-in-flask-robot-txt-sitemap-xml-mod-wsgi
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/': os.path.join(os.path.dirname(__file__), 'static')
})

# NOTE: routes should have trailing slashes

@app.route('/')
def hello():
    return flask.redirect('index.html')

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    debug = True # TODO: don't deploy in debug mode!
    app.run(host='0.0.0.0', port=port, debug=debug)
