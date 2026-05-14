/**
 * Utility to parse user agent string into readable device info
 */
export const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    let deviceType = "Desktop";

    // Browser detection
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) browser = "Internet Explorer";

    // OS detection
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("like Mac") > -1) os = "iOS";

    // Device type detection
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = "Mobile";
    } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/.test(ua.toLowerCase())) {
        deviceType = "Tablet";
    }

    return {
        userAgent: ua,
        browser,
        os,
        deviceType
    };
};
