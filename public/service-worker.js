/*
 * Cleanup service worker for deployments that no longer use Workbox precaching.
 * Existing browsers with an older registered /service-worker.js will update to
 * this script, clear stale caches, unregister the worker, and reload clients so
 * top-level navigations can reach Cloudflare challenge pages instead of a cached
 * app shell.
 */

self.addEventListener("install", function () {
    self.skipWaiting();
});

function withoutWorkboxRevision(rawUrl) {
    try {
        var url = new URL(rawUrl);
        url.searchParams.delete("__WB_REVISION__");
        return url.href;
    } catch (_) {
        return rawUrl;
    }
}

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches
            .keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
            .then(function () {
                return self.registration.unregister();
            })
            .then(function () {
                return self.clients.matchAll({
                    type: "window",
                    includeUncontrolled: true,
                });
            })
            .then(function (clients) {
                return Promise.all(
                    clients.map(function (client) {
                        if (!client.navigate) {
                            return undefined;
                        }
                        return client.navigate(withoutWorkboxRevision(client.url));
                    })
                );
            })
    );
});
