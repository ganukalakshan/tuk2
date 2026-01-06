<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'JPoS') }}</title>

        <link rel="icon" href="/jaanNetworklogo.jpeg" type="image/jpeg">
        <link rel="apple-touch-icon" href="/jaanNetworklogo.jpeg">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
    </head>
    <body class="font-sans antialiased bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-800">
        <div id="app"></div>
    </body>
</html>
