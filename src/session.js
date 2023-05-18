// Creates the user's session cookie
export function createCookie(sessionID) {
	document.cookie = `sessionID=${sessionID};path=/;SameSite=Strict;`;
}

// Returns value corresponding to key from cookie
export function getCookie(cookieKey) {
	var value = null;
	const key = cookieKey +'=';
	const cookieList = decodeURIComponent(document.cookie).split(';');
	cookieList.forEach((cookie) => {
		if (cookie.indexOf(key) == 0) {
			value = cookie.substring(key.length);
		}
	});
	
	// Check if found key but value is null
	return (value != null && value.length != 0) ? value : null;
}

// Remove sessionID from cookie
export function deleteCookie() {
	document.cookie = 'sessionID=;path=/;SameSite=Strict;';
}