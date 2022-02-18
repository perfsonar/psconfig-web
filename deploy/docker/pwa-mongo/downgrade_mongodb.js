// Downgrades MongoDB 4.2 Standalone to 4.0
// For use with Docker installations of pSConfig Web Admin (PWA) < 5.0

print("*** Starting downgrade_mongodb.js ***");

let ver = db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 });

if (ver.featureCompatibilityVersion.version == 4.2) {
    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#1.-downgrade-feature-compatibility-version--fcv-
    db.adminCommand({ setFeatureCompatibilityVersion: "4.0" });
    print("FeatureCompatibilityVersion set to 4.0");

    db.getCollectionNames().forEach(function (collection) {
        let indexes = db[collection].getIndexes();
        indexes.forEach(function (index) {
            // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2a.-index-key-size
            if (Object.bsonsize(index) > 1024) {
                print(
                    "Total size of the " +
                        index.name +
                        " index for " +
                        collection +
                        " exceeds 1024 bytes!\nhttps://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2a.-index-key-size"
                );
            }

            // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2b.-index-name-length
            let fqin = db + "." + collection + ".$" + index.name;
            if (fqin.length > 127) {
                print(
                    "The fully qualified index name " +
                        fqin +
                        " exceeds 127 bytes!\nhttps://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2b.-index-name-length"
                );
            }
        });
    });

    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2c.-unique-index-version
    db.adminCommand("listDatabases").databases.forEach(function (d) {
        let mdb = db.getSiblingDB(d.name);

        mdb.getCollectionInfos({ type: "collection" }).forEach(function (c) {
            let currentCollection = mdb.getCollection(c.name);

            currentCollection.getIndexes().forEach(function (idx) {
                if (idx.unique) {
                    print(
                        "Dropping and recreating the following index:" +
                            tojson(idx)
                    );

                    assert.commandWorked(
                        mdb.runCommand({ dropIndexes: c.name, index: idx.name })
                    );

                    let res = mdb.runCommand({
                        createIndexes: c.name,
                        indexes: [idx],
                    });
                    if (res.ok !== 1) assert.commandWorked(res);
                }
            });
        });
    });

    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2d.-remove-user_1_db_1-system-unique-index
    db.getSiblingDB("admin")
        .getCollection("system.users")
        .dropIndex("user_1_db_1");
    print("Removed user_1_db_1 system unique index");

    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2e.-remove-wildcard-indexes
    db.adminCommand("listDatabases").databases.forEach(function (d) {
        let mdb = db.getSiblingDB(d.name);
        mdb.getCollectionInfos({ type: "collection" }).forEach(function (c) {
            let currentCollection = mdb.getCollection(c.name);
            currentCollection.getIndexes().forEach(function (idx) {
                var key = Object.keys(idx.key);
                if (key[0].includes("$**")) {
                    print("Dropping index: " + idx.name + " from " + idx.ns);

                    let res = mdb.runCommand({
                        dropIndexes: currentCollection,
                        index: idx.name,
                    });
                    assert.commandWorked(res);
                }
            });
        });
    });

    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#2f.-view-definitions-collection-validation-definitions-that-include-4.2-operators
    // Skipping

    // https://docs.mongodb.com/manual/release-notes/4.2-downgrade-standalone/#5.-remove-client-side-field-level-encryption-document-validation-keywords
    // Skipping
    // db.runComand({ "collMod" : "<collection>", "validator" : {} })

    print("Downgrade complete! You can now use the mongo:4.0.3 docker image.");
} else {
    print("MongoDB not downgraded: featureCompatibilityVersion != 4.2");
}

print("*** Finished downgrade_mongodb.js ***");
