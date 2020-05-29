const fetch = require('node-fetch');
const { getTwitchAccessToken } = require('@jlengstorf/get-twitch-oauth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: JSON.stringify({message: 'You can use CORS'}),
    };
    return(null, response);
  }
  const { user_id } = JSON.parse(event.body);

  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return {
      statusCode: 401,
      body: 'Must provide a Twitch app client ID and secret.',
    };
  }

  // get the server-to-server OAuth token from Twitch
  const { access_token } = await getTwitchAccessToken();

  // send an authenticated request to the Twitch API
  // see https://dev.twitch.tv/docs/api/reference#get-streams
  try {
    const params = user_id ? `?id=${user_id}` : '';
    const response = await fetch(
      `https://api.twitch.tv/helix/users${params}`,
      {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${access_token}`,
        },
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        throw new Error(err.message);
      });

    // Twitch response with 20 streams that are currently live
    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
    
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err.message),
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};
