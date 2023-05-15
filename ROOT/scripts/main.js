var webSqlApp = webSqlApp || {};
webSqlApp = {

//______Session______
    setSession: function (name, fullName) {
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('INSERT INTO sessionUser(username, userFullName) VALUES(?, ?)',
            [name, fullName],
            function (transaction, results) {
                console.log('Logged In');
            });
      }, this.onError, this.onSuccess("No Error"));
    },

//______Database______

    version: '0.0',

    onError: function (err) {
        console.log('Error Code:', err.code, 'Message: ', err.message);
    },

    onSuccess: function (success) {
        console.log(success);
    },

    openDb: function (ver) {
        var db = openDatabase('HCItemRecords', ver, 'Happy Citizens Item Records', 5 * 1024 * 1024);
        this.version = ver;
        return db;
    },

    addTable: function () {
        if (this.version === '1.0') {
            var db = this.openDb('1.0');

            db.changeVersion('1.0', '2.0', createTables, this.onError, this.onSuccess('Tables added'));
            return db;
        } else {
            console.log('Table already exists');
        }

        function createTables(transaction) {
            transaction.executeSql("CREATE TABLE IF NOT EXISTS login(" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "username TEXT UNIQUE, " +
                "password TEXT)"
            );
            transaction.executeSql("CREATE TABLE IF NOT EXISTS userInfo(" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "username TEXT UNIQUE, " +
                "firstName TEXT, " +
                "lastName TEXT)"
            );
            transaction.executeSql("CREATE TABLE IF NOT EXISTS sessionUser(" +
                "username TEXT PRIMARY KEY, " +
                "userFullName TEXT)"
            );
            transaction.executeSql("CREATE TABLE IF NOT EXISTS property(" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "username TEXT, " +
                "propertyName TEXT)"
            );
            transaction.executeSql("CREATE TABLE IF NOT EXISTS propertyShared(" +
                "id INTEGER PRIMARY KEY, " +
                "username TEXT, " +
                "propertyName TEXT, " +
                "sharedUser TEXT)"
            );
        }


    },

    register: function (username, password, con_password, firstName, lastName) {
        var db = this.openDb('2.0');
        db.transaction(function (t) {
            t.executeSql('SELECT * FROM login WHERE username = ?',
                [username],
                function (transaction, results) {
                    if(results.rows.length == 0){
                      if(password.localeCompare(con_password)!=0){
                        document.getElementById('output').innerHTML = "Passwords do not match.";
                        return;
                      }
                      else{
                        t.executeSql('INSERT INTO login(username, password) VALUES(?, ?)',
                            [username, password],
                            function (transaction, results) {
                                console.log('Inserted Id:', results.insertId);
                            });
                        t.executeSql('INSERT INTO userInfo(username, firstName, lastName) VALUES(?, ?, ?)',
                            [username, firstName, lastName],
                            function (transaction, results) {
                                console.log('Inserted Id:', results.insertId);
                            });
                        window.location.replace("../common/login.html");
                      }
                    }
                    else {
                      document.getElementById('output').innerHTML = "Username/Email already exists";
                    }
                });
        }, this.onError, this.onSuccess("No Error"));
    },

    login: function (username, password) {
        var sessName;
        var sessFullName;
        var db = this.openDb('2.0');
        db.transaction(function (t) {
            t.executeSql('SELECT * FROM login WHERE username = ?',
                [username],
                function (transaction, results) {
                    if(results.rows.length == 0){
                      document.getElementById('output').innerHTML = "Username/Password is incorrect";
                    }
                    else if(results.rows.item(0).password.localeCompare(password) == 0){
                      document.getElementById('output').innerHTML = "Login Successful";
                      t.executeSql('SELECT * FROM userInfo WHERE username = ?',
                          [username],
                          function (transaction, results) {
                            sessName = results.rows.item(0).username;
                            sessFullName = results.rows.item(0).firstName + " " + results.rows.item(0).lastName;
                            webSqlApp.setSession(sessName, sessFullName);
                            setTimeout(() => { window.location.replace("../common/dashboard.html"); }, 1000);
                      });
                    }
                    else{
                      document.getElementById('output').innerHTML = "Username/Password is incorrect";
                    }
                });
        }, this.onError, this.onSuccess("No Error"));
    },

    logout: function(){
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('DELETE FROM sessionUser', []);
      }, this.onError, this.onSuccess("No Error"));
    },

    viewProperty: function(){
      var username;
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('SELECT * FROM sessionUser',
            [],
            function (transaction, results) {
              username = results.rows.item(0).username;
              t.executeSql('SELECT * FROM property WHERE username = ?',
                  [username],
                  function (transaction, results) {
                      if(results.rows.length == 0){
                        alert("You have no Properties Saved");
                      }
                      else{
                        document.getElementById('propertyList').innerHTML = "";
                        for (let i = 0; i < results.rows.length; i++) {
                          document.getElementById('propertyList').innerHTML += results.rows.item(i).id + " " + results.rows.item(i).propertyName + "<br>";
                        }
                      }
                  });
              });
      }, this.onError, this.onSuccess("No Error"));
    },

    viewSharedProperty: function(){
      var username;
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('SELECT * FROM sessionUser',
            [],
            function (transaction, results) {
              username = results.rows.item(0).username;
              t.executeSql('SELECT * FROM propertyShared WHERE username = ?',
                  [username],
                  function (transaction, results) {
                      if(results.rows.length == 0){
                        alert("You are not Sharing Any Properties");
                      }
                      else{
                        document.getElementById('sharedPropertyList').innerHTML = "";
                        for (let i = 0; i < results.rows.length; i++) {
                          document.getElementById('sharedPropertyList').innerHTML += results.rows.item(i).id + " " + results.rows.item(i).propertyName + "<br>";
                        }
                      }
                  });
              });
      }, this.onError, this.onSuccess("No Error"));
    },

    viewPropertySharedWith: function(){
      var username;
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('SELECT * FROM sessionUser',
            [],
            function (transaction, results) {
              username = results.rows.item(0).username;
              t.executeSql('SELECT * FROM propertyShared WHERE sharedUser = ?',
                  [username],
                  function (transaction, results) {
                      if(results.rows.length == 0){
                        alert("No Properties Shared With You");
                      }
                      else{
                        document.getElementById('propertySharedWithList').innerHTML = "";
                        for (let i = 0; i < results.rows.length; i++) {
                          document.getElementById('propertySharedWithList').innerHTML += results.rows.item(i).id + " " + results.rows.item(i).propertyName + "<br>";
                        }
                      }
                  });
              });
      }, this.onError, this.onSuccess("No Error"));
    },

    addProperty: function(propertyName){
      var username;
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('SELECT * FROM sessionUser',
            [],
            function (transaction, results) {
              username = results.rows.item(0).username;
              t.executeSql('INSERT INTO property(username, propertyName) VALUES(?, ?)',
                  [username, propertyName],
                  function (transaction, results) {
                    console.log('Inserted Id:', results.insertId);
                });
              });
      }, this.onError, this.onSuccess("No Error"));
      alert("Property Successfully Added");
    },

    updateProperty: function(newPropertyName, propertyID){
      var db = this.openDb('2.0');
      db.transaction(function (t) {
          t.executeSql('UPDATE property SET propertyName = ? WHERE id = ?',
              [newPropertyName, propertyID]);
      }, this.onError, this.onSuccess('No Error'));
      db.transaction(function (t) {
          t.executeSql('UPDATE propertyShared SET propertyName = ? WHERE id = ?',
              [newPropertyName, propertyID]);
      }, this.onError, this.onSuccess('No Error'));
      alert("Property Successfully Updated");
    },

    deleteProperty: function(propertyID){
      var db = this.openDb('2.0');
      db.transaction(function (t) {
          t.executeSql('DELETE FROM property WHERE id = ?', [propertyID]);
      }, this.onError, this.onSuccess('NoError'));
      db.transaction(function (t) {
          t.executeSql('DELETE FROM propertyShared WHERE id = ?', [propertyID]);
      }, this.onError, this.onSuccess('NoError'));
      alert("Property Successfully Deleted");
    },

    shareProperty: function(propertyID, sharedUser){
      var username;
      var db = this.openDb('2.0');
      db.transaction(function (t) {
        t.executeSql('SELECT * FROM sessionUser',
            [],
            function (transaction, results) {
              username = results.rows.item(0).username;
              t.executeSql('SELECT * FROM property WHERE id = ? AND username = ?',
                  [propertyID, username],
                  function (transaction, results) {
                    if(results.rows.length == 0){
                      alert("You do not own that Property or it does not Exist");
                    }
                    else{
                      username = results.rows.item(0).username;
                      propertyName = results.rows.item(0).propertyName;
                      t.executeSql('INSERT INTO propertyShared(id, username, propertyName, sharedUser) VALUES(?, ?, ?, ?)',
                          [propertyID, username, propertyName, sharedUser],
                          function (transaction, results) {
                              console.log('Inserted Id:', results.insertId);
                        });
                      alert("Property Successfully Shared");
                    }
                  });
            });
      }, this.onError, this.onSuccess("No Error"));
    },

    updateSharedProperty: function(newPropertyName, propertyID){
      var db = this.openDb('2.0');
      db.transaction(function (t) {
          t.executeSql('UPDATE propertyShared SET propertyName = ? WHERE id = ?',
              [newPropertyName, propertyID]);
      }, this.onError, this.onSuccess('No Error'));
    },

    deleteSharedProperty: function(propertyID){
      var db = this.openDb('2.0');
      db.transaction(function (t) {
          t.executeSql('DELETE FROM propertyShared WHERE id = ?', [propertyID]);

      }, this.onError, this.onSuccess('NoError'));
    }
};

