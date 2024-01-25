// ==UserScript==
// @name         CleanCopy
// @namespace    https://github.com/JustOptimize/CleanCopy/
// @version      0.0.1
// @description  Remove tracking parameters when copying URL from browser address bar or links on the page.
// @author       Oggetto
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/JustOptimize/CleanCopy/main/script.js
// @updateURL    https://raw.githubusercontent.com/JustOptimize/CleanCopy/main/script.js
// ==/UserScript==

const blacklisted_params = [
    "utm_source", // Google Analytics
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_referrer",
    "utm_name",
    "utm_id",
    "fbclid", // Facebook
    "gclid", // Google Ads
    "gclsrc",
    "dclid", // Google Display Ads
    "msclkid", // Microsoft Ads
    "yclid", // Yandex Ads
    "ysclid",
	"si" // Youtube shorts
];

(function() {
    'use strict';

    document.addEventListener('copy', function(e) {
        e.preventDefault();

		const content = e?.target?.innerHTML || e?.target?.formAction;

		if (!content) {
            e.clipboardData.setData('text/plain', '');
			return;
		}

		try{
			const url = new URL(content);

			// Remove blacklisted params
			blacklisted_params.forEach((param) => {
				url.searchParams.delete(param);
			});
	
			// Copy new URL to clipboard
			e.clipboardData.setData('text/plain', url.href);
		}catch(err){
            e.clipboardData.setData('text/plain', content);
			return;
		}
  });
})();