"use client";

import Script from "next/script";

export function TawkTo() {
  const token = process.env.NEXT_PUBLIC_CHATWOOT_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;

  if (!token || !baseUrl) return null;

  return (
    <Script
      id="chatwoot-sdk"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(d,t) {
            var BASE_URL="${baseUrl}";
            var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=BASE_URL+"/packs/js/sdk.js";
            g.defer = true; g.async = true;
            s.parentNode.insertBefore(g,s);
            g.onload=function(){
              window.chatwootSDK.run({
                websiteToken: "${token}",
                baseUrl: BASE_URL
              })
            }
          })(document,"script");
        `,
      }}
    />
  );
}
