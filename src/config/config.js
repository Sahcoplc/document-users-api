export const config = {
    "authOptions":
        {
            "clientId": "82198f52-e4f3-4856-8368-f8aa3e99ba2a",
            "authority": "https://login.microsoftonline.com/67c8fe45-d9c9-4d90-8a08-c5e8f3402ac3",
            "clientSecret": "ahy8Q~A-~XW9P8X512GtQfsvk1iB4cR8H4ah~dp8"
        },
    "request":
    {
        "authCodeUrlParameters": {
            "scopes": ["user.read"],
            "redirectUri": "https://sahcocareers.com/index.html"
        },
        "tokenRequest": {
            "scopes": ["user.read"],
            "redirectUri": "https://sahcocareers.com/index.html",
        }
    },
    "resourceApi":
    {
        "endpoint": "https://graph.microsoft.com/v1.0/me"
    }
}