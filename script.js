// ==UserScript==
// @name         CleanCopy
// @namespace    http://tampermonkey.net/
// @version      2024-01-19
// @description  Remove tracking parameters from copied URLs
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const blacklisted_params = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "gclsrc",
    "dclid",
    "msclkid",
    "yclid",
    "utm_referrer",
    "utm_name",
    "utm_id",
    "ysclid",
];

(function() {
    'use strict';

    document.addEventListener('copy', function(e) {        
		let url = undefined;
		const content = e?.target?.innerHTML;

		if (!content) {
			console.log("No content");
			return;
		}

		try{
			url = new URL(content);
		}catch(err){
			console.log("Not a URL");
			return;
		}

		e.preventDefault();

		// Remove blacklisted params
		blacklisted_params.forEach((param) => {
			url.searchParams.delete(param);
		});

		// Copy new URL to clipboard
		e.clipboardData.setData('text/plain', url.href);
  });
})();