let usernameDialog = null;

function getUsername() {
  let user = Meteor.user();
  let username = user && user.username;

  if (username && usernameDialog) {
    usernameDialog.modal("hide");
    usernameDialog = null;
    return;
  }

  if (!username && usernameDialog == null) {
    usernameDialog = bootbox.prompt("Enter a username", function(res) {
      res && Meteor.insecureUserLogin(res);
    });
  }
}

Meteor.startup(function(){
  Tracker.autorun(getUsername);
});
