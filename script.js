// ==UserScript==
// @name         CleanCopy
// @namespace    https://github.com/JustOptimize/CleanCopy/
// @version      0.0.4
// @description  Remove tracking parameters when copying URL
// @author       Oggetto
// @match        https://*/*
// @icon         https://github.com/JustOptimize/CleanCopy/blob/main/icon.png?raw=true
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
	"si",  // Youtube shorts
    "sender_device",
    "sender_web_id",
    "share",
    "share_source",
    "is_from_webapp"
];

(function() {
    'use strict';

    document.addEventListener('copy', function(e) {
        e.preventDefault();

        const content = document.getSelection()?.toString();

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