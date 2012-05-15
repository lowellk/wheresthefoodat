## Setup

You need to register a developer account at https://foursquare.com/oauth/.
Then create an app and take note of the clientId. You need to pass this to
your app as an environment variable. To create the app, you will need to 'register a new consumer'.
For both its website and callback url, put 'http://localhost:5000' (this is for the dev setup).

You also need to create a developer account at http://www.yelp.com/developers/getting_started/api_access.
You must then generate API keys and take note of the following keys and values:
Consumer Key, Consumer Secret, Token, Token Secret. These also need to be set as environment variables
for your app (i.e. Consumer Key -> CONSUMER_KEY).

## API Keys

To get the app working locally, put all the keys in a file called '.env'. It should contain one
line for each key/value pair and each line should be of the form:

    KEY=VALUE

### Developement

Install libraries via 'pip install -r requirements.txt'. You probably want
to use virtualenv for this app (Google it if you don't know how).

Run the app via 'foreman start -f Procfile.dev'.

Make sure your app works by going to a web browser and visit http://localhost:5000.

### Local Production Instance

Run the app via 'foreman start'.

Make sure your app works by going to a web browser and visit http://localhost:5000.

### Heroku Production Instance

Create a heroku app.

Configure all the environment variables mentioned above using
https://devcenter.heroku.com/articles/config-vars

Deploy and test.