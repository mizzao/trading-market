Npm.depends({
    json2csv: "2.2.1"
});

Package.on_use(function (api) {
    api.add_files('server.js', 'server');

    api.export('json2csv', 'server');
});
