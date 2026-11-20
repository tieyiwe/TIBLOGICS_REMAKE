TIBLOGICS — paid digital product files.

This directory is intentionally OUTSIDE /public. Anything in /public is
served by the web server to anyone who guesses the URL, which would give
away paid products for free.

Files here are only ever reachable through /api/shop/download/[token],
which checks that the token belongs to a paid, unexpired, under-limit
DownloadGrant before streaming a single byte.

To attach a file to a product, set the product's fileKey to the filename
here (e.g. "ai-cost-model.csv") and deliveryType to "download".
