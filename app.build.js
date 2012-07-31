({
    baseUrl: ".",
    name: "scripts/lib/almond",
    out: "scripts/build/app.bayes.js",
    include: "scripts/main",
    paths: {
        main: "scripts/main",
        app: "scripts/app",
        underscore: "scripts/lib/underscore",
        jquery: "scripts/lib/jquery",
        text: "scripts/lib/text"
    }
})