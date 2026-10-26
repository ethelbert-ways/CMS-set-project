CMS 2K26 - INVICTUS  (profile log website)
==========================================

OPEN IT
  Upload the whole folder to any web host (or open index.html in a browser to try it).
  Password: invictus   (small letters)

WHAT TO REPLACE
  images/logo.png              Homepage logo (square PNG, transparent background works best)
  images/favicon.png           Site icon on the browser tab (square, 192x192 or bigger)
  images/apple-touch-icon.png  Icon when saved to a phone home screen (180x180)
  images/slideshow/slide-1.jpg ... slide-6.jpg   Password-page background pictures
  images/students/001.jpg ... 128.jpg   Student photos. Keep the same file names, or change
                               the "photo" path of that student in js/data.js.
  TIP: resize photos before uploading (about 800px wide for students, 1600px for the slideshow)
       so the pages load fast on phones.

WHAT TO EDIT (all text lives in two files)
  js/data.js     128 students (nickname, name, photo, every profile detail) + the awards.
                 A student's "id" number is what the awards list uses.
  js/config.js   Set name, year, password and the "lockOnOffline" switch.

CHANGE THE PASSWORD
  The password is stored as a SHA-256 hash in js/config.js. Make the hash of the new password with
  any online "SHA-256 generator" and paste it into passwordHash.

FOOTER (Homepage, All Students, Awards; not the password page)
  It is written directly in home.html, students.html and awards.html (search for "site-foot").
  The portfolio link is https://ethel-devs-portfolio-new.vercel.app/ in each of the three files;
  change it in all three if your portfolio address changes. The look is under "site footer" in css/style.css.

PAGES
  index.html     password page          home.html     nickname homepage
  students.html  photo cards + pop-up   awards.html    awards (double-click a name)
