##
Steps to do for seeding posts
1) Make sure target db does not have `posts` table, remove if existed
2) Export all post json (strigified from firebase)
3) Put them in posts.json, make sure it's valid json
4) Search for "priceUnit": ""       =>      "priceUnit": null
5) Search for "condition": ""       =>      "condition": null
6) Search for "areaUnit": ""        =>      "areaUnit": null
7) Search for "landUnit": ""        =>      "landUnit": null
8) Search for "desc": ""            =>      "desc": "desc"


100) After migrate succesfully, change and redeploy
    @Schema({ timestamps: true })
    export class Post {...}