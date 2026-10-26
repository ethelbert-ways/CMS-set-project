/* ==========================================================================
   CMS 2K26 · INVICTUS  —  SITE SETTINGS
   ========================================================================== */
window.CMS = window.CMS || {};

CMS.site = {
  schoolName: "C.M.S. Grammar School, Lagos",
  setName: "Invictus",
  year: "2K26",

  // The password is stored as a SHA-256 hash, so it can not be read in the page source.
  // Current password:  invictus   (all small letters)
  // To change it: take the SHA-256 hash of the new password (any online "SHA-256 generator")
  // and paste it between the quotes below.
  passwordHash: "d901a8a437b7a0b5cf06762eab61908210378b7033c07a0a6b447cbdcfa23053",

  // true  = if the internet connection drops, the session ends and the password is asked again.
  // false = connection drops are ignored.
  lockOnOffline: true
};