//Page Specific Features

function loginOnLoad() {
  webSqlApp.logout();
  document.getElementById('btnLogin').addEventListener('click', function () {
      var username = document.getElementById('username').value;
      var password = document.getElementById('password').value;
      webSqlApp.login(username, password);
  });
};

function registerOnLoad() {
  webSqlApp.logout();
  document.getElementById('btnRegister').addEventListener('click', function () {
      var username = document.getElementById('username').value;
      var password = document.getElementById('password').value;
      var con_password = document.getElementById('con_password').value;
      var firstName = document.getElementById('firstName').value;
      var lastName = document.getElementById('lastName').value;
      webSqlApp.register(username, password, con_password, firstName, lastName);
  });
};

function dashboardOnLoad() {
  var db = webSqlApp.openDb('2.0');
  db.transaction(function (t) {
    t.executeSql('SELECT * FROM sessionUser',
        [],
        function (transaction, results) {
             document.getElementById('loginFullName').innerHTML = results.rows.item(0).userFullName;
        });
  }, webSqlApp.onError, webSqlApp.onSuccess("No Error"));
  document.getElementById('btnViewProperty').addEventListener('click', function () {
      webSqlApp.viewProperty();
  });
  document.getElementById('btnAddProperty').addEventListener('click', function () {
      var propertyName = document.getElementById('propertyName').value;
      webSqlApp.addProperty(propertyName);
  });
  document.getElementById('btnUpdateProperty').addEventListener('click', function () {
      var updatePropertyID = document.getElementById('updatePropertyID').value;
      var updatePropertyName = document.getElementById('updatePropertyName').value;
      webSqlApp.updateProperty(updatePropertyName, updatePropertyID);
  });
  document.getElementById('btnDeleteProperty').addEventListener('click', function () {
      var deletePropertyID = document.getElementById('deletePropertyID').value;
      webSqlApp.deleteProperty(deletePropertyID);
  });
  document.getElementById('btnViewSharedProperty').addEventListener('click', function () {
      webSqlApp.viewSharedProperty();
  });
  document.getElementById('btnShareProperty').addEventListener('click', function () {
      var sharedPropertyID = document.getElementById('sharedPropertyID').value;
      var sharedPropertyUser = document.getElementById('sharedPropertyUser').value;
      webSqlApp.shareProperty(sharedPropertyID, sharedPropertyUser);
  });
  document.getElementById('btnUpdateSharedProperty').addEventListener('click', function () {
      var updateSharedPropertyID = document.getElementById('updateSharedPropertyID').value;
      var updateSharedPropertyName = document.getElementById('updateSharedPropertyName').value;
      webSqlApp.updateSharedProperty(updateSharedPropertyName, updateSharedPropertyID);
  });
  document.getElementById('btnDeleteSharedProperty').addEventListener('click', function () {
      var deleteSharedPropertyID = document.getElementById('deleteSharedPropertyID').value;
      webSqlApp.deleteSharedProperty(deleteSharedPropertyID);
  });
  document.getElementById('btnViewPropertySharedWith').addEventListener('click', function () {
      webSqlApp.viewPropertySharedWith();
  });
};

function indexOnLoad(){
  var txtKey = document.getElementById('txtKey'),
      txtVal = document.getElementById('txtVal');
  var db;
  try {
      db = webSqlApp.openDb('1.0');
      webSqlApp.onSuccess('db created.');
  } catch (error) {
      console.log('Database already created');
  }
  try {
      db = webSqlApp.addTable();
  } catch (error) {
      console.log('Table already exists')
  }
  webSqlApp.logout();
};

function aboutOnLoad(){
  webSqlApp.logout();
};

function contactOnLoad(){
  webSqlApp.logout();
};
