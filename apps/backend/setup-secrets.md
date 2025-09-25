# Setting up Required Secrets

To fix the "invalid response from streamline" error, you need to set up the required API keys as secrets in your Cloudflare Workers environment.

## Required Secrets

Run these commands in your backend directory:

```bash
# Set Deepgram API key for speech-to-text
wrangler secret put DEEPGRAM_API_KEY

# Set ElevenLabs API key for text-to-speech  
wrangler secret put ELEVENLABS_API_KEY

# Set Cloudflare Account ID
wrangler secret put ACCOUNT_ID

# Set Cloudflare API Token
wrangler secret put API_TOKEN
```

## Getting API Keys

### Deepgram API Key
1. Go to [Deepgram Console](https://console.deepgram.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and use it for `DEEPGRAM_API_KEY`

### ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Create an account or sign in
3. Go to Profile → API Keys
4. Create a new API key
5. Copy the key and use it for `ELEVENLABS_API_KEY`

### Cloudflare Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Copy the Account ID from the right sidebar
4. Use it for `ACCOUNT_ID`

### Cloudflare API Token
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - Account: `Cloudflare Workers:Edit`
   - Zone: `Zone:Read` (if needed)
5. Copy the token and use it for `API_TOKEN`

## Deploy After Setting Secrets

After setting all secrets, deploy your worker:

```bash
wrangler deploy
```

## Test the Agent

Once deployed, test with your curl command:

```bash
curl -X POST 'https://agents-backend.aruparekh2.workers.dev/init?meetingId=bbbfcff0-14cf-4bec-9e37-a35d89fecf7e' \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Session-ID: your-session-id-here"
```

The agent should now properly join the meeting without the "invalid response from streamline" error.
