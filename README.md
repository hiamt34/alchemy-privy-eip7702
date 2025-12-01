## Setup

1. Clone this repository and open it in your terminal.

```sh
git https://github.com/hiamt34/alchemy-privy-eip7702.git
```

2. Install the necessary dependencies with `npm`.

```sh
npm i
```

3. Initialize your environment variables by copying the `.env.example` file to an `.env.local` file. Then, in `.env.local` paste
   - your [Alchemy API Key](https://dashboard.alchemy.com/apps)
   - you Alchemy [gas sponsorship policy ID](https://dashboard.alchemy.com/services/gas-manager/overview) (this is where you will define how you want to sponsor gas for your users)
   - your Privy App ID

```sh
# In your terminal, create .env.local from .env.example
cp .env.example .env.local
```

## Building locally

In your project directory, run `npm run dev`. You can now visit http://localhost:3000 to see your app.
