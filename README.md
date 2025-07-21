# BazarXpress Frontend

## Environment Variables

For local development, you can create a `.env.local` file in the Frontend directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Alternatively, the application will use the default values from the config file (`lib/config.ts`).

## Development

To start the development server:

```bash
npm run dev
```

## Build

To build the application:

```bash
npm run build
```

## Start

To start the production server:

```bash
npm start
``` 