##
Steps to do for seeding posts
1) Make sure target db does not have `posts` table, remove if existed
2) Export all post json (strigified from firebase)
3) Put them in posts.json, make sure it's valid json
4) Search for "priceUnit": null and replace with "priceUnit": null
5) Search for "condition": "" and replace with "priceUnit": null
6) Search for "areaUnit": "" and replace with "priceUnit": null
7) Search for "landUnit": "" and replace with "landUnit": null
8) Search for "desc": "" and replace with  "desc": "desc"


100) After migrate succesfully, change and redeploy
    @Schema({ timestamps: true })
    export class Post {...}